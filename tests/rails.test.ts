import { describe, expect, it } from "vitest";
import { rankRails, selectRail, type PaymentRail } from "../packages/money-core/src/rails";

const rails: PaymentRail[] = [
  { id: "internal", type: "INTERNAL", provider: "shadecode", countries: ["ZW", "ZA"], currencies: ["USD", "ZAR"], status: "ACTIVE", capabilities: ["SEND", "RECEIVE", "PAY"] },
  { id: "bank-1", type: "BANK", provider: "bank", countries: ["ZA"], currencies: ["ZAR"], status: "ACTIVE", capabilities: ["SEND", "RECEIVE"] },
  { id: "offline", type: "BANK", provider: "bank", countries: ["ZA"], currencies: ["ZAR"], status: "UNAVAILABLE", capabilities: ["SEND"] },
];

describe("payment rails", () => {
  it("filters by status, country, currency and capability", () => {
    expect(rankRails(rails, { amount: { amount: "20", currency: "ZAR" }, destinationCountry: "ZA", capability: "SEND" }).map((r) => r.railId)).toEqual(["internal", "bank-1"]);
  });
  it("prefers an internal rail deterministically", () => {
    expect(selectRail(rails, { amount: { amount: "20", currency: "USD" }, destinationCountry: "ZA", capability: "PAY" }).id).toBe("internal");
  });
  it("rejects when no rail is eligible", () => {
    expect(() => selectRail(rails, { amount: { amount: "20", currency: "GBP" }, destinationCountry: "ZA", capability: "PAY" })).toThrow("No eligible payment rail");
  });
});
