import { describe, expect, it } from "vitest";
import { ExecutionEngine, applyExecutionOutcome, reserveForExecution } from "../packages/money-core/src/execution";
import { ProviderRegistry, type PaymentRailProvider } from "../packages/money-core/src/providers";
import type { PaymentRail } from "../packages/money-core/src/rails";
import { credit } from "../packages/money-core/src/balances";

const rail: PaymentRail = { id: "bank-rail", type: "BANK", provider: "bank-demo", countries: ["ZA"], currencies: ["USD"], status: "ACTIVE", capabilities: ["PAY"] };
const provider: PaymentRailProvider = { id: "bank-demo", railType: "BANK", execute: async () => ({ status: "ACCEPTED", providerReference: "bank-123" }) };

describe("payment execution", () => {
  it("returns the same record for a repeated idempotency key", async () => {
    const registry = new ProviderRegistry(); registry.register(provider);
    const engine = new ExecutionEngine(registry);
    const request = { operation: "PAY" as const, amount: { amount: "10", currency: "USD" }, rail, reference: "pay-1", idempotencyKey: "idem-1" };
    const first = await engine.execute(request); const second = await engine.execute(request);
    expect(second).toBe(first); expect(first.providerReference).toBe("bank-123");
  });
  it("holds before execution and commits an accepted payment", () => {
    const start = credit({}, { amount: "50", currency: "USD" });
    const held = reserveForExecution(start, { amount: "10", currency: "USD" });
    const settled = applyExecutionOutcome(held, { amount: "10", currency: "USD" }, "ACCEPTED");
    expect(settled.USD).toMatchObject({ available: "40", held: "0", committed: "10" });
  });
  it("releases a rejected payment", () => {
    const start = credit({}, { amount: "50", currency: "USD" });
    const held = reserveForExecution(start, { amount: "10", currency: "USD" });
    const released = applyExecutionOutcome(held, { amount: "10", currency: "USD" }, "REJECTED");
    expect(released.USD).toMatchObject({ available: "50", held: "0" });
  });
});
