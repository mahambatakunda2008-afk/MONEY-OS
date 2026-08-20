import { describe, expect, it } from "vitest";
import { assessRouteRisk, isRouteExecutable } from "../packages/route-engine/src/route-risk";
import type { Route } from "../packages/money-core/src/index";

function makeRoute(expiresAt: string, reliability = 98, minutes = 20): Route {
  return {
    id: "route-1",
    providerId: "provider-1",
    name: "Provider One",
    cost: { amount: "20", currency: "USD" },
    estimatedArrivalMinutes: minutes,
    reliabilityScore: reliability,
    quote: {
      id: "quote-1",
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
      providerId: "provider-1",
      routeId: "route-1",
    },
  };
}

describe("route risk", () => {
  it("marks a healthy, unexpired route low risk", () => {
    const risk = assessRouteRisk(makeRoute(new Date(Date.now() + 300_000).toISOString()));
    expect(risk.level).toBe("LOW");
    expect(isRouteExecutable(risk)).toBe(true);
  });

  it("blocks expired quotes", () => {
    const risk = assessRouteRisk(makeRoute(new Date(Date.now() - 1_000).toISOString()));
    expect(risk.blockers).toContain("Quote has expired.");
    expect(isRouteExecutable(risk)).toBe(false);
  });

  it("raises risk for slow, unreliable routes", () => {
    const risk = assessRouteRisk(makeRoute(new Date(Date.now() + 300_000).toISOString(), 82, 300));
    expect(risk.level).toBe("HIGH");
    expect(risk.reasons.length).toBeGreaterThan(1);
  });
});
