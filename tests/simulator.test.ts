import { describe, expect, it } from "vitest";
import { parseIntent } from "../packages/intent-engine/src/index";
import { simulateExecution } from "../packages/simulator/src/index";
import type { Route } from "../packages/money-core/src/index";

const testRoute: Route = {
  id: "route-b",
  providerId: "provider-b",
  name: "Provider B",
  cost: { amount: "4", currency: "USD" },
  estimatedArrivalMinutes: 90,
  reliabilityScore: 99,
  quote: {
    id: "quote-b",
    source: { amount: "304", currency: "USD" },
    destination: { amount: "300", currency: "USD" },
    exchangeRate: "1",
    fees: {
      provider: { amount: "4", currency: "USD" },
      network: { amount: "0", currency: "USD" },
      platform: { amount: "0", currency: "USD" },
      total: { amount: "4", currency: "USD" },
    },
    effectiveRate: "1",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    providerId: "provider-b",
    routeId: "route-b",
  },
};

describe("intent engine", () => {
  it("understands a simple family transfer", () => {
    const intent = parseIntent("Send enough money so Mum receives $300", "intent-test");
    expect(intent.id).toBe("intent-test");
    expect(intent.action).toBe("SEND");
    expect(intent.targetAmount).toEqual({ amount: "300", currency: "USD" });
    expect(intent.destination).toEqual({ type: "PERSON", id: "mum" });
  });
});

describe("execution simulator", () => {
  it("settles successfully", () => {
    const execution = simulateExecution("exec-1", testRoute, { amount: "304", currency: "USD" });
    expect(execution.state).toBe("SETTLED");
    expect(execution.events.at(-1)?.type).toBe("transaction.completed");
  });

  it("produces a failed state for provider failure", () => {
    const execution = simulateExecution("exec-2", testRoute, { amount: "304", currency: "USD" }, { failAt: "PROVIDER" });
    expect(execution.state).toBe("FAILED");
    expect(execution.events.at(-1)?.type).toBe("provider.failed");
  });
});
