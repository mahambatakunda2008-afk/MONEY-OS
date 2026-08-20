import { describe, expect, it } from "vitest";
import { compareRoutes } from "../packages/route-engine/src/competition";
import type { Route } from "../packages/money-core/src/index";

function makeRoute(id: string, source: string, eta: number, reliability: number): Route {
  return {
    id,
    providerId: id,
    name: id,
    cost: { amount: source, currency: "USD" },
    estimatedArrivalMinutes: eta,
    reliabilityScore: reliability,
    quote: {
      id: `q-${id}`,
      source: { amount: source, currency: "USD" },
      destination: { amount: "5000", currency: "ZAR" },
      exchangeRate: "18",
      fees: {
        provider: { amount: "0", currency: "USD" },
        network: { amount: "0", currency: "USD" },
        platform: { amount: "0", currency: "USD" },
        total: { amount: "0", currency: "USD" },
      },
      effectiveRate: "18",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      providerId: id,
      routeId: id,
    },
  };
}

describe("route competition", () => {
  const routes = [
    makeRoute("alpha", "280.41", 18, 98),
    makeRoute("beta", "277.90", 47, 96),
    makeRoute("gamma", "282.10", 9, 99),
    makeRoute("delta", "276.80", 180, 91),
  ];

  it("compares routes and returns a balanced recommendation", () => {
    const result = compareRoutes(routes, "BALANCED");
    expect(result.alternatives).toHaveLength(3);
    expect(result.recommended.route.id).toBe("alpha");
    expect(result.recommended.targetAmount).toEqual({ amount: "5000", currency: "ZAR" });
    expect(result.reason).toContain("balance");
  });

  it("supports explicit cheapest, fastest and reliability priorities", () => {
    expect(compareRoutes(routes, "CHEAPEST").recommended.route.id).toBe("delta");
    expect(compareRoutes(routes, "FASTEST").recommended.route.id).toBe("gamma");
    expect(compareRoutes(routes, "MOST_RELIABLE").recommended.route.id).toBe("gamma");
  });

  it("reports savings and time advantage without changing the quote", () => {
    const result = compareRoutes(routes);
    expect(result.recommended.savingsVsMostExpensive?.currency).toBe("USD");
    expect(result.recommended.fasterThanSlowestMinutes).toBeGreaterThan(0);
    expect(result.recommended.route.quote.destination.amount).toBe("5000");
  });
});
