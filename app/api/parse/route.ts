import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { parseExpenses } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const { text, walletNames } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }
    const result = await parseExpenses(text, walletNames ?? []);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
