import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { canonicalizeJson } from "../packages/simulator/src/canonical-json";
import { InternalProviderAdapter, internalRail } from "../packages/simulator/src/internal-provider-adapter";

class ProviderEventInbox {
  private readonly events = new Map<string, { eventId: string; status: "RECEIVED" | "PROCESSED"; reference: string }>();
  private readonly settlementReferences = new Set<string>();
  private readonly attemptReferences = new Set<string>();

  process(event: { providerId: string; eventId: string; providerReference: string; payload: Readonly<Record<string, unknown>>; eventType: string }) {
    const eventKey = `${event.providerId}:${event.eventId}`;
    const existing = this.events.get(eventKey);
    if (existing) return { settlementApplied: false, duplicate: true };

    if (this.attemptReferences.has(event.providerReference)) {
      return { settlementApplied: false, duplicate: true, referenceCollision: true };
    }

    const row = { eventId: event.eventId, status: "RECEIVED" as const, reference: event.providerReference };
    this.events.set(eventKey, row);
    this.attemptReferences.add(event.providerReference);

    const settlementApplied = event.eventType === "settled" && !this.settlementReferences.has(event.providerReference);
    if (settlementApplied) this.settlementReferences.add(event.providerReference);
    row.status = "PROCESSED";
    return { settlementApplied, duplicate: false, referenceCollision: false };
  }

  countEvents() { return this.events.size; }
  countSettlements() { return this.settlementReferences.size; }
  countReferences() { return this.attemptReferences.size; }
}

describe("provider reconciliation integration", () => {
  it("settles once when the same webhook is delivered repeatedly", async () => {
    const adapter = new InternalProviderAdapter();
    const amount = { amount: "100", currency: "USD" };
    const result = await adapter.execute({
      settlementId: "integration-settlement-1",
      instruction: { amount, rail: internalRail(), reference: "integration-1", idempotencyKey: "integration-key-1" },
    });
    expect(result.status).toBe("SUCCEEDED");
    const payload = canonicalizeJson(result.payload);
    expect(adapter.verifyWebhook({ eventId: result.eventId, signature: `internal:${result.eventId}`, payload })).toBe(true);

    const inbox = new ProviderEventInbox();
    const event = { providerId: result.providerId, eventId: result.eventId, providerReference: result.providerReference!, payload: result.payload, eventType: result.eventType };
    expect(inbox.process(event)).toEqual({ settlementApplied: true, duplicate: false, referenceCollision: false });
    expect(inbox.process(event)).toEqual({ settlementApplied: false, duplicate: true });
    expect(inbox.process(event)).toEqual({ settlementApplied: false, duplicate: true });
    expect(inbox.countEvents()).toBe(1);
    expect(inbox.countSettlements()).toBe(1);
  });

  it("rejects a different event that reuses an existing provider reference", async () => {
    const adapter = new InternalProviderAdapter();
    const result = await adapter.execute({
      settlementId: "integration-settlement-2",
      instruction: { amount: { amount: "250", currency: "USD" }, rail: internalRail(), reference: "integration-2", idempotencyKey: "integration-key-2" },
    });
    const inbox = new ProviderEventInbox();
    const first = { providerId: "INTERNAL", eventId: "provider-event-1", providerReference: "provider-ref-collision", payload: { state: "SETTLED" }, eventType: "settled" };
    const second = { providerId: "INTERNAL", eventId: "provider-event-2", providerReference: "provider-ref-collision", payload: { state: "SETTLED", settlementId: "forged-or-replayed" }, eventType: "settled" };
    expect(inbox.process(first)).toEqual({ settlementApplied: true, duplicate: false, referenceCollision: false });
    expect(inbox.process(second)).toEqual({ settlementApplied: false, duplicate: true, referenceCollision: true });
    expect(inbox.countEvents()).toBe(1);
    expect(inbox.countSettlements()).toBe(1);
    expect(inbox.countReferences()).toBe(1);
    expect(result.status).toBe("SUCCEEDED");
    expect(createHash("sha256").update(canonicalizeJson(first.payload)).digest("hex")).toHaveLength(64);
  });
});
