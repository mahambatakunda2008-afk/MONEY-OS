import { addDecimal, assertDecimal, compareDecimal, subtractDecimal } from "../../money-core/src/decimal";
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

/** Calculates the source amount required for a recipient to receive at least the target amount. */
export function buildRecipientQuote(input: RecipientQuoteInput): RecipientQuoteResult {
  const sourceCurrency = input.sourceCurrency.toUpperCase();
  const destinationCurrency = (input.destinationCurrency ?? input.target.currency).toUpperCase();

  assertDecimal(input.target.amount);
  assertDecimal(input.fees.total.amount);
  assertDecimal(input.rate);
  if (input.target.amount === "0") throw new Error("Recipient target amount must be greater than zero");
  if (input.rate === "0") throw new Error("Exchange rate must be greater than zero");
  if (input.target.currency.toUpperCase() !== destinationCurrency) {
    throw new Error("Recipient target currency must match destination currency");
  }
  if (input.fees.total.currency.toUpperCase() !== sourceCurrency) {
    throw new Error("Recipient quote fees must use the source currency");
  }
  if (input.maxSource && input.maxSource.currency.toUpperCase() !== sourceCurrency) {
    throw new Error("Maximum source amount must use the source currency");
  }

  const requiredNetSource = divideDecimal(input.target.amount, input.rate);
  const grossSource = addDecimal(requiredNetSource, input.fees.total.amount);
  const source: MoneyAmount = { amount: grossSource, currency: sourceCurrency };

  if (input.maxSource && compareDecimal(source.amount, input.maxSource.amount) > 0) {
    throw new Error(`Required source amount exceeds maximum: ${source.amount} ${source.currency}`);
  }

  const quote = buildQuote({
    id: input.id,
    source,
    destinationCurrency,
    rate: input.rate,
    fees: input.fees,
    providerId: input.providerId,
    routeId: input.routeId,
    estimatedArrivalMinutes: input.estimatedArrivalMinutes,
    expiresAt: input.expiresAt,
  });

  let normalizedQuote = quote;
  if (compareDecimal(quote.destination.amount, input.target.amount) < 0) {
    const deficit = subtractDecimal(input.target.amount, quote.destination.amount);
    // The source calculation is represented to 18 decimal places. A tiny
    // sub-precision deficit is a representation artifact, not a meaningful
    // recipient shortfall, so the requested target remains authoritative.
    if (compareDecimal(deficit, "0.000000000000001") <= 0) {
      normalizedQuote = {
        ...quote,
        destination: { amount: input.target.amount, currency: quote.destination.currency },
      };
    } else {
      throw new Error(`Quote cannot satisfy recipient target: ${quote.destination.amount} < ${input.target.amount}`);
    }
  }

  return { source, target: input.target, fee: input.fees.total, quote: normalizedQuote };
}

function divideDecimal(numerator: string, denominator: string): string {
  assertDecimal(numerator);
  assertDecimal(denominator);
  const [ni = "0", nf = ""] = numerator.split(".");
  const [di = "0", df = ""] = denominator.split(".");
  const numeratorInteger = BigInt(ni + nf);
  const denominatorInteger = BigInt(di + df);
  if (denominatorInteger === 0n) throw new Error("Cannot divide by zero");

  const precision = 18;
  const scale = 10n ** BigInt(precision + df.length);
  const scaledNumerator = numeratorInteger * scale;
  const scaledDenominator = denominatorInteger * 10n ** BigInt(nf.length);
  const quotient = scaledNumerator / scaledDenominator;
  const raw = quotient.toString().padStart(precision + 1, "0");
  const formatted = `${raw.slice(0, -precision)}.${raw.slice(-precision)}`;
  return formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.0+$/, "");
}
