import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyPaynowHash } from "../../../../../lib/paynow";
import { getSupabaseServerClient } from "../../../../../lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const values = Object.fromEntries(new URLSearchParams(rawBody).entries());
  const signature = values.hash ?? values.Hash ?? "";
  if (!signature || !verifyPaynowHash(values)) return new NextResponse("Invalid signature", { status: 401 });

  const reference = values.reference ?? "";
  const eventId = values.paynowreference ? `paynow:${values.paynowreference}:${values.status ?? "unknown"}` : `paynow:${reference}:${values.status ?? "unknown"}`;
  if (!reference) return new NextResponse("Missing reference", { status: 400 });

  const supabase = getSupabaseServerClient();
  const payloadHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const { data: event, error: eventError } = await supabase.rpc("ingest_money_provider_event", { p_provider_id: "paynow", p_event_id: eventId, p_event_type: values.status ?? "STATUS_UPDATE", p_provider_reference: values.paynowreference ?? null, p_signature: signature, p_payload_hash: payloadHash, p_payload: values });
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  const status = values.status ?? "";
  if (status === "Paid" || status === "Failed") {
    const { error } = await supabase.rpc("reconcile_money_funding", { p_reference: reference, p_status: status === "Paid" ? "PAID" : "FAILED", p_provider_reference: values.paynowreference ?? null, p_metadata: values });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (event?.id) await supabase.from("money_provider_events").update({ status: "PROCESSED", processed_at: new Date().toISOString() }).eq("id", event.id);
  return NextResponse.json({ received: true, eventId, eventIdRecord: event?.id ?? null });
}
