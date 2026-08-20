import { describe, expect, it } from "vitest";
import { assertFxAmountMatchesRate, createFxLedgerTransaction } from "../packages/money-core/src/fx-ledger";

describe("FX ledger", () => {
  it("accepts separate balanced USD and ZAR books", () => {
    const tx = createFxLedgerTransaction({
      id: "fx-1",
      executionId: "exec-1",
      idempotencyKey: "fx-idem-1",
      source: { amount: "100", currency: "USD" },
      destination: { amount: "1800", currency: "ZAR" },
      rate: "18",
      legs: [
        { accountId: "usd-clearing", amount: { amount: "100", currency: "USD" }, type: "DEBIT" },
        { accountId: "usd-funding", amount: { amount: "100", currency: "USD" }, type: "CREDIT" },
        { accountId: "zar-clearing", amount: { amount: "1800", currency: "ZAR" }, type: "CREDIT" },
        { accountId: "zar-recipient", amount: { amount: "1800", currency: "ZAR" }, type: "DEBIT" },
      ],
      createdAt: "2026-08-20T10:00:00.000Z",
    });
    expect(tx.legs).toHaveLength(4);
  });

  it("checks the quoted FX rate", () => {
    expect(() => assertFxAmountMatchesRate({ amount: "100", currency: "USD" }, { amount: "1800", currency: "ZAR" }, "18")).not.toThrow();
    expect(() => assertFxAmountMatchesRate({ amount: "100", currency: "USD" }, { amount: "1700", currency: "ZAR" }, "18")).toThrow();
  });
});
