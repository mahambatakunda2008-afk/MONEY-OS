import type { MoneyAmount } from "./index";
import { credit, debit, hold, releaseHold, commitHold, settleCommitted, type BalanceBook } from "./balances";

export type WalletStatus = "ACTIVE" | "FROZEN" | "CLOSED";
export interface Wallet { id: string; ownerId: string; status: WalletStatus; balances: BalanceBook; createdAt: string; }

export function createWallet(id: string, ownerId: string, now = new Date()): Wallet {
  if (!id.trim() || !ownerId.trim()) throw new Error("Wallet requires an ID and owner");
  return { id, ownerId, status: "ACTIVE", balances: {}, createdAt: now.toISOString() };
}
function requireActive(wallet: Wallet): void { if (wallet.status !== "ACTIVE") throw new Error(`Wallet is ${wallet.status.toLowerCase()}`); }
export function freezeWallet(wallet: Wallet): Wallet { if (wallet.status === "CLOSED") throw new Error("Closed wallet cannot be frozen"); return { ...wallet, status: "FROZEN" }; }
export function closeWallet(wallet: Wallet): Wallet { if (wallet.status === "CLOSED") throw new Error("Wallet is already closed"); return { ...wallet, status: "CLOSED" }; }
export function walletCredit(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: credit(wallet.balances, amount) }; }
export function walletDebit(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: debit(wallet.balances, amount) }; }
export function walletHold(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: hold(wallet.balances, amount) }; }
export function walletReleaseHold(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: releaseHold(wallet.balances, amount) }; }
export function walletCommitHold(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: commitHold(wallet.balances, amount) }; }
export function walletSettleCommitted(wallet: Wallet, amount: MoneyAmount): Wallet { requireActive(wallet); return { ...wallet, balances: settleCommitted(wallet.balances, amount) }; }
export function transferWallets(from: Wallet, to: Wallet, amount: MoneyAmount): { from: Wallet; to: Wallet } {
  requireActive(from); requireActive(to); if (from.id === to.id) throw new Error("Cannot transfer to the same wallet");
  return { from: walletDebit(from, amount), to: walletCredit(to, amount) };
}
