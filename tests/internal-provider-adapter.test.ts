import { describe, expect, it } from "vitest";
import { InternalProviderAdapter, internalRail } from "../packages/simulator/src/internal-provider-adapter";

const adapter = new InternalProviderAdapter();

function context(settlementId: string) {
  return {
    settlementId,
    instruction: {
      amount: { amount: "100", currency: "USD" },
      rail: internalRail(),
      reference: `test-${settlementId}`,
      idempotencyKey: `idem-${settlementId}`,
    },
  };
}

describe("InternalProviderAdapter", () => {
  it("executes a deterministic successful settlement", async () => {
    const result = await adapter.execute(context("settlement-1"));
    expect(result.providerId).toBe("INTERNAL");
    expect(result.status).toBe("SUCCEEDED");
    expect(result.providerReference).toBe("internal_settlement-1");
    expect(result.eventType).toBe("settled");
  });

  it("rejects an invalid internal webhook signature", () => {
    expect(adapter.verifyWebhook({ eventId: "evt-1", signature: "bad", payload: "{}" })).toBe(false);
    expect(adapter.verifyWebhook({ eventId: "evt-1", signature: "internal:evt-1", payload: "{}" })).toBe(true);
  });

  it("normalizes an unknown webhook status conservatively", () => {
    const result = adapter.normalizeWebhook({ eventId: "evt-2", eventType: "something-new", payload: {} });
    expect(result.status).toBe("UNKNOWN");
    expect(result.providerId).toBe("INTERNAL");
  });
});
