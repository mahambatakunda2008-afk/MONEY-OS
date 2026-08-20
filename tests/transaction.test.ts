import { describe, expect, it } from "vitest";
import { assertBalanced, createTransaction, transitionTransaction } from "../packages/money-core/src/transaction";

const base = { id: "tx-1", idempotencyKey: "idem-1", operation: "PAY" as const, status: "PENDING" as const, entries: [{ accountId: "cash", type: "DEBIT" as const, amount: { amount: "10", currency: "USD" } }, { accountId: "merchant", type: "CREDIT" as const, amount: { amount: "10", currency: "USD" } }] };

describe("transactions", () => {
  it("requires balanced entries per currency", () => { expect(() => assertBalanced([{ ...base.entries[0], amount: { amount: "11", currency: "USD" } }, base.entries[1]])).toThrow("Unbalanced transaction"); });
  it("creates timestamped transactions", () => { const tx = createTransaction(base); expect(tx.createdAt).toBe(tx.updatedAt); });
  it("enforces legal state transitions", () => { const tx = createTransaction(base); const committed = transitionTransaction(transitionTransaction(tx, "AUTHORIZED"), "COMMITTED"); expect(committed.status).toBe("COMMITTED"); expect(() => transitionTransaction(committed, "RELEASED")).toThrow("Invalid transaction transition"); });
});
