import { createHash } from "node:crypto";

const PAYNOW_INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";

export type PaynowInitResult = {
  status: "Ok";
  browserUrl: string;
  pollUrl: string;
  paynowReference?: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured on the server`);
  return value;
}

export function paynowHash(values: Record<string, string>): string {
  const key = required("PAYNOW_INTEGRATION_KEY");
  const raw = Object.entries(values)
    .filter(([name]) => name.toLowerCase() !== "hash")
    .map(([, value]) => value ?? "")
    .join("") + key;
  return createHash("sha512").update(raw, "utf8").digest("hex").toUpperCase();
}

export function verifyPaynowHash(values: Record<string, string>): boolean {
  const received = values.hash ?? values.Hash;
  if (!received) return false;
  return paynowHash(values) === received.toUpperCase();
}

function parsePaynowResponse(text: string): Record<string, string> {
  const params = new URLSearchParams(text.trim());
  return Object.fromEntries(params.entries());
}

export async function initiatePaynowFunding(input: {
  reference: string;
  amount: number;
  additionalInfo?: string;
  returnUrl: string;
  resultUrl: string;
}): Promise<PaynowInitResult> {
  const id = required("PAYNOW_INTEGRATION_ID");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Paynow amount must be positive");

  const values: Record<string, string> = {
    id,
    reference: input.reference,
    amount: input.amount.toFixed(2),
    additionalinfo: input.additionalInfo ?? "Shadecode Money wallet funding",
    returnurl: input.returnUrl,
    resulturl: input.resultUrl,
    status: "Message",
  };
  values.hash = paynowHash(values);

  const response = await fetch(PAYNOW_INITIATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Paynow initiation failed with HTTP ${response.status}`);

  const parsed = parsePaynowResponse(await response.text());
  if (parsed.status?.toLowerCase() !== "ok") throw new Error(parsed.error || "Paynow rejected the transaction");
  if (!parsed.browserurl || !parsed.pollurl || !verifyPaynowHash(parsed)) throw new Error("Invalid Paynow initiation response");

  return {
    status: "Ok",
    browserUrl: parsed.browserurl,
    pollUrl: parsed.pollurl,
    ...(parsed.paynowreference ? { paynowReference: parsed.paynowreference } : {}),
  };
}

export async function pollPaynow(pollUrl: string): Promise<Record<string, string>> {
  if (!pollUrl.startsWith("https://www.paynow.co.zw/")) throw new Error("Invalid Paynow poll URL");
  const response = await fetch(pollUrl, { method: "POST", cache: "no-store" });
  if (!response.ok) throw new Error(`Paynow polling failed with HTTP ${response.status}`);
  const parsed = parsePaynowResponse(await response.text());
  if (!verifyPaynowHash(parsed)) throw new Error("Invalid Paynow status signature");
  return parsed;
}
