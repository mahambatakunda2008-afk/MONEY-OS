import type { MoneyAmount } from "./index";

export type LedgerEntryType = "CREDIT" | "DEBIT" | "HOLD" | "RELEASE" | "FEE" | "REFUND" | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  transactionId: string;
  type: LedgerEntryType;
  accountId: string;
  amount: MoneyAmount;
  createdAt: string;
  metadata?: Record<string, string>;
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

function toMinorUnits(amount: string, minorUnit = 2): bigint {
  if (!/^\d+(?:\.\d+)?$/.test(amount)) throw new Error(`Invalid non-negative money amount: ${amount}`);
  const parts = amount.split(".");
  const whole = parts[0] ?? "0";
  const fraction = parts[1] ?? "";
  if (fraction.length > minorUnit && /[1-9]/.test(fraction.slice(minorUnit))) throw new Error(`Too many decimal places for ${minorUnit}-decimal currency: ${amount}`);
  return BigInt(whole) * 10n ** BigInt(minorUnit) + BigInt(fraction.padEnd(minorUnit, "0"));
}

export function assertBalanced(entries: readonly LedgerEntry[], minorUnit = 2): void {
  const totals = new Map<string, bigint>();
  for (const entry of entries) {
    if (entry.type === "HOLD" || entry.type === "RELEASE") continue;
    const units = toMinorUnits(entry.amount.amount, minorUnit);
    const signed = entry.type === "DEBIT" || entry.type === "FEE" ? -units : units;
    const currency = entry.amount.currency.toUpperCase();
    totals.set(currency, (totals.get(currency) ?? 0n) + signed);
  }
  for (const [currency, total] of totals) if (total !== 0n) throw new Error(`Unbalanced ledger for ${currency}: ${total.toString()}`);
}

export function createLedgerTransaction(input: LedgerTransaction): LedgerTransaction {
  if (!input.idempotencyKey.trim()) throw new Error("Ledger transaction requires an idempotency key");
  if (input.entries.length < 2) throw new Error("Ledger transaction requires at least two entries");
  assertBalanced(input.entries);
  return { ...input, entries: [...input.entries] };
}

export function reverseLedgerTransaction(original: LedgerTransaction, reversalId: string, now = new Date()): LedgerTransaction {
  if (original.reversedTransactionId) throw new Error("Ledger transaction has already been reversed");
  const entries: LedgerEntry[] = original.entries.map((entry, index) => ({ ...entry, id: `${reversalId}:entry:${index + 1}`, transactionId: reversalId, type: reverseEntryType(entry.type), createdAt: now.toISOString() }));
  return createLedgerTransaction({ id: reversalId, executionId: original.executionId, idempotencyKey: `${original.idempotencyKey}:reversal`, description: `Reversal of ${original.id}`, entries, createdAt: now.toISOString(), reversedTransactionId: original.id });
}

function reverseEntryType(type: LedgerEntryType): LedgerEntryType {
  if (type === "CREDIT") return "DEBIT";
  if (type === "DEBIT") return "CREDIT";
  if (type === "FEE") return "REFUND";
  if (type === "REFUND") return "FEE";
  return "ADJUSTMENT";
}
