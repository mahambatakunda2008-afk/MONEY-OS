import { createClient } from "../../lib/supabase";

export type SimulationExecution = {
  transaction: unknown;
  transactionId?: string;
  status: string;
  fundsHeld: boolean;
  executionStarted: boolean;
};

export async function authorizeSimulatorTransfer(accountId: string, amountMinor: number, currency: string, recipientPhone: string): Promise<SimulationExecution> {
  if (!accountId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || !/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid simulator transfer");
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("money-begin-transfer", {
    body: { accountId, amountMinor, currency, idempotencyKey: `sim-${crypto.randomUUID()}-${Date.now()}`, recipientPhone },
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  if (!data || typeof data !== "object") throw new Error("Invalid simulator response");
  const payload = data as Record<string, unknown>;
  const tx = payload.transaction;
  const transactionId = tx && typeof tx === "object" && "id" in tx && typeof (tx as {id?:unknown}).id === "string" ? (tx as {id:string}).id : undefined;
  return {
    transaction: tx,
    transactionId,
    status: typeof payload.status === "string" ? payload.status : "UNKNOWN",
    fundsHeld: payload.fundsHeld === true,
    executionStarted: payload.executionStarted === true,
  };
}

export async function simulateSettlement(transactionId: string, outcome: "SUCCEEDED" | "FAILED" | "UNKNOWN") {
  if (!transactionId) throw new Error("Transaction id required");
  const { data, error } = await createClient().rpc("simulate_money_settlement_outcome", { p_transaction_id: transactionId, p_outcome: outcome });
  if (error) throw error;
  if (!data) throw new Error("Simulator settlement returned no result");
  return data as Record<string, unknown>;
}
