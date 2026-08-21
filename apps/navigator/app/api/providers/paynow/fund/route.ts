import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase";
import { initiatePaynowFunding } from "../../../../../lib/paynow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { amount?: number; currency?: string; accountId?: string; reference?: string } | null;
  const amount = Number(body?.amount);
  const currency = typeof body?.currency === "string" ? body.currency.toUpperCase() : "";
  const accountId = typeof body?.accountId === "string" ? body.accountId : "";
  const reference = typeof body?.reference === "string" && body.reference.trim() ? body.reference.trim() : `SC-FUND-${crypto.randomUUID()}`;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000 || !/^[A-Z]{3}$/.test(currency) || !accountId) return NextResponse.json({ error: "Invalid funding request" }, { status: 400 });

  const amountMinor = Math.round(amount * 100);
  const { data: transaction, error: transactionError } = await supabase.rpc("begin_money_funding", {
    p_idempotency_key: reference,
    p_account_id: accountId,
    p_amount_minor: amountMinor,
    p_currency: currency,
    p_provider_id: "paynow",
  });
  if (transactionError) return NextResponse.json({ error: transactionError.message }, { status: 400 });

  const origin = new URL(request.url).origin;
  try {
    const result = await initiatePaynowFunding({ reference, amount, additionalInfo: `Shadecode Money funding ${reference}`, returnUrl: `${origin}/wallet?funding=return&reference=${encodeURIComponent(reference)}`, resultUrl: `${origin}/api/providers/paynow/webhook` });
    return NextResponse.json({ provider: "paynow", reference, transactionId: transaction?.id, ...result });
  } catch (error) {
    await supabase.rpc("reconcile_money_funding", { p_reference: reference, p_status: "FAILED", p_provider_reference: null, p_metadata: { stage: "INITIATE", error: error instanceof Error ? error.message : "Paynow funding failed" } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Paynow funding failed" }, { status: 502 });
  }
}
