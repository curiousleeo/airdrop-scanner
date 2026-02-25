import { NextRequest, NextResponse } from "next/server";

export interface PolymarketStats {
  wallet: string;
  totalVolumeUSDC: number;
  marketsTraded: number;
  totalTrades: number;
  firstTradeDate: string | null;
  lastTradeDate: string | null;
  openPositions: number;
  closedPositions: number;
  walletAge: number; // days
  score: number; // 0-100
  tier: "legendary" | "high" | "medium" | "low" | "none";
  error?: string;
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
      if (res.ok) return res;
    } catch {
      if (i === retries) throw new Error(`Failed to fetch ${url}`);
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const [profileRes, tradedRes, activityRes, positionsRes] = await Promise.allSettled([
      fetchWithRetry(`https://gamma-api.polymarket.com/public-profile?address=${wallet}`),
      fetchWithRetry(`https://data-api.polymarket.com/traded?user=${wallet}`),
      fetchWithRetry(`https://data-api.polymarket.com/activity?user=${wallet}&limit=500&type=TRADE`),
      fetchWithRetry(`https://data-api.polymarket.com/positions?user=${wallet}&sizeThreshold=.1`),
    ]);

    // Markets traded count
    let marketsTraded = 0;
    if (tradedRes.status === "fulfilled") {
      try {
        const data = await tradedRes.value.json();
        marketsTraded = data?.traded ?? 0;
      } catch { /* ignore */ }
    }

    // Activity / volume
    let totalVolumeUSDC = 0;
    let totalTrades = 0;
    let firstTradeDate: string | null = null;
    let lastTradeDate: string | null = null;
    if (activityRes.status === "fulfilled") {
      try {
        const activities = await activityRes.value.json();
        if (Array.isArray(activities)) {
          totalTrades = activities.length;
          activities.forEach((a: { usdcSize?: number; size?: number; timestamp?: number }) => {
            totalVolumeUSDC += Number(a.usdcSize ?? a.size ?? 0);
          });
          const timestamps = activities
            .map((a: { timestamp?: number }) => a.timestamp)
            .filter(Boolean)
            .sort();
          if (timestamps.length) {
            firstTradeDate = new Date(timestamps[0]! * 1000).toISOString().split("T")[0]!;
            lastTradeDate = new Date(timestamps[timestamps.length - 1]! * 1000).toISOString().split("T")[0]!;
          }
        }
      } catch { /* ignore */ }
    }

    // Positions
    let openPositions = 0;
    if (positionsRes.status === "fulfilled") {
      try {
        const pos = await positionsRes.value.json();
        openPositions = Array.isArray(pos) ? pos.length : 0;
      } catch { /* ignore */ }
    }

    // Wallet age from profile
    let walletAge = 0;
    if (profileRes.status === "fulfilled") {
      try {
        const profile = await profileRes.value.json();
        if (profile?.createdAt) {
          const created = new Date(profile.createdAt).getTime();
          walletAge = Math.floor((Date.now() - created) / 86400000);
        }
      } catch { /* ignore */ }
    }
    if (!walletAge && firstTradeDate) {
      walletAge = Math.floor((Date.now() - new Date(firstTradeDate).getTime()) / 86400000);
    }

    // Scoring — based on Polymarket airdrop signal research
    // Volume tiers: <$100 = 0pts, $100-$1k = 10, $1k-$5k = 20, $5k-$25k = 35, $25k-$100k = 50, $100k+ = 65
    let score = 0;
    if (totalVolumeUSDC >= 100000) score += 65;
    else if (totalVolumeUSDC >= 25000) score += 50;
    else if (totalVolumeUSDC >= 5000) score += 35;
    else if (totalVolumeUSDC >= 1000) score += 20;
    else if (totalVolumeUSDC >= 100) score += 10;

    // Market diversity: 5+ = 5pts, 20+ = 10, 50+ = 15, 100+ = 20
    if (marketsTraded >= 100) score += 20;
    else if (marketsTraded >= 50) score += 15;
    else if (marketsTraded >= 20) score += 10;
    else if (marketsTraded >= 5) score += 5;

    // Wallet age: 30d+ = 5, 90d+ = 10, 180d+ = 15
    if (walletAge >= 180) score += 15;
    else if (walletAge >= 90) score += 10;
    else if (walletAge >= 30) score += 5;

    const tier: PolymarketStats["tier"] =
      score >= 80 ? "legendary" :
      score >= 55 ? "high" :
      score >= 30 ? "medium" :
      score >= 10 ? "low" : "none";

    const stats: PolymarketStats = {
      wallet,
      totalVolumeUSDC: Math.round(totalVolumeUSDC * 100) / 100,
      marketsTraded,
      totalTrades,
      firstTradeDate,
      lastTradeDate,
      openPositions,
      closedPositions: totalTrades,
      walletAge,
      score,
      tier,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", wallet } as PolymarketStats,
      { status: 500 }
    );
  }
}
