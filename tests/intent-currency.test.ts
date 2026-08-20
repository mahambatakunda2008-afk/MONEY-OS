import { describe, expect, it } from "vitest";
import { assertCurrency, getCurrency } from "../packages/money-core/src/index";
import { parseIntent } from "../packages/intent-engine/src/index";

describe("intent parsing hardening", () => {
  it("parses exact recipient amounts with punctuation", () => {
    const intent = parseIntent("Send enough money so Mum receives $300.", "intent-punctuation");

    expect(intent.action).toBe("SEND");
    expect(intent.targetAmount).toEqual({ amount: "300", currency: "USD" });
    expect(intent.amount).toBeUndefined();
    expect(intent.destination).toEqual({ type: "PERSON", id: "mum" });
  });

  it("parses comma-separated amounts", () => {
    expect(parseIntent("Convert $5,000 USD", "intent-commas").amount).toEqual({
      amount: "5000",
      currency: "USD",
    });
  });

  it("detects HOLD explicitly", () => {
    expect(parseIntent("Hold $200 USD for emergencies", "intent-hold")).toMatchObject({
      action: "HOLD",
      amount: { amount: "200", currency: "USD" },
    });
  });
});

describe("currency registry", () => {
  it("normalizes currency codes", () => {
    expect(getCurrency(" usd ")?.code).toBe("USD");
    expect(getCurrency("zar")?.name).toBe("South African rand");
    expect(getCurrency("JPY")?.minorUnit).toBe(0);
  });

  it("rejects unknown currency codes", () => {
    expect(() => assertCurrency("XXX")).toThrow("Unsupported currency code: XXX");
  });
});
