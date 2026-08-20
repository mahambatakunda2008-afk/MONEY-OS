export interface CurrencyDefinition {
  code: string;
  name: string;
  numericCode: string;
  minorUnit: number;
  symbol?: string;
}

/**
 * ISO 4217-oriented registry. This is deliberately data-only and is not a
 * statement that every currency is currently supported by every provider.
 */
export const CURRENCIES: readonly CurrencyDefinition[] = [
  { code: "AED", name: "United Arab Emirates dirham", numericCode: "784", minorUnit: 2 },
  { code: "ARS", name: "Argentine peso", numericCode: "032", minorUnit: 2 },
  { code: "AUD", name: "Australian dollar", numericCode: "036", minorUnit: 2, symbol: "$" },
  { code: "BWP", name: "Botswana pula", numericCode: "072", minorUnit: 2, symbol: "P" },
  { code: "CAD", name: "Canadian dollar", numericCode: "124", minorUnit: 2, symbol: "$" },
  { code: "CHF", name: "Swiss franc", numericCode: "756", minorUnit: 2 },
  { code: "CNY", name: "Chinese yuan", numericCode: "156", minorUnit: 2, symbol: "¥" },
  { code: "EGP", name: "Egyptian pound", numericCode: "818", minorUnit: 2, symbol: "£" },
  { code: "EUR", name: "Euro", numericCode: "978", minorUnit: 2, symbol: "€" },
  { code: "GBP", name: "Pound sterling", numericCode: "826", minorUnit: 2, symbol: "£" },
  { code: "GHS", name: "Ghanaian cedi", numericCode: "936", minorUnit: 2, symbol: "₵" },
  { code: "HKD", name: "Hong Kong dollar", numericCode: "344", minorUnit: 2, symbol: "$" },
  { code: "INR", name: "Indian rupee", numericCode: "356", minorUnit: 2, symbol: "₹" },
  { code: "JPY", name: "Japanese yen", numericCode: "392", minorUnit: 0, symbol: "¥" },
  { code: "KES", name: "Kenyan shilling", numericCode: "404", minorUnit: 2, symbol: "KSh" },
  { code: "KRW", name: "South Korean won", numericCode: "410", minorUnit: 0, symbol: "₩" },
  { code: "MUR", name: "Mauritian rupee", numericCode: "480", minorUnit: 2 },
  { code: "MWK", name: "Malawian kwacha", numericCode: "454", minorUnit: 2 },
  { code: "MZN", name: "Mozambican metical", numericCode: "943", minorUnit: 2 },
  { code: "NGN", name: "Nigerian naira", numericCode: "566", minorUnit: 2, symbol: "₦" },
  { code: "NZD", name: "New Zealand dollar", numericCode: "554", minorUnit: 2, symbol: "$" },
  { code: "SGD", name: "Singapore dollar", numericCode: "702", minorUnit: 2, symbol: "$" },
  { code: "TZS", name: "Tanzanian shilling", numericCode: "834", minorUnit: 2 },
  { code: "UGX", name: "Ugandan shilling", numericCode: "800", minorUnit: 0 },
  { code: "USD", name: "United States dollar", numericCode: "840", minorUnit: 2, symbol: "$" },
  { code: "XOF", name: "West African CFA franc", numericCode: "952", minorUnit: 0 },
  { code: "ZAR", name: "South African rand", numericCode: "710", minorUnit: 2, symbol: "R" },
  { code: "ZMW", name: "Zambian kwacha", numericCode: "967", minorUnit: 2 },
  { code: "ZWG", name: "Zimbabwe Gold", numericCode: "924", minorUnit: 2, symbol: "ZiG" },
] as const;

export const CURRENCY_BY_CODE = new Map(CURRENCIES.map((currency) => [currency.code, currency]));

export function getCurrency(code: string): CurrencyDefinition | undefined {
  return CURRENCY_BY_CODE.get(code.trim().toUpperCase());
}

export function assertCurrency(code: string): CurrencyDefinition {
  const currency = getCurrency(code);
  if (!currency) throw new Error(`Unsupported currency code: ${code}`);
  return currency;
}
