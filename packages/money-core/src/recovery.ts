export type RecoveryAction = "RETRY" | "ROUTE_SWITCH" | "WAIT" | "REFUND" | "USER_ACTION_REQUIRED";

export interface RecoveryOption {
  action: RecoveryAction;
  reason: string;
  requiresUserApproval: boolean;
}

export interface RecoveryPlan {
  executionId: string;
  failureCode: string;
  options: RecoveryOption[];
}

export function createRecoveryPlan(executionId: string, failureCode: string): RecoveryPlan {
  const options: RecoveryOption[] = [
    { action: "RETRY", reason: "The failure may be transient.", requiresUserApproval: false },
    { action: "ROUTE_SWITCH", reason: "An alternative route may be available.", requiresUserApproval: true },
    { action: "REFUND", reason: "Return funds when the operation cannot be completed.", requiresUserApproval: true },
  ];
  return { executionId, failureCode, options };
}
