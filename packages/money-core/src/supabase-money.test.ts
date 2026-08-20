import { describe, expect, it } from "vitest";
import { beginMoneyTransaction, commitMoneyTransaction, createMoneyAccount, releaseMoneyTransaction, type SupabaseRpcClient } from "./supabase-money";

type Call = { name: string; args: Record<string, unknown> };
function fakeClient(result: unknown, calls: Call[]): SupabaseRpcClient { return { async rpc(name, args) { calls.push({ name, args }); return { data: result, error: null }; } }; }

describe("Supabase money RPC adapter", () => {
  it("normalizes currencies when creating accounts and beginning transactions", async () => {
    const calls: Call[] = [];
    const client = fakeClient("account-1", calls);
    expect(await createMoneyAccount(client, "usd")).toBe("account-1");
    await beginMoneyTransaction(client, { idempotencyKey: "idem-1234", operation: "PAY", accountId: "account-1", amountMinor: "1000", currency: "usd" });
    expect(calls[0]).toEqual({ name: "create_money_account", args: { p_currency: "USD" } });
    expect(calls[1].args.p_currency).toBe("USD");
  });
  it("passes provider references only when supplied", async () => {
    const calls: Call[] = [];
    const tx = { id: "tx-1", owner_id: "u-1", idempotency_key: "idem-1234", operation: "PAY" as const, status: "COMMITTED" as const, provider_reference: "ref-1", created_at: "now", updated_at: "now" };
    const client = fakeClient(tx, calls);
    await commitMoneyTransaction(client, "tx-1", "ref-1");
    await releaseMoneyTransaction(client, "tx-1");
    expect(calls[0].args).toEqual({ p_transaction_id: "tx-1", p_provider_reference: "ref-1" });
    expect(calls[1].args).toEqual({ p_transaction_id: "tx-1" });
  });
  it("surfaces RPC errors", async () => {
    const client: SupabaseRpcClient = { async rpc() { return { data: null, error: { message: "Insufficient available balance" } }; } };
    await expect(createMoneyAccount(client, "USD")).rejects.toThrow("Insufficient available balance");
  });
});
