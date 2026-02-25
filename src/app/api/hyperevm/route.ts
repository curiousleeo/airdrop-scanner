import { NextRequest, NextResponse } from "next/server";

export interface HyperEVMStats {
  wallet: string;
  txCount: number;
  hypeBalance: number;
  tokenCount: number;
  uniqueContracts: number;
  firstTxDate: string | null;
  lastTxDate: string | null;
  walletAge: number;
  score: number;
  tier: "legendary" | "high" | "medium" | "low" | "none";
  error?: string;
}

const EVM_RPC = "https://rpc.hyperliquid.xyz/evm";
const EXPLORER = "https://www.hyperscan.com";

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(EVM_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return data.result;
}

async function explorerGet(path: string): Promise<Response> {
  return fetch(`${EXPLORER}${path}`, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const [txCountRaw, balanceRaw, txListRes, tokenRes] = await Promise.allSettled([
      rpcCall("eth_getTransactionCount", [wallet, "latest"]),
      rpcCall("eth_getBalance", [wallet, "latest"]),
      explorerGet(`/api/v2/addresses/${wallet}/transactions?limit=50`),
      explorerGet(`/api/v2/addresses/${wallet}/token-balances`),
    ]);

    // Tx count from RPC (nonce = outgoing txs)
    let txCount = 0;
    if (txCountRaw.status === "fulfilled" && txCountRaw.value) {
      txCount = parseInt(txCountRaw.value as string, 16) || 0;
    }

    // HYPE balance on EVM
    let hypeBalance = 0;
    if (balanceRaw.status === "fulfilled" && balanceRaw.value) {
      hypeBalance = parseInt(balanceRaw.value as string, 16) / 1e18;
    }

    // Tx history — get first/last date and unique contracts
    let firstTxDate: string | null = null;
    let lastTxDate: string | null = null;
    let uniqueContracts = 0;

    if (txListRes.status === "fulfilled" && txListRes.value.ok) {
      try {
        const data = await txListRes.value.json();
        const txs: Array<{ timestamp: string; to?: { hash: string } }> = data?.items ?? [];
        if (txs.length > 0) {
          const timestamps = txs.map((t) => t.timestamp).filter(Boolean).sort();
          firstTxDate = timestamps[0]?.split("T")[0] ?? null;
          lastTxDate = timestamps[timestamps.length - 1]?.split("T")[0] ?? null;
          const contracts = new Set(txs.map((t) => t.to?.hash).filter(Boolean));
          uniqueContracts = contracts.size;
        }
      } catch { /* ignore */ }
    }

    // Token holdings
    let tokenCount = 0;
    if (tokenRes.status === "fulfilled" && tokenRes.value.ok) {
      try {
        const data = await tokenRes.value.json();
        const tokens = Array.isArray(data) ? data : (data?.items ?? []);
        tokenCount = tokens.filter((t: { value?: string }) => Number(t.value ?? 0) > 0).length;
      } catch { /* ignore */ }
    }

    // Wallet age
    const walletAge = firstTxDate
      ? Math.floor((Date.now() - new Date(firstTxDate).getTime()) / 86400000)
      : 0;

    // Scoring
    // Tx count is primary signal
    let score = 0;
    if (txCount >= 100) score += 60;
    else if (txCount >= 50) score += 45;
    else if (txCount >= 20) score += 30;
    else if (txCount >= 6) score += 20;
    else if (txCount >= 1) score += 10;

    // Protocol diversity (unique contracts interacted with)
    if (uniqueContracts >= 10) score += 20;
    else if (uniqueContracts >= 5) score += 15;
    else if (uniqueContracts >= 3) score += 10;
    else if (uniqueContracts >= 1) score += 5;

    // Token diversity
    if (tokenCount >= 5) score += 10;
    else if (tokenCount >= 3) score += 7;
    else if (tokenCount >= 1) score += 4;

    // Wallet age on HyperEVM
    if (walletAge >= 90) score += 10;
    else if (walletAge >= 60) score += 7;
    else if (walletAge >= 30) score += 5;

    score = Math.min(score, 100);

    const tier: HyperEVMStats["tier"] =
      score >= 80 ? "legendary" :
      score >= 55 ? "high" :
      score >= 30 ? "medium" :
      score >= 10 ? "low" : "none";

    const stats: HyperEVMStats = {
      wallet,
      txCount,
      hypeBalance: Math.round(hypeBalance * 100) / 100,
      tokenCount,
      uniqueContracts,
      firstTxDate,
      lastTxDate,
      walletAge,
      score,
      tier,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", wallet } as HyperEVMStats,
      { status: 500 }
    );
  }
}
