export interface SupabaseRpcClient {
  rpc<T>(name: string, args: Record<string, unknown>): Promise<{ data: T | null; error: { message: string } | null }>;
}

export interface MoneyTransactionRow {
  id: string;
  owner_id: string;
  idempotency_key: string;
  operation: "SEND" | "RECEIVE" | "PAY" | "REFUND" | "EXCHANGE";
  status: "PENDING" | "AUTHORIZED" | "COMMITTED" | "SETTLED" | "RELEASED" | "FAILED";
  provider_reference: string | null;
  created_at: string;
  updated_at: string;
}

export async function createMoneyAccount(client: SupabaseRpcClient, currency: string): Promise<string> {
  const result = await client.rpc<string>("create_money_account", { p_currency: currency.toUpperCase() });
  if (result.error || !result.data) throw new Error(result.error?.message ?? "Failed to create money account");
  return result.data;
}

export async function beginMoneyTransaction(client: SupabaseRpcClient, args: { idempotencyKey: string; operation: MoneyTransactionRow["operation"]; accountId: string; amountMinor: string; currency: string }): Promise<MoneyTransactionRow> {
  const result = await client.rpc<MoneyTransactionRow>("begin_money_transaction", { p_idempotency_key: args.idempotencyKey, p_operation: args.operation, p_account_id: args.accountId, p_amount_minor: args.amountMinor, p_currency: args.currency.toUpperCase() });
  if (result.error || !result.data) throw new Error(result.error?.message ?? "Failed to begin money transaction");
  return result.data;
}

export async function commitMoneyTransaction(client: SupabaseRpcClient, transactionId: string, providerReference?: string): Promise<MoneyTransactionRow> {
  const args: Record<string, unknown> = { p_transaction_id: transactionId };
  if (providerReference !== undefined) args.p_provider_reference = providerReference;
  const result = await client.rpc<MoneyTransactionRow>("commit_money_transaction", args);
  if (result.error || !result.data) throw new Error(result.error?.message ?? "Failed to commit money transaction");
  return result.data;
}

export async function releaseMoneyTransaction(client: SupabaseRpcClient, transactionId: string): Promise<MoneyTransactionRow> {
  const result = await client.rpc<MoneyTransactionRow>("release_money_transaction", { p_transaction_id: transactionId });
  if (result.error || !result.data) throw new Error(result.error?.message ?? "Failed to release money transaction");
  return result.data;
}
