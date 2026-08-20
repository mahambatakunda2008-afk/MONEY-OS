import { describe, expect, it } from "vitest";
import { assertSettlementIdempotency, findExistingSettlement, settleToLedger } from "../packages/execution-engine/src/settlement";
import type { ExecutionRecord } from "../packages/execution-engine/src/index";

const execution: ExecutionRecord = {
  id: "exec-settle-1",
  planId: "plan-1",
  idempotencyKey: "idem-settle-1",
  status: "SETTLED",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-20T10:05:00.000Z",
};

describe("execution to ledger settlement", () => {
  it("posts a settled execution exactly once by idempotency key", () => {
    const result = settleToLedger({
      execution,
      description: "Settlement",
      postings: [
        { accountId: "cash", type: "DEBIT", amount: { amount: "100.00", currency: "USD" } },
        { accountId: "customer", type: "CREDIT", amount: { amount: "100.00", currency: "USD" } },
      ],
    });

    expect(result.created).toBe(true);
    expect(findExistingSettlement([result.transaction], execution)?.id).toBe(result.transaction.id);
    expect(() => assertSettlementIdempotency([result.transaction], execution)).not.toThrow();
  });

  it("rejects an idempotency key collision across executions", () => {
    const result = settleToLedger({
      execution,
      description: "Settlement",
      postings: [
        { accountId: "cash", type: "DEBIT", amount: { amount: "100.00", currency: "USD" } },
        { accountId: "customer", type: "CREDIT", amount: { amount: "100.00", currency: "USD" } },
      ],
    });
    const other = { ...execution, id: "exec-other" };
    expect(() => assertSettlementIdempotency([result.transaction], other)).toThrow("already belongs");
  });

  it("refuses to post a failed execution", () => {
    expect(() => settleToLedger({
      execution: { ...execution, status: "FAILED" },
      description: "Settlement",
      postings: [
        { accountId: "cash", type: "DEBIT", amount: { amount: "100.00", currency: "USD" } },
        { accountId: "customer", type: "CREDIT", amount: { amount: "100.00", currency: "USD" } },
      ],
    })).toThrow("Only SETTLED executions");
  });
});
