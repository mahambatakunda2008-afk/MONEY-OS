import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { canonicalizeJson } from "../packages/simulator/src/canonical-json";
import { InternalProviderAdapter, internalRail } from "../packages/simulator/src/internal-provider-adapter";

class ProviderEventInbox {
  private readonly events = new Map<string, { eventId: string; status: "RECEIVED" | "PROCESSED"; reference: string }>();
  private settledReferences = new Set<string>();

  ingest(event: { providerId: string; eventId: string; providerReference: string; payload: Readonly<Record<string, unknown>>; eventType: string }) {
    const key = `${event.providerId}:${event.eventId}`;
    const existing = this.events.get(key);
    if (existing) return existing;
    const row = { eventId: event.eventId, status: "RECEIVED" as const, reference: event.providerReference };
    this.events.set(key, row);
    return row;
  }

  process(event: { providerId: string; eventId: string; providerReference: string; payload: Readonly<Record<string, unknown>>; eventType: string }) {
    const row = this.ingest(event);
    if (row.status === "PROCESSED") return { settlementApplied: false, duplicate: true };
    const settlementApplied = event.eventType === "settled" && !this.settledReferences.has(event.providerReference);
    if (settlementApplied) this.settledReferences.add(event.providerReference);
    row.status = "PROCESSED";
    return { settlementApplied, duplicate: false };
  }

  countEvents() { return this.events.size; }
  countSettlements() { return this.settledReferences.size; }
}

describe("provider reconciliation integration", () => {
  it("settles once when the same webhook is delivered repeatedly", async () => {
    const adapter = new InternalProviderAdapter();
    const amount = { amount: "100", currency: "USD" };
    const rail = internalRail();
    const result = await adapter.execute({
      settlementId: "integration-settlement-1",
      instruction: { amount, rail, reference: "integration-1", idempotencyKey: "integration-key-1" },
    });
    expect(result.status).toBe("SUCCEEDED");
    expect(result.providerReference).toBe("internal_integration-settlement-1");

    const payload = canonicalizeJson(result.payload);
    const signature = `internal:${result.eventId}`;
    expect(adapter.verifyWebhook({ eventId: result.eventId, signature, payload })).toBe(true);

    const inbox = new ProviderEventInbox();
    const event = {
      providerId: result.providerId,
      eventId: result.eventId,
      providerReference: result.providerReference!,
      payload: result.payload,
      eventType: result.eventType,
    };
    const first = inbox.process(event);
    const second = inbox.process(event);
    const third = inbox.process(event);

    expect(first).toEqual({ settlementApplied: true, duplicate: false });
    expect(second).toEqual({ settlementApplied: false, duplicate: true });
    expect(third).toEqual({ settlementApplied: false, duplicate: true });
    expect(inbox.countEvents()).toBe(1);
    expect(inbox.countSettlements()).toBe(1);
    expect(createHash("sha256").update(payload).digest("hex")).toHaveLength(64);
  });
});
