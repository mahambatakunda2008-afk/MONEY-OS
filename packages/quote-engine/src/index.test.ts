import { describe, expect, it } from "vitest";
import { calculateFees, buildQuote } from "./index";

describe("quote engine", () => {
  it("builds a source-fee-adjusted quote", () => {
    const fees = calculateFees({
      provider: { amount: "2", currency: "USD" },
      network: { amount: "1", currency: "USD" },
      platform: { amount: "1", currency: "USD" },
    });

    const quote = buildQuote({
      id: "q-1",
      source: { amount: "100", currency: "USD" },
      destinationCurrency: "ZAR",
      rate: "18",
      fees,
      providerId: "sim-beta",
      routeId: "beta-usd-zar",
      estimatedArrivalMinutes: 90,
      expiresAt: "2026-08-20T12:00:00.000Z",
    });

    expect(quote.destination).toEqual({ amount: "1728", currency: "ZAR" });
    expect(quote.fees.total).toEqual({ amount: "4", currency: "USD" });
    expect(quote.effectiveRate).toBe("17.28");
  });

  it("rejects fees greater than the source amount", () => {
    const fees = calculateFees({
      provider: { amount: "60", currency: "USD" },
      network: { amount: "30", currency: "USD" },
      platform: { amount: "20", currency: "USD" },
    });

    expect(() => buildQuote({
      id: "q-2",
      source: { amount: "100", currency: "USD" },
      destinationCurrency: "ZAR",
      rate: "18",
      fees,
      providerId: "sim-alpha",
      routeId: "alpha-usd-zar",
      estimatedArrivalMinutes: 20,
      expiresAt: "2026-08-20T12:00:00.000Z",
    })).toThrow();
  });
});
