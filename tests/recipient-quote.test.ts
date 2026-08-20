import { describe, expect, it } from "vitest";
import { buildRecipientQuote } from "../packages/quote-engine/src/recipient";

const base = {
  id: "recipient-1",
  sourceCurrency: "USD",
  target: { amount: "300", currency: "ZAR" },
  rate: "18",
  fees: {
    provider: { amount: "1", currency: "USD" },
    network: { amount: "1", currency: "USD" },
    platform: { amount: "2", currency: "USD" },
    total: { amount: "4", currency: "USD" },
  },
  providerId: "provider-a",
  routeId: "route-a",
  estimatedArrivalMinutes: 30,
  expiresAt: "2026-08-20T16:00:00Z",
};

describe("exact recipient quotes", () => {
  it("solves the source amount in the requested source currency", () => {
    const result = buildRecipientQuote(base);
    expect(result.source.currency).toBe("USD");
    expect(result.source.amount).toBe("20.666666666666666666");
    expect(result.quote.destination.currency).toBe("ZAR");
    expect(result.quote.destination.amount).toBe("300");
  });

  it("supports non-USD source currencies", () => {
    const result = buildRecipientQuote({
      ...base,
      sourceCurrency: "ZAR",
      target: { amount: "100", currency: "EUR" },
      rate: "0.05",
      fees: {
        ...base.fees,
        provider: { amount: "5", currency: "ZAR" },
        network: { amount: "0", currency: "ZAR" },
        platform: { amount: "1", currency: "ZAR" },
        total: { amount: "6", currency: "ZAR" },
      },
    });

    expect(result.source.currency).toBe("ZAR");
    expect(result.quote.destination.currency).toBe("EUR");
    expect(result.quote.destination.amount).toBe("100");
  });

  it("rejects a fee quoted in the destination currency", () => {
    expect(() => buildRecipientQuote({
      ...base,
      fees: { ...base.fees, total: { amount: "4", currency: "ZAR" } },
    })).toThrow("fees must use the source currency");
  });

  it("rejects an insufficient maximum source amount", () => {
    expect(() => buildRecipientQuote({ ...base, maxSource: { amount: "20", currency: "USD" } }))
      .toThrow("exceeds maximum");
  });
});
