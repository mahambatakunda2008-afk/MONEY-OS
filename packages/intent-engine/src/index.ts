import type { MoneyAction, MoneyIntent } from "../../money-core/src/index";

const CURRENCY_ALIASES: Record<string, string> = {
  usd: "USD", dollar: "USD", dollars: "USD",
  eur: "EUR", euro: "EUR", euros: "EUR",
  gbp: "GBP", pound: "GBP", pounds: "GBP",
  zar: "ZAR", rand: "ZAR",
  zwg: "ZWG", zwd: "ZWD",
};

function currencyFromText(text: string): string | undefined {
  for (const [alias, code] of Object.entries(CURRENCY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(text)) return code;
  }
  return undefined;
}

function amountFromText(text: string): string | undefined {
  const match = text.match(/(?:^|\s|[$£€])([0-9]+(?:\.[0-9]+)?)(?=\s|$)/);
  return match?.[1];
}

function detectAction(text: string): MoneyAction {
  const lower = text.toLowerCase();
  if (/\bhold|reserve|set aside\b/.test(lower)) return "HOLD";
  if (/\bconvert|exchange\b/.test(lower)) return "CONVERT";
  if (/\bschedule|every month|every week|recurring\b/.test(lower)) return "SCHEDULE";
  if (/\bsplit\b/.test(lower)) return "SPLIT";
  if (/\bpay|purchase|buy\b/.test(lower)) return "PAY";
  if (/\breceive\b/.test(lower)) return "RECEIVE";
  if (/\bsend|transfer\b/.test(lower)) return "SEND";
  return "MOVE";
}

export function parseIntent(text: string, id = `intent_${Date.now()}`): MoneyIntent {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Intent text cannot be empty");

  const currency = currencyFromText(trimmed);
  const amount = amountFromText(trimmed);
  const action = detectAction(trimmed);

  const intent: MoneyIntent = { id, action, purpose: trimmed };

  if (amount && currency) intent.amount = { amount, currency };
  if (/receive/i.test(trimmed) && amount && currency) intent.targetAmount = { amount, currency };
  if (/mum|mother/i.test(trimmed)) intent.destination = { type: "PERSON", id: "mum" };
  if (/dad|father/i.test(trimmed)) intent.destination = { type: "PERSON", id: "dad" };
  if (/sister/i.test(trimmed)) intent.destination = { type: "PERSON", id: "sister" };

  return intent;
}
