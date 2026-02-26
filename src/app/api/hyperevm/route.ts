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
  detectedProtocols: { name: string; category: string }[];
  error?: string;
}

const EVM_RPC = "https://rpc.hyperliquid.xyz/evm";
const EXPLORER = "https://www.hyperscan.com";

// Known protocol contracts on HyperEVM (all lowercase)
const CONTRACT_PROTOCOLS: Record<string, { name: string; category: string }> = {
  // HyperSwap DEX
  "0xda0f518d521e0de83fadc8500c2d21b6a6c39bf9": { name: "HyperSwap", category: "DEX" },
  "0x4e2960a8cd19b467b82d26d83facb0fae26b094d": { name: "HyperSwap", category: "DEX" },
  "0x4df039804873717bff7d03694fb941cf0469b79e": { name: "HyperSwap", category: "DEX" },
  // KittenSwap DEX
  "0x618275f8efe54c2afa87bfb9f210a52f0ff89364": { name: "KittenSwap", category: "DEX" },
  // HyperLend (Aave V3 fork)
  "0xd01e9aa0ba6a4a06e756bc8c79579e6cef070822": { name: "HyperLend", category: "Lending" },
  "0x49558c794ea2ac8974c9f27886ddfaa951e99171": { name: "HyperLend", category: "Lending" },
  "0x2af0d6754a58723c50b5e73e45d964bfdd99fe2f": { name: "HyperLend", category: "Lending" },
  // Felix CDP (feUSD stablecoin)
  "0x9de1e57049c475736289cb006212f3e1dce4711b": { name: "Felix", category: "CDP" },
  "0x999876bc29bc2251539c900a1bcfc6c934991f49": { name: "Felix", category: "CDP" },
  "0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70": { name: "Felix", category: "CDP" },
  // HyperCore Bridge
  "0x2222222222222222222222222222222222222222": { name: "HyperBridge", category: "Bridge" },
  // WHYPE (wrapped HYPE for DeFi)
  "0x5555555555555555555555555555555555555555": { name: "WHYPE", category: "Bridge" },
};

// Token symbols that signal protocol usage (for token-balance check)
const TOKEN_SYMBOL_PROTOCOLS: Record<string, { name: string; category: string }> = {
  "feUSD": { name: "Felix", category: "CDP" },
  "lHYPE": { name: "Looped HYPE", category: "LST" },
  "kHYPE": { name: "Kinetiq", category: "LST" },
  "stHYPE": { name: "Stader", category: "LST" },
  "wstHYPE": { name: "Stader", category: "LST" },
  "KITTEN": { name: "KittenSwap", category: "DEX" },
  "SWAP": { name: "HyperSwap", category: "DEX" },
  "HYPE": { name: "HyperEVM", category: "Native" },
  "WHYPE": { name: "WHYPE", category: "Bridge" },
  "LHYPE": { name: "Looped HYPE", category: "LST" },
  "KHYPE": { name: "Kinetiq", category: "LST" },
  "STHYPE": { name: "Stader", category: "LST" },
};

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
      explorerGet(`/api/v2/addresses/${wallet}/transactions?limit=100`),
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

    // Tx history — get first/last date, unique contracts, and protocol detection
    let firstTxDate: string | null = null;
    let lastTxDate: string | null = null;
    let uniqueContracts = 0;
    const protocolMap = new Map<string, { name: string; category: string }>();

    if (txListRes.status === "fulfilled" && txListRes.value.ok) {
      try {
        const data = await txListRes.value.json();
        const txs: Array<{ timestamp: string; to?: { hash: string; is_contract?: boolean } }> = data?.items ?? [];
        if (txs.length > 0) {
          const timestamps = txs.map((t) => t.timestamp).filter(Boolean).sort();
          firstTxDate = timestamps[0]?.split("T")[0] ?? null;
          lastTxDate = timestamps[timestamps.length - 1]?.split("T")[0] ?? null;
          const contracts = new Set(txs.map((t) => t.to?.hash).filter(Boolean));
          uniqueContracts = contracts.size;

          // Match contracts against known protocols
          for (const addr of contracts) {
            if (!addr) continue;
            const proto = CONTRACT_PROTOCOLS[addr.toLowerCase()];
            if (proto && !protocolMap.has(proto.name)) {
              protocolMap.set(proto.name, proto);
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Token holdings + protocol detection via token symbols
    let tokenCount = 0;
    if (tokenRes.status === "fulfilled" && tokenRes.value.ok) {
      try {
        const data = await tokenRes.value.json();
        const tokens: Array<{ value?: string; token?: { symbol?: string; address?: string } }> =
          Array.isArray(data) ? data : (data?.items ?? []);
        const held = tokens.filter((t) => Number(t.value ?? 0) > 0);
        tokenCount = held.length;

        for (const t of held) {
          const sym = t.token?.symbol?.toUpperCase() ?? "";
          const proto = TOKEN_SYMBOL_PROTOCOLS[sym] ?? TOKEN_SYMBOL_PROTOCOLS[t.token?.symbol ?? ""];
          if (proto && !protocolMap.has(proto.name)) {
            protocolMap.set(proto.name, proto);
          }
          // Also check token address against known contracts
          const addr = t.token?.address?.toLowerCase() ?? "";
          const addrProto = CONTRACT_PROTOCOLS[addr];
          if (addrProto && !protocolMap.has(addrProto.name)) {
            protocolMap.set(addrProto.name, addrProto);
          }
        }
      } catch { /* ignore */ }
    }

    const detectedProtocols = Array.from(protocolMap.values());

    // Wallet age
    const walletAge = firstTxDate
      ? Math.floor((Date.now() - new Date(firstTxDate).getTime()) / 86400000)
      : 0;

    // Scoring
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
      detectedProtocols,
    };

    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", wallet, detectedProtocols: [], txCount: 0, hypeBalance: 0, tokenCount: 0, uniqueContracts: 0, firstTxDate: null, lastTxDate: null, walletAge: 0, score: 0, tier: "none" } as HyperEVMStats,
      { status: 500 }
    );
  }
}
