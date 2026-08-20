import { describe, expect, it } from "vitest";
import { createMoneyPlan } from "../packages/route-engine/src/planner";
import type { MoneyIntent, Route } from "../packages/money-core/src/index";

function makeRoute(id: string, expiresAt: string, reliability: number, minutes: number): Route {
  return {
    id,
    providerId: id,
    name: id,
    cost: { amount: "20", currency: "USD" },
    estimatedArrivalMinutes: minutes,
    reliabilityScore: reliability,
    quote: {
      id: `quote-${id}`,
      source: { amount: "20", currency: "USD" },
      destination: { amount: "360", currency: "ZAR" },
      exchangeRate: "18",
      fees: {
        provider: { amount: "0", currency: "USD" },
        network: { amount: "0", currency: "USD" },
        platform: { amount: "0", currency: "USD" },
        total: { amount: "0", currency: "USD" },
      },
      effectiveRate: "18",
      expiresAt,
      providerId: id,
      routeId: id,
    },
  };
}

const intent: MoneyIntent = { id: "risk-plan", action: "SEND", amount: { amount: "20", currency: "USD" } };

describe("MoneyPlan route risk integration", () => {
  it("excludes blocked routes and recommends an executable route", () => {
    const routes = [
      makeRoute("expired", new Date(Date.now() - 1_000).toISOString(), 99, 5),
      makeRoute("healthy", new Date(Date.now() + 300_000).toISOString(), 98, 20),
    ];

    const plan = createMoneyPlan(intent, routes);

    expect(plan.status).toBe("READY");
    expect(plan.recommendedRoute?.id).toBe("healthy");
    expect(plan.alternatives).toHaveLength(0);
    expect(plan.explanation).toContain("1 route is excluded");
  });

  it("requires action when every route is blocked", () => {
    const routes = [makeRoute("expired", new Date(Date.now() - 1_000).toISOString(), 99, 5)];
    const plan = createMoneyPlan(intent, routes);

    expect(plan.status).toBe("REQUIRES_ACTION");
    expect(plan.recommendedRoute).toBeUndefined();
    expect(plan.steps).toHaveLength(0);
  });
});
