import { describe, expect, it } from "vitest";
import { assertBalanced, type LedgerEntry } from "../packages/money-core/src/index";

const entry = (type: LedgerEntry["type"], amount: string): LedgerEntry => ({
  id: `${type}-${amount}`,
  transactionId: "tx-1",
  type,
  accountId: "account-1",
  amount: { amount, currency: "USD" },
  createdAt: "2026-08-20T00:00:00.000Z",
});

describe("ledger", () => {
  it("accepts balanced debit and credit entries", () => {
    expect(() => assertBalanced([entry("DEBIT", "305.72"), entry("CREDIT", "305.72")])).not.toThrow();
  });

  it("rejects unbalanced transactions", () => {
    expect(() => assertBalanced([entry("DEBIT", "300"), entry("CREDIT", "299")])).toThrow("Unbalanced ledger");
  });

  it("rejects negative or malformed amounts", () => {
    expect(() => assertBalanced([entry("DEBIT", "-1"), entry("CREDIT", "1")])).toThrow("Invalid non-negative money amount");
  });
});
