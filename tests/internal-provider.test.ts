import { describe, expect, it } from "vitest";
import type { MoneyAmount, Route } from "../packages/money-core/src/index";
import { executeInternalSettlement } from "../packages/simulator/src/internal-provider";

const amount: MoneyAmount = { amount: "300", currency: "USD" };
const route: Route = {
  id: "route-internal",
  providerId: "INTERNAL",
  name: "Shadecode Internal",
  cost: { amount: "0", currency: "USD" },
  estimatedArrivalMinutes: 0,
  reliabilityScore: 1,
  quote: {
    id: "quote-internal",
    source: amount,
    destination: amount,
    exchangeRate: "1",
    fees: {
      provider: { amount: "0", currency: "USD" },
      network: { amount: "0", currency: "USD" },
      platform: { amount: "0", currency: "USD" },
      total: { amount: "0", currency: "USD" },
    },
    effectiveRate: "1",
    expiresAt: "2099-01-01T00:00:00.000Z",
    providerId: "INTERNAL",
    routeId: "route-internal",
  },
};

describe("internal settlement provider", () => {
  it("produces a deterministic successful provider event stream", () => {
    const result = executeInternalSettlement("settlement-1", route, amount);
    expect(result.providerReference).toBe("internal_settlement-1");
    expect(result.execution.state).toBe("SETTLED");
    expect(result.events.at(-1)?.eventType).toBe("settled");
    expect(new Set(result.events.map((event) => event.providerReference))).toEqual(
      new Set(["internal_settlement-1"]),
    );
  });

  it("models provider failure without claiming settlement", () => {
    const result = executeInternalSettlement("settlement-2", route, amount, { failAt: "PROVIDER" });
    expect(result.execution.state).toBe("FAILED");
    expect(result.events.at(-1)?.eventType).toBe("failed");
  });
});
