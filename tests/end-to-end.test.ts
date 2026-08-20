import { describe, expect, it } from "vitest";
import { parseIntent } from "../packages/intent-engine/src/index";
import { createMoneyPlan } from "../packages/route-engine/src/planner";
import { simulateExecution } from "../packages/simulator/src/index";
import type { Route } from "../packages/money-core/src/index";

function route(id: string, fee: string, minutes: number, reliability: number): Route {
  return {
    id,
    providerId: id,
    name: id,
    cost: { amount: fee, currency: "USD" },
    estimatedArrivalMinutes: minutes,
    reliabilityScore: reliability,
    quote: {
      id: `quote-${id}`,
      source: { amount: (300 + Number(fee)).toString(), currency: "USD" },
      destination: { amount: "300", currency: "USD" },
      exchangeRate: "1",
      fees: {
        provider: { amount: fee, currency: "USD" },
        network: { amount: "0", currency: "USD" },
        platform: { amount: "0", currency: "USD" },
        total: { amount: fee, currency: "USD" },
      },
      effectiveRate: "1",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      providerId: id,
      routeId: id,
    },
  };
}

describe("Money Navigator v0.1", () => {
  it("turns a natural-language request into an explainable simulated execution", () => {
    const intent = parseIntent("Send enough money so Mum receives $300", "intent-e2e");
    const routes = [route("alpha", "8", 20, 98), route("beta", "4", 90, 99), route("gamma", "2", 300, 95)];
    const plan = createMoneyPlan(intent, routes, "BALANCED");

    expect(plan.status).toBe("READY");
    expect(plan.alternatives).toHaveLength(2);
    expect(plan.explanation).toContain("recommended");

    const execution = simulateExecution("exec-e2e", plan.recommendedRoute, plan.quote.source);
    expect(execution.state).toBe("SETTLED");
    expect(execution.events).toHaveLength(4);
  });
});
