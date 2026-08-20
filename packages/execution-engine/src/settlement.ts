import type { LedgerEntry, LedgerTransaction } from "../../money-core/src/ledger";
import { createLedgerTransaction } from "../../money-core/src/ledger";
import type { MoneyAmount } from "../../money-core/src/index";
import type { ExecutionRecord } from "./index";

export interface SettlementPosting {
  accountId: string;
  type: LedgerEntry["type"];
  amount: MoneyAmount;
  metadata?: Record<string, string>;
}

export interface SettlementRequest {
  execution: ExecutionRecord;
  description: string;
  postings: readonly SettlementPosting[];
  settledAt?: string;
}

export interface SettlementResult {
  transaction: LedgerTransaction;
  created: boolean;
}

export function settleToLedger(request: SettlementRequest): SettlementResult {
  if (request.execution.status !== "SETTLED") throw new Error(`Only SETTLED executions can post to the ledger; got ${request.execution.status}`);
  if (request.postings.length < 2) throw new Error("Settlement requires at least two ledger postings");
  const createdAt = request.settledAt ?? request.execution.updatedAt;
  const entries: LedgerEntry[] = request.postings.map((posting, index) => ({
    id: `${request.execution.id}:ledger:entry:${index + 1}`,
    transactionId: `${request.execution.id}:ledger`,
    type: posting.type,
    accountId: posting.accountId,
    amount: posting.amount,
    createdAt,
    ...(posting.metadata ? { metadata: posting.metadata } : {}),
  }));
  return { transaction: createLedgerTransaction({
    id: `${request.execution.id}:ledger`,
    executionId: request.execution.id,
    idempotencyKey: request.execution.idempotencyKey,
    description: request.description,
    entries,
    createdAt,
  }), created: true };
}

export function findExistingSettlement(existing: readonly LedgerTransaction[], execution: ExecutionRecord): LedgerTransaction | undefined {
  return existing.find((transaction) => transaction.idempotencyKey === execution.idempotencyKey && transaction.executionId === execution.id);
}

export function assertSettlementIdempotency(existing: readonly LedgerTransaction[], execution: ExecutionRecord): void {
  const sameKey = existing.find((transaction) => transaction.idempotencyKey === execution.idempotencyKey);
  if (sameKey && sameKey.executionId !== execution.id) throw new Error(`Ledger idempotency key already belongs to execution ${sameKey.executionId}`);
}
