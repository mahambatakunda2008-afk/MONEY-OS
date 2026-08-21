import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase";
import { initiatePaynowFunding } from "../../../../../lib/paynow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { amount?: number; reference?: string } | null;
  const amount = Number(body?.amount);
  const reference = typeof body?.reference === "string" && body.reference.trim()
    ? body.reference.trim()
    : `SC-${user.id.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return NextResponse.json({ error: "Invalid funding amount" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  try {
    const result = await initiatePaynowFunding({
      reference,
      amount,
      returnUrl: `${origin}/wallet?funding=return&reference=${encodeURIComponent(reference)}`,
      resultUrl: `${origin}/api/providers/paynow/webhook`,
    });
    return NextResponse.json({ provider: "paynow", reference, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paynow funding failed" }, { status: 502 });
  }
}
