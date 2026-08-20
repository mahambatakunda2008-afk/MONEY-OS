import { describe, expect, it } from "vitest";
import { buildRecipientQuote } from "../packages/quote-engine/src/recipient";

describe("exact recipient quotes", () => {
  it("solves the source amount needed for an exact recipient amount", () => {
    const result = buildRecipientQuote({
      id: "recipient-1",
      sourceCurrency: "USD",
      target: { amount: "300", currency: "ZAR" },
      rate: "18",
      fees: {
        provider: { amount: "4", currency: "USD" },
        network: { amount: "0", currency: "USD" },
        platform: { amount: "0", currency: "USD" },
        total: { amount: "4", currency: "USD" },
      },
      providerId: "alpha",
      routeId: "usd-zar-alpha",
      estimatedArrivalMinutes: 20,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    expect(result.source.currency).toBe("USD");
    expect(result.source.amount).toBe("20.666666666666666666");
    expect(result.quote.destination).toEqual({ amount: "300", currency: "ZAR" });
  });

  it("rejects a maximum source amount that cannot cover the target", () => {
    expect(() =>
      buildRecipientQuote({
        id: "recipient-2",
        sourceCurrency: "USD",
        target: { amount: "300", currency: "ZAR" },
        maxSource: { amount: "20", currency: "USD" },
        rate: "18",
        fees: {
          provider: { amount: "4", currency: "USD" },
          network: { amount: "0", currency: "USD" },
          platform: { amount: "0", currency: "USD" },
          total: { amount: "4", currency: "USD" },
        },
        providerId: "alpha",
        routeId: "usd-zar-alpha",
        estimatedArrivalMinutes: 20,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toThrow("exceeds maximum");
  });
});
