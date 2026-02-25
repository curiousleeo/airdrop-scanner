import { NextRequest, NextResponse } from "next/server";

export interface HyperliquidStats {
  wallet: string;
  totalVolumeUSD: number;
  lifetimePnl: number;
  totalFeesPaid: number;
  activeDayCount: number;
  firstActiveDate: string | null;
  lastActiveDate: string | null;
  walletAge: number;
  hypeBalance: number;
  receivedS1Airdrop: boolean;
  openPositions: number;
  score: number; // 0-100
  tier: "legendary" | "high" | "medium" | "low" | "none";
  error?: string;
}

interface HL_DayVlm {
  date: string;
  userCross: string;
  userAdd: string;
  exchange: string;
}

async function hlPost(body: object): Promise<Response> {
  return fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const [feesRes, portfolioRes, stateRes] = await Promise.allSettled([
      hlPost({ type: "userFees", user: wallet }),
      hlPost({ type: "portfolio", user: wallet }),
      hlPost({ type: "clearinghouseState", user: wallet }),
    ]);

    // Volume from daily fees data
    let totalVolumeUSD = 0;
    let totalFeesPaid = 0;
    let activeDayCount = 0;
    let firstActiveDate: string | null = null;
    let lastActiveDate: string | null = null;

    if (feesRes.status === "fulfilled") {
      try {
        const feesData = await feesRes.value.json();
        const allDays: HL_DayVlm[] = feesData?.dailyUserVlm ?? [];
        // Only count days where the user actually traded (userCross or userAdd > 0)
        const activeDays = allDays.filter(
          (d) => Number(d.userCross ?? 0) + Number(d.userAdd ?? 0) > 0
        );
        activeDayCount = activeDays.length;
        if (activeDays.length) {
          const sorted = [...activeDays].sort((a, b) => a.date.localeCompare(b.date));
          firstActiveDate = sorted[0]?.date ?? null;
          lastActiveDate = sorted[sorted.length - 1]?.date ?? null;
          activeDays.forEach((d) => {
            totalVolumeUSD += Number(d.userCross ?? 0) + Number(d.userAdd ?? 0);
          });
        }
        // Fee schedule info
        const feeSchedule = feesData?.feeSchedule;
        if (feeSchedule) {
          // Estimate fees: ~0.04% taker, 0.01% maker average
          totalFeesPaid = totalVolumeUSD * 0.0003;
        }
      } catch { /* ignore */ }
    }

    // P&L from portfolio
    let lifetimePnl = 0;
    if (portfolioRes.status === "fulfilled") {
      try {
        const portfolioData = await portfolioRes.value.json();
        // allTime pnl is in the portfolio array format: [[timestamp, pnl], ...]
        if (Array.isArray(portfolioData)) {
          const allTimeEntry = portfolioData.find(
            (entry: [string, number[][]]) => entry[0] === "allTime"
          );
          if (allTimeEntry && Array.isArray(allTimeEntry[1]) && allTimeEntry[1].length) {
            const lastEntry = allTimeEntry[1][allTimeEntry[1].length - 1];
            if (Array.isArray(lastEntry) && lastEntry.length >= 2) {
              lifetimePnl = Number(lastEntry[1]);
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Positions and HYPE balance
    let openPositions = 0;
    let hypeBalance = 0;
    if (stateRes.status === "fulfilled") {
      try {
        const state = await stateRes.value.json();
        openPositions = (state?.assetPositions ?? []).filter(
          (p: { position?: { szi?: string } }) => Number(p?.position?.szi ?? 0) !== 0
        ).length;
        // Check HYPE in spot balances
        const spotState = state?.crossMarginSummary?.accountValue ?? 0;
        hypeBalance = Number(spotState);
      } catch { /* ignore */ }
    }

    // Check spot balances for HYPE token directly
    let receivedS1Airdrop = false;
    try {
      const spotRes = await hlPost({ type: "spotClearinghouseState", user: wallet });
      if (spotRes.ok) {
        const spotData = await spotRes.json();
        const balances = spotData?.balances ?? [];
        const hypeEntry = balances.find((b: { coin: string; total: string }) => b.coin === "HYPE");
        if (hypeEntry) {
          hypeBalance = Number(hypeEntry.total ?? 0);
          receivedS1Airdrop = hypeBalance > 0 || totalVolumeUSD > 0;
        }
      }
    } catch { /* ignore */ }

    // Wallet age estimate
    const walletAge = firstActiveDate
      ? Math.floor((Date.now() - new Date(firstActiveDate).getTime()) / 86400000)
      : 0;

    // Season 2 eligibility scoring
    // Volume tiers (perp trading is primary signal):
    // <$1k = 0, $1k-$10k = 10, $10k-$50k = 20, $50k-$200k = 35, $200k-$1M = 50, $1M+ = 65
    let score = 0;
    if (totalVolumeUSD >= 1_000_000) score += 65;
    else if (totalVolumeUSD >= 200_000) score += 50;
    else if (totalVolumeUSD >= 50_000) score += 35;
    else if (totalVolumeUSD >= 10_000) score += 20;
    else if (totalVolumeUSD >= 1_000) score += 10;

    // Active days: 5+ = 5, 15+ = 10, 30+ = 15, 60+ = 20
    if (activeDayCount >= 60) score += 20;
    else if (activeDayCount >= 30) score += 15;
    else if (activeDayCount >= 15) score += 10;
    else if (activeDayCount >= 5) score += 5;

    // HYPE staking/holding bonus: 10+ = 5, 100+ = 10, 1000+ = 15
    if (hypeBalance >= 1000) score += 15;
    else if (hypeBalance >= 100) score += 10;
    else if (hypeBalance >= 10) score += 5;

    const tier: HyperliquidStats["tier"] =
      score >= 80 ? "legendary" :
      score >= 55 ? "high" :
      score >= 30 ? "medium" :
      score >= 10 ? "low" : "none";

    const stats: HyperliquidStats = {
      wallet,
      totalVolumeUSD: Math.round(totalVolumeUSD),
      lifetimePnl: Math.round(lifetimePnl * 100) / 100,
      totalFeesPaid: Math.round(totalFeesPaid * 100) / 100,
      activeDayCount,
      firstActiveDate,
      lastActiveDate,
      walletAge,
      hypeBalance: Math.round(hypeBalance * 100) / 100,
      receivedS1Airdrop,
      openPositions,
      score,
      tier,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", wallet } as HyperliquidStats,
      { status: 500 }
    );
  }
}
