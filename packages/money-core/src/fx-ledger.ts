import type { MoneyAmount } from "./index";
import { assertBalanced, type LedgerEntry } from "./ledger";

export interface FxLeg {
  accountId: string;
  amount: MoneyAmount;
  type: "CREDIT" | "DEBIT";
}

export interface FxLedgerTransaction {
  id: string;
  executionId: string;
  idempotencyKey: string;
  source: MoneyAmount;
  destination: MoneyAmount;
  rate: string;
  fee?: MoneyAmount;
  legs: readonly FxLeg[];
  createdAt: string;
}

/** Builds separate balanced currency books for an FX conversion. */
export function createFxLedgerTransaction(input: FxLedgerTransaction): FxLedgerTransaction {
  if (!input.idempotencyKey.trim()) throw new Error("FX transaction requires an idempotency key");
  if (input.source.currency.toUpperCase() === input.destination.currency.toUpperCase()) throw new Error("FX transaction requires different currencies");
  if (!/^\d+(?:\.\d+)?$/.test(input.rate) || input.rate === "0") throw new Error("FX rate must be positive");
  const entries: LedgerEntry[] = input.legs.map((leg, index) => ({
    id: `${input.id}:entry:${index + 1}`,
    transactionId: input.id,
    type: leg.type,
    accountId: leg.accountId,
    amount: leg.amount,
    createdAt: input.createdAt,
  }));
  assertBalanced(entries);
  return { ...input, legs: [...input.legs] };
}

export function assertFxAmountMatchesRate(source: MoneyAmount, destination: MoneyAmount, rate: string): void {
  const sourceValue = Number(source.amount);
  const rateValue = Number(rate);
  const destinationValue = Number(destination.amount);
  if (!Number.isFinite(sourceValue) || !Number.isFinite(rateValue) || !Number.isFinite(destinationValue) || rateValue <= 0) throw new Error("Invalid FX amount or rate");
  const expected = sourceValue * rateValue;
  const tolerance = Math.max(0.000001, Math.abs(expected) * 0.0000001);
  if (Math.abs(expected - destinationValue) > tolerance) throw new Error("FX destination does not match the quoted rate");
}
