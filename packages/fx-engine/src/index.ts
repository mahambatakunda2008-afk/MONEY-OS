import { assertDecimal } from "../../money-core/src/decimal";

export interface FxRate {
  base: string;
  quote: string;
  rate: string;
  asOf: string;
  source: string;
}

export function convert(amount: string, rate: string): string {
  assertDecimal(amount);
  assertDecimal(rate);
  if (rate === "0") throw new Error("FX rate must be greater than zero");

  const [ai, af = ""] = amount.split(".");
  const [ri, rf = ""] = rate.split(".");
  const scale = af.length + rf.length;
  const product = BigInt(ai + af) * BigInt(ri + rf);
  const raw = product.toString().padStart(scale + 1, "0");

  if (scale === 0) return raw;
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

export function invertRate(rate: string): string {
  assertDecimal(rate);
  if (rate === "0") throw new Error("FX rate must be greater than zero");
  const precision = 18;
  const [ri, rf = ""] = rate.split(".");
  const scale = rf.length;
  const numerator = 10n ** BigInt(scale + precision);
  const denominator = BigInt(ri + rf);
  const quotient = numerator / denominator;
  const raw = quotient.toString().padStart(precision + 1, "0");
  return `${raw.slice(0, -precision)}.${raw.slice(-precision)}`.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
