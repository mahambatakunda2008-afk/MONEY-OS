import { describe, expect, it } from "vitest";
import { convert, invertRate } from "../packages/fx-engine/src/index";
import { calculateFees } from "../packages/fee-engine/src/index";

describe("FX engine", () => {
  it("multiplies decimal amounts exactly", () => {
    expect(convert("100", "1.25")).toBe("125");
    expect(convert("1.2", "2.3")).toBe("2.76");
  });

  it("rejects a zero rate", () => {
    expect(() => convert("10", "0")).toThrow();
    expect(() => invertRate("0")).toThrow();
  });
});

describe("fee engine", () => {
  it("sums all fee components", () => {
    const result = calculateFees({
      provider: { amount: "1.20", currency: "USD" },
      network: { amount: "0.30", currency: "USD" },
      platform: { amount: "0.50", currency: "USD" },
    });
    expect(result.total).toEqual({ amount: "2.00", currency: "USD" });
  });

  it("rejects mixed fee currencies", () => {
    expect(() => calculateFees({
      provider: { amount: "1", currency: "USD" },
      network: { amount: "1", currency: "EUR" },
      platform: { amount: "1", currency: "USD" },
    })).toThrow();
  });
});
