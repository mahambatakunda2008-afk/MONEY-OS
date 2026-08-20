export type LedgerAccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface LedgerAccount {
  id: string;
  name: string;
  type: LedgerAccountType;
  currency: string;
}

export interface LedgerEntry {
  accountId: string;
  amount: string;
  currency: string;
}

export interface LedgerTransaction {
  id: string;
  executionId: string;
  idempotencyKey: string;
  description: string;
  entries: readonly LedgerEntry[];
  createdAt: string;
  reversedTransactionId?: string;
}

export function validateDoubleEntry(transaction: LedgerTransaction): void {
  if (transaction.entries.length < 2) throw new Error("Ledger transaction requires at least two entries");
  for (const currency of new Set(transaction.entries.map((e) => e.currency.toUpperCase()))) {
    const entries = transaction.entries.filter((e) => e.currency.toUpperCase() === currency);
    const scale = Math.max(...entries.map(decimalScale));
    const total = entries.reduce((sum, e) => sum + signedMinor(e.amount, scale), 0n);
    if (total !== 0n) throw new Error(`Ledger transaction is not balanced for ${currency}`);
  }
}

export function reverseTransaction(original: LedgerTransaction, reversalId: string, now = new Date()): LedgerTransaction {
  if (original.reversedTransactionId) throw new Error("Ledger transaction has already been reversed");
  const entries = original.entries.map((entry) => ({ ...entry, amount: `-${entry.amount}` }));
  const reversal: LedgerTransaction = {
    id: reversalId,
    executionId: original.executionId,
    idempotencyKey: `${original.idempotencyKey}:reversal`,
    description: `Reversal of ${original.id}`,
    entries,
    createdAt: now.toISOString(),
    reversedTransactionId: original.id,
  };
  validateDoubleEntry(reversal);
  return reversal;
}

function decimalScale(amount: string): number {
  const unsigned = amount.startsWith("-") ? amount.slice(1) : amount;
  return unsigned.includes(".") ? unsigned.split(".")[1]?.length ?? 0 : 0;
}

function signedMinor(amount: string, scale: number): bigint {
  const negative = amount.startsWith("-");
  const unsigned = negative ? amount.slice(1) : amount;
  const [whole, fraction = ""] = unsigned.split(".");
  const value = BigInt(whole) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, "0"));
  return negative ? -value : value;
}
