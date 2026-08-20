import { describe, expect, it } from "vitest";
import { recommend, rankRoutes } from "../packages/route-engine/src/index";
import type { Route } from "../packages/money-core/src/index";

function route(id: string, cost: string, minutes: number, reliabilityScore: number): Route {
  return {
    id,
    providerId: id,
    name: id,
    cost: { amount: cost, currency: "USD" },
    estimatedArrivalMinutes: minutes,
    reliabilityScore,
    quote: {
      id: `q-${id}`,
      source: { amount: "100", currency: "USD" },
      destination: { amount: "100", currency: "USD" },
      exchangeRate: "1",
      fees: {
        provider: { amount: cost, currency: "USD" },
        network: { amount: "0", currency: "USD" },
        platform: { amount: "0", currency: "USD" },
        total: { amount: cost, currency: "USD" },
      },
      effectiveRate: "1",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      providerId: id,
      routeId: id,
    },
  };
}

describe("route engine", () => {
  const routes = [route("slow-cheap", "2", 300, 95), route("fast", "8", 20, 98), route("reliable", "5", 90, 99)];

  it("selects cheapest", () => expect(recommend(routes, "CHEAPEST").id).toBe("slow-cheap"));
  it("selects fastest", () => expect(recommend(routes, "FASTEST").id).toBe("fast"));
  it("selects most reliable", () => expect(recommend(routes, "MOST_RELIABLE").id).toBe("reliable"));
  it("returns a deterministic balanced ranking", () => {
    const ranked = rankRoutes(routes, { cost: 1, speed: 1, reliability: 1 });
    expect(ranked).toHaveLength(3);
    expect(new Set(ranked.map((r) => r.id)).size).toBe(3);
  });
});
