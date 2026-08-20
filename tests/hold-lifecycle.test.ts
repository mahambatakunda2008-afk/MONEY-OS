import { describe, expect, it } from "vitest";
import { commitHold, credit, hold, releaseHold, settleCommitted } from "../packages/money-core/src/balances";

describe("HOLD lifecycle", () => {
  it("moves funds available → held → committed → settled", () => {
    const initial = credit({}, { amount: "100", currency: "USD" });
    const held = hold(initial, { amount: "40", currency: "USD" });
    expect(held.USD).toMatchObject({ available: "60", held: "40" });
    const committed = commitHold(held, { amount: "25", currency: "USD" });
    expect(committed.USD).toMatchObject({ available: "60", held: "15", committed: "25" });
    const settled = settleCommitted(committed, { amount: "25", currency: "USD" });
    expect(settled.USD).toMatchObject({ available: "60", held: "15", committed: "0" });
  });

  it("can release an unused hold", () => {
    const initial = credit({}, { amount: "50", currency: "USD" });
    const held = hold(initial, { amount: "20", currency: "USD" });
    const released = releaseHold(held, { amount: "20", currency: "USD" });
    expect(released.USD).toMatchObject({ available: "50", held: "0" });
  });

  it("prevents committing more than is held", () => {
    const held = hold(credit({}, { amount: "10", currency: "USD" }), { amount: "4", currency: "USD" });
    expect(() => commitHold(held, { amount: "5", currency: "USD" })).toThrow("Insufficient held");
  });
});
