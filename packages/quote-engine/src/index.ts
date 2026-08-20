import { addDecimal, subtractDecimal } from "../../money-core/src/decimal";
import type { FeeBreakdown, MoneyAmount, MoneyQuote } from "../../money-core/src/index";
import { calculateFees } from "../../fee-engine/src/index";
import { convert } from "../../fx-engine/src/index";

export interface QuoteInput {
  id: string;
  source: MoneyAmount;
  destinationCurrency: string;
  rate: string;
  fees: FeeBreakdown;
  providerId: string;
  routeId: string;
  estimatedArrivalMinutes: number;
  expiresAt: string;
}

/** Builds a quote from a source amount. Fees are charged in source currency. */
export function buildQuote(input: QuoteInput): MoneyQuote {
  if (input.source.amount === "0") throw new Error("Quote source amount must be greater than zero");
  if (input.fees.total.currency !== input.source.currency) {
    throw new Error("Quote fees must use the source currency");
  }

  const netSource = subtractDecimal(input.source.amount, input.fees.total.amount);
  const destinationAmount = convert(netSource, input.rate);
  const effectiveRate = destinationAmount === "0" ? "0" : divideDecimal(destinationAmount, input.source.amount);

  return {
    id: input.id,
    source: input.source,
    destination: { amount: destinationAmount, currency: input.destinationCurrency.toUpperCase() },
    exchangeRate: input.rate,
    fees: input.fees,
    effectiveRate,
    estimatedArrivalMinutes: input.estimatedArrivalMinutes,
    expiresAt: input.expiresAt,
    providerId: input.providerId,
    routeId: input.routeId,
  };
}

function divideDecimal(numerator: string, denominator: string): string {
  if (denominator === "0") throw new Error("Cannot divide by zero");
  const [ni, nf = ""] = numerator.split(".");
  const [di, df = ""] = denominator.split(".");
  const precision = 18;
  const scale = precision + df.length - nf.length;
  const scaledNumerator = BigInt(ni + nf) * 10n ** BigInt(Math.max(scale, 0));
  const scaledDenominator = BigInt(di + df) * 10n ** BigInt(Math.max(-scale, 0));
  const quotient = scaledNumerator / scaledDenominator;
  const raw = quotient.toString().padStart(precision + 1, "0");
  return `${raw.slice(0, -precision)}.${raw.slice(-precision)}`
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export { calculateFees, addDecimal };
