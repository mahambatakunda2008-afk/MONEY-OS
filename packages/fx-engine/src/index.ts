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

  const [ai, af = ""] = amount.split(".");
  const [ri, rf = ""] = rate.split(".");
  const scale = af.length + rf.length;
  const product = BigInt(ai + af.padEnd(af.length, "0")) * BigInt(ri + rf.padEnd(rf.length, "0"));
  const raw = product.toString().padStart(scale + 1, "0");

  if (scale === 0) return raw;
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
