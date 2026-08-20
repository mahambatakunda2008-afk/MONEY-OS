import { assertTransition, type MoneyAmount, type MoneyPlan, type MoneyState } from "../../money-core/src/index";
import { assessRouteRisk, isRouteExecutable } from "../../route-engine/src/route-risk";

export type ExecutionStatus = "AWAITING_APPROVAL" | "AUTHORIZED" | "EXECUTING" | "SETTLED" | "FAILED" | "CANCELLED";

export interface ExecutionAuthorization {
  approvedBy: string;
  approvedAt: string;
  authorizationId: string;
}

export interface ExecutionRecord {
  id: string;
  planId: string;
  idempotencyKey: string;
  status: ExecutionStatus;
  source?: MoneyAmount;
  authorization?: ExecutionAuthorization;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionRequest {
  executionId: string;
  idempotencyKey: string;
  plan: MoneyPlan;
  source?: MoneyAmount;
}

export function prepareExecution(request: ExecutionRequest, now = new Date()): ExecutionRecord {
  if (!request.idempotencyKey.trim()) throw new Error("Execution requires an idempotency key");
  if (request.plan.status !== "READY") throw new Error("Only READY plans can be prepared for execution");
  const route = request.plan.recommendedRoute;
  if (route) {
    const risk = assessRouteRisk(route, now);
    if (!isRouteExecutable(risk)) throw new Error(`Route is not executable: ${risk.blockers.join(" ")}`);
  }
  const timestamp = now.toISOString();
  return {
    id: request.executionId,
    planId: request.plan.id,
    idempotencyKey: request.idempotencyKey,
    status: "AWAITING_APPROVAL",
    ...(request.source ? { source: request.source } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function authorizeExecution(record: ExecutionRecord, authorization: ExecutionAuthorization, now = new Date()): ExecutionRecord {
  if (record.status !== "AWAITING_APPROVAL") throw new Error(`Cannot authorize execution from ${record.status}`);
  if (!authorization.approvedBy.trim() || !authorization.authorizationId.trim()) throw new Error("Authorization identity is required");
  return { ...record, status: "AUTHORIZED", authorization, updatedAt: now.toISOString() };
}

export function beginExecution(record: ExecutionRecord, now = new Date()): ExecutionRecord {
  if (record.status !== "AUTHORIZED") throw new Error(`Cannot execute from ${record.status}`);
  return { ...record, status: "EXECUTING", updatedAt: now.toISOString() };
}

export function settleExecution(record: ExecutionRecord, now = new Date()): ExecutionRecord {
  if (record.status !== "EXECUTING") throw new Error(`Cannot settle from ${record.status}`);
  return { ...record, status: "SETTLED", updatedAt: now.toISOString() };
}

export function failExecution(record: ExecutionRecord, now = new Date()): ExecutionRecord {
  if (record.status !== "EXECUTING") throw new Error(`Cannot fail from ${record.status}`);
  return { ...record, status: "FAILED", updatedAt: now.toISOString() };
}

export function cancelExecution(record: ExecutionRecord, now = new Date()): ExecutionRecord {
  if (record.status !== "AWAITING_APPROVAL" && record.status !== "AUTHORIZED") throw new Error(`Cannot cancel execution from ${record.status}`);
  return { ...record, status: "CANCELLED", updatedAt: now.toISOString() };
}

export function assertExecutionState(record: ExecutionRecord, expected: ExecutionStatus): void {
  if (record.status !== expected) throw new Error(`Expected execution state ${expected}, got ${record.status}`);
}

export function assertMoneyStateTransition(from: MoneyState, to: MoneyState): void {
  assertTransition(from, to);
}
