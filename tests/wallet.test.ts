import { describe, expect, it } from "vitest";
import { createWallet, freezeWallet, transferWallets, walletCredit, walletHold } from "../packages/money-core/src/wallet";

describe("wallet", () => {
  it("supports owned multi-currency balances", () => {
    let wallet = createWallet("w1", "user1");
    wallet = walletCredit(wallet, { amount: "100", currency: "USD" });
    wallet = walletCredit(wallet, { amount: "2500", currency: "ZAR" });
    expect(wallet.balances.USD?.available).toBe("100");
    expect(wallet.balances.ZAR?.available).toBe("2500");
  });

  it("prevents operations on frozen wallets", () => {
    const wallet = freezeWallet(createWallet("w1", "user1"));
    expect(() => walletCredit(wallet, { amount: "1", currency: "USD" })).toThrow("frozen");
  });

  it("transfers only available funds between distinct active wallets", () => {
    const a = walletCredit(createWallet("a", "u1"), { amount: "100", currency: "USD" });
    const b = createWallet("b", "u2");
    const result = transferWallets(a, b, { amount: "40", currency: "USD" });
    expect(result.from.balances.USD?.available).toBe("60");
    expect(result.to.balances.USD?.available).toBe("40");
  });

  it("uses HOLD instead of spending held funds", () => {
    const wallet = walletHold(walletCredit(createWallet("w1", "u1"), { amount: "50", currency: "USD" }), { amount: "20", currency: "USD" });
    expect(wallet.balances.USD).toMatchObject({ available: "30", held: "20" });
  });
});
