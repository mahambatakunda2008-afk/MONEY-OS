import { describe, expect, it } from "vitest";
import { credit, debit, getBalance, hold, releaseHold } from "../packages/money-core/src/index";

describe("multi-currency balances", () => {
  it("keeps currencies isolated", () => {
    const usd = credit({}, { amount: "800", currency: "USD" });
    const mixed = credit(usd, { amount: "1000", currency: "ZAR" });

    expect(getBalance(mixed, "USD").available).toBe("800");
    expect(getBalance(mixed, "ZAR").available).toBe("1000");
  });

  it("moves funds between available and held without changing total value", () => {
    const funded = credit({}, { amount: "800", currency: "USD" });
    const reserved = hold(funded, { amount: "200", currency: "USD" });

    expect(getBalance(reserved, "USD")).toMatchObject({ available: "600", held: "200" });

    const released = releaseHold(reserved, { amount: "200", currency: "USD" });
    expect(getBalance(released, "USD")).toMatchObject({ available: "800", held: "0" });
  });

  it("rejects spending more than the available balance", () => {
    const funded = credit({}, { amount: "100", currency: "USD" });
    expect(() => debit(funded, { amount: "100.01", currency: "USD" })).toThrow("Insufficient available USD balance");
  });
});
