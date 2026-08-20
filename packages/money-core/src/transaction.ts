import type { MoneyAmount } from "./index";

export type TransactionStatus = "PENDING" | "AUTHORIZED" | "COMMITTED" | "SETTLED" | "RELEASED" | "FAILED";
export type TransactionEntryType = "DEBIT" | "CREDIT" | "HOLD" | "RELEASE" | "COMMIT" | "FEE" | "FX";
export interface TransactionEntry { accountId: string; type: TransactionEntryType; amount: MoneyAmount; }
export interface TransactionRecord { id: string; idempotencyKey: string; operation: "SEND" | "RECEIVE" | "PAY" | "REFUND" | "EXCHANGE"; status: TransactionStatus; entries: readonly TransactionEntry[]; providerReference?: string; createdAt: string; updatedAt: string; }

export function assertBalanced(entries: readonly TransactionEntry[]): void {
  const totals = new Map<string, bigint>();
  for (const entry of entries) {
    const current = totals.get(entry.amount.currency) ?? 0n;
    const value = BigInt(entry.amount.amount);
    totals.set(entry.amount.currency, current + (entry.type === "CREDIT" || entry.type === "RELEASE" ? value : -value));
  }
  for (const [currency, total] of totals) if (total !== 0n) throw new Error(`Unbalanced transaction in ${currency}`);
}

export function createTransaction(input: Omit<TransactionRecord, "createdAt" | "updatedAt">, now = new Date()): TransactionRecord {
  assertBalanced(input.entries);
  const timestamp = now.toISOString();
  return { ...input, createdAt: timestamp, updatedAt: timestamp };
}

export function transitionTransaction(tx: TransactionRecord, status: TransactionStatus, now = new Date()): TransactionRecord {
  const allowed: Record<TransactionStatus, readonly TransactionStatus[]> = { PENDING: ["AUTHORIZED", "FAILED", "RELEASED"], AUTHORIZED: ["COMMITTED", "RELEASED", "FAILED"], COMMITTED: ["SETTLED", "FAILED"], SETTLED: [], RELEASED: [], FAILED: [] };
  if (!allowed[tx.status].includes(status)) throw new Error(`Invalid transaction transition: ${tx.status} -> ${status}`);
  return { ...tx, status, updatedAt: now.toISOString() };
}
