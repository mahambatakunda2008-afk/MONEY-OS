import { addDecimal, assertDecimal, compareDecimal } from "../../money-core/src/decimal";
import type { MoneyAmount } from "../../money-core/src/index";
import { buildQuote, type QuoteInput } from "./index";

export interface RecipientQuoteInput extends Omit<QuoteInput, "source" | "destinationCurrency"> {
  sourceCurrency: string;
  target: MoneyAmount;
  destinationCurrency?: string;
  maxSource?: MoneyAmount;
}

export interface RecipientQuoteResult {
  source: MoneyAmount;
  target: MoneyAmount;
  fee: MoneyAmount;
  quote: ReturnType<typeof buildQuote>;
}

/** Calculates the source amount required for a recipient to receive at least the exact target amount. */
export function buildRecipientQuote(input: RecipientQuoteInput): RecipientQuoteResult {
  assertDecimal(input.target.amount);
  assertDecimal(input.fees.total.amount);
  assertDecimal(input.rate);
  if (input.target.amount === "0") throw new Error("Recipient target amount must be greater than zero");
  if (input.rate === "0") throw new Error("Exchange rate must be greater than zero");
  if (input.fees.total.currency.toUpperCase() !== input.sourceCurrency.toUpperCase()) {
    throw new Error("Recipient quote fees must use the source currency");
  }
  if (input.maxSource && input.maxSource.currency.toUpperCase() !== input.sourceCurrency.toUpperCase()) {
    throw new Error("Maximum source amount must use the source currency");
  }

  const requiredNetSource = divideDecimalCeil(input.target.amount, input.rate);
  const grossSource = addDecimal(requiredNetSource, input.fees.total.amount);
  const source: MoneyAmount = { amount: grossSource, currency: input.sourceCurrency.toUpperCase() };

  if (input.maxSource && compareDecimal(source.amount, input.maxSource.amount) > 0) {
    throw new Error(`Required source amount exceeds maximum: ${source.amount} ${source.currency}`);
  }

  const quote = buildQuote({
    ...input,
    source,
    destinationCurrency: input.destinationCurrency ?? input.target.currency,
  });

  if (compareDecimal(quote.destination.amount, input.target.amount) < 0) {
    throw new Error(`Quote cannot satisfy exact recipient target: ${quote.destination.amount} < ${input.target.amount}`);
  }

  return { source, target: input.target, fee: input.fees.total, quote };
}

function divideDecimalCeil(numerator: string, denominator: string): string {
  const [ni = "0", nf = ""] = numerator.split(".");
  const [di = "0", df = ""] = denominator.split(".");
  const numeratorInteger = BigInt(ni + nf);
  const denominatorInteger = BigInt(di + df);
  if (denominatorInteger === 0n) throw new Error("Cannot divide by zero");

  const precision = 18;
  const scale = precision + df.length - nf.length;
  const scaledNumerator = numeratorInteger * 10n ** BigInt(Math.max(scale, 0));
  const scaledDenominator = denominatorInteger * 10n ** BigInt(Math.max(-scale, 0));
  const factor = 10n ** BigInt(precision);
  const scaled = scaledNumerator * factor;
  const quotient = (scaled + scaledDenominator - 1n) / scaledDenominator;
  const raw = quotient.toString().padStart(precision + 1, "0");
  return `${raw.slice(0, -precision)}.${raw.slice(-precision)}`
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}
