import { createClient } from "../../lib/supabase";

export type SimulationExecution = {
  transaction: unknown;
  status: string;
  fundsHeld: boolean;
  executionStarted: boolean;
};

export async function authorizeSimulatorTransfer(accountId: string, amountMinor: number, currency: string, recipientPhone: string): Promise<SimulationExecution> {
  if (!accountId || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || !/^[A-Z]{3}$/.test(currency)) throw new Error("Invalid simulator transfer");
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("money-begin-transfer", {
    body: {
      accountId,
      amountMinor,
      currency,
      idempotencyKey: `sim-${crypto.randomUUID()}-${Date.now()}`,
      recipientPhone,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  if (!data || typeof data !== "object") throw new Error("Invalid simulator response");
  const payload = data as Record<string, unknown>;
  return {
    transaction: payload.transaction,
    status: typeof payload.status === "string" ? payload.status : "UNKNOWN",
    fundsHeld: payload.fundsHeld === true,
    executionStarted: payload.executionStarted === true,
  };
}
