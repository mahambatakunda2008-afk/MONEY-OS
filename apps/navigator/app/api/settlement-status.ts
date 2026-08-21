export type SettlementAttemptStatus = "PROCESSING" | "SUCCEEDED" | "FAILED";

export function settlementOutcome(status: SettlementAttemptStatus) {
  if (status === "SUCCEEDED") return { terminal: true, label: "Settlement succeeded" };
  if (status === "FAILED") return { terminal: true, label: "Settlement failed" };
  return { terminal: false, label: "Settlement processing" };
}
