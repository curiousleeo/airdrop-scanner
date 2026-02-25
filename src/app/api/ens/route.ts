import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const RPCS = [
  "https://eth.llamarpc.com",
  "https://rpc.ankr.com/eth",
  "https://ethereum.publicnode.com",
];

async function resolveENS(name: string): Promise<string | null> {
  for (const rpc of RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const address = await Promise.race([
        provider.resolveName(name),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000)),
      ]);
      if (address) return address;
    } catch {
      // try next RPC
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.toLowerCase().trim();
  if (!name || !name.includes(".")) {
    return NextResponse.json({ error: "Invalid ENS name" }, { status: 400 });
  }

  try {
    const address = await resolveENS(name);
    if (!address) {
      return NextResponse.json({ error: `Could not resolve ${name}` }, { status: 404 });
    }
    return NextResponse.json({ address: address.toLowerCase(), name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resolution failed" },
      { status: 500 }
    );
  }
}
