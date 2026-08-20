export interface FxRate { baseCurrency: string; quoteCurrency: string; rate: string; source: string; observedAt: string; }
export interface FxQuote { id: string; baseCurrency: string; quoteCurrency: string; baseAmountMinor: string; quoteAmountMinor: string; rate: string; feeMinor: string; source: string; createdAt: string; expiresAt: string; }

export function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error(`Invalid currency: ${currency}`);
  return normalized;
}

export function quoteFx(baseAmountMinor: string, rate: string, feeMinor: string, baseCurrency: string, quoteCurrency: string, source: string, now = new Date(), ttlSeconds = 30): FxQuote {
  const base = BigInt(baseAmountMinor);
  const fee = BigInt(feeMinor);
  if (base <= 0n) throw new Error("Base amount must be positive");
  if (fee < 0n) throw new Error("FX fee cannot be negative");
  const rateNumber = Number(rate);
  if (!Number.isFinite(rateNumber) || rateNumber <= 0) throw new Error("FX rate must be positive");
  const quoteMinor = BigInt(Math.floor(Number(base) * rateNumber));
  if (quoteMinor <= 0n) throw new Error("FX quote rounds to zero");
  const createdAt = now.toISOString();
  return { id: crypto.randomUUID(), baseCurrency: normalizeCurrency(baseCurrency), quoteCurrency: normalizeCurrency(quoteCurrency), baseAmountMinor: base.toString(), quoteAmountMinor: quoteMinor.toString(), rate, feeMinor: fee.toString(), source, createdAt, expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString() };
}

export function assertFxQuoteFresh(quote: FxQuote, now = new Date()): void {
  if (Date.parse(quote.expiresAt) <= now.getTime()) throw new Error("FX quote expired");
}
