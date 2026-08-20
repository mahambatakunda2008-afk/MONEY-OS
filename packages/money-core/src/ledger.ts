import type { MoneyAmount } from "./index";

export type LedgerEntryType =
  | "CREDIT"
  | "DEBIT"
  | "HOLD"
  | "RELEASE"
  | "FEE"
  | "REFUND"
  | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  transactionId: string;
  type: LedgerEntryType;
  accountId: string;
  amount: MoneyAmount;
  createdAt: string;
  metadata?: Record<string, string>;
}

function toMinorUnits(amount: string, minorUnit = 2): bigint {
  if (!/^\d+(?:\.\d+)?$/.test(amount)) {
    throw new Error(`Invalid non-negative money amount: ${amount}`);
  }
  const [whole = "0", fraction = ""] = amount.split(".");
  const normalizedFraction = fraction.padEnd(minorUnit, "0").slice(0, minorUnit);
  if (fraction.length > minorUnit && /[1-9]/.test(fraction.slice(minorUnit))) {
    throw new Error(`Too many decimal places for ${minorUnit}-decimal currency: ${amount}`);
  }
  return BigInt(whole) * 10n ** BigInt(minorUnit) + BigInt(normalizedFraction || "0");
}

/**
 * A balanced accounting transaction must have equal debit and credit totals
 * per currency. HOLD and RELEASE are reservation events, not accounting
 * movements, so they intentionally do not affect the balance assertion.
 */
export function assertBalanced(entries: readonly LedgerEntry[], minorUnit = 2): void {
  const totals = new Map<string, bigint>();

  for (const entry of entries) {
    if (entry.type === "HOLD" || entry.type === "RELEASE") continue;

    const units = toMinorUnits(entry.amount.amount, minorUnit);
    const signed = entry.type === "DEBIT" || entry.type === "FEE" ? -units : units;
    totals.set(entry.amount.currency, (totals.get(entry.amount.currency) ?? 0n) + signed);
  }

  for (const [currency, total] of totals) {
    if (total !== 0n) throw new Error(`Unbalanced ledger for ${currency}: ${total.toString()}`);
  }
}
