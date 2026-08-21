import type { MoneyAction, MoneyIntent } from "../../money-core/src/index";

const CURRENCY_ALIASES: Record<string, string> = {
  usd: "USD", dollar: "USD", dollars: "USD", "$": "USD",
  eur: "EUR", euro: "EUR", euros: "EUR", "€": "EUR",
  gbp: "GBP", pound: "GBP", pounds: "GBP", "£": "GBP",
  zar: "ZAR", rand: "ZAR", rands: "ZAR",
  zwg: "ZWG", zwd: "ZWD", "zim dollar": "ZWG",
};

function currencyFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [alias, code] of Object.entries(CURRENCY_ALIASES)) {
    if (alias.length === 1 && /[$€£]/.test(alias)) {
      if (text.includes(alias)) return code;
      continue;
    }
    if (new RegExp(`\\b${alias.replace(" ", "\\s+")}\\b`, "i").test(lower)) return code;
  }
  return undefined;
}

function amountFromText(text: string): string | undefined {
  const match = text.match(/(?:[$€£]|\b(?:USD|EUR|GBP|ZAR|ZWG|ZWD)\b\s*)?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?)/i);
  return match?.[1]?.replaceAll(",", "");
}

function detectAction(text: string): MoneyAction {
  const lower = text.toLowerCase();
  if (/\b(hold|reserve|set aside)\b/.test(lower)) return "HOLD";
  if (/\b(convert|exchange)\b/.test(lower)) return "CONVERT";
  if (/\b(schedule|every month|every week|recurring)\b/.test(lower)) return "SCHEDULE";
  if (/\bsplit\b/.test(lower)) return "SPLIT";
  if (/\b(pay|purchase|buy)\b/.test(lower)) return "PAY";
  if (/\breceive\b/.test(lower)) return "RECEIVE";
  if (/\b(send|transfer)\b/.test(lower)) return "SEND";
  return "MOVE";
}

function destinationFromText(text: string): MoneyIntent["destination"] {
  const lower = text.toLowerCase();
  if (/\b(mum|mother|mom)\b/.test(lower)) return { type: "PERSON", id: "mum" };
  if (/\b(dad|father)\b/.test(lower)) return { type: "PERSON", id: "dad" };
  if (/\bsister\b/.test(lower)) return { type: "PERSON", id: "sister" };
  return undefined;
}

export function parseIntent(text: string, id = `intent_${Date.now()}`): MoneyIntent {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Intent text cannot be empty");

  const currency = currencyFromText(trimmed);
  const amount = amountFromText(trimmed);
  const action = detectAction(trimmed);
  const isTargetAmount = /\b(receive|receives|gets?|arrive|arrives|recipient)\b/i.test(trimmed);

  const intent: MoneyIntent = { id, action, purpose: trimmed };

  if (amount && currency) {
    if (isTargetAmount) intent.targetAmount = { amount, currency };
    else intent.amount = { amount, currency };
  }

  const destination = destinationFromText(trimmed);
  if (destination) intent.destination = destination;

  return intent;
}
