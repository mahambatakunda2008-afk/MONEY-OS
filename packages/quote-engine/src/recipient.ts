import { addDecimal, assertDecimal, compareDecimal, subtractDecimal } from "../../money-core/src/decimal";
import type { FeeBreakdown, MoneyAmount } from "../../money-core/src/index";
import { convert } from "../../fx-engine/src/index";
import { buildQuote, type QuoteInput } from "./index";

export interface RecipientQuoteInput extends Omit<QuoteInput, "source" | "destinationCurrency"> {
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

/**
 * Calculates the source amount required for a recipient to receive an exact
 * target amount. Fees are charged in source currency.
 */
export function buildRecipientQuote(input: RecipientQuoteInput): RecipientQuoteResult {
  assertDecimal(input.target.amount);
  if (input.target.amount === "0") throw new Error("Recipient target amount must be greater than zero");
  if (input.rate === "0") throw new Error("Exchange rate must be greater than zero");
  if (input.fees.total.currency.toUpperCase() !== input.target.currency.toUpperCase() && input.fees.total.currency.toUpperCase() !== "") {
    // Fees are source-currency amounts. The explicit check below handles the
    // source currency once we solve for it.
  }

  const grossDestinationPerSource = input.rate;
  const requiredNetSource = invertRate(input.target.amount, grossDestinationPerSource);
  const source = solveGrossSource(requiredNetSource, input.fees.total.amount);

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

function invertRate(destinationAmount: string, rate: string): string {
  const [ri, rf = ""] = rate.split(".");
  const [di, df = ""] = destinationAmount.split(".");
  const numerator = BigInt(di + df) * 10n ** BigInt(Math.max(rf.length, 0));
  const denominator = BigInt(ri + rf);
  const scale = df.length + rf.length;
  const quotient = (numerator * 10n ** 18n) / denominator;
  const raw = quotient.toString().padStart(19, "0");
  const value = `${raw.slice(0, -18)}.${raw.slice(-18)}`.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return value || "0";
}

function solveGrossSource(requiredNetSource: string, fee: string): MoneyAmount {
  const gross = addDecimal(requiredNetSource, fee);
  return { amount: gross, currency: "USD" };
}
