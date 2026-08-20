import { describe, expect, it } from "vitest";
import { authorizeExecution, beginExecution, cancelExecution, prepareExecution, settleExecution } from "../packages/execution-engine/src/index";
import type { MoneyPlan } from "../packages/money-core/src/index";

const plan: MoneyPlan = {
  id: "plan-1",
  intentId: "intent-1",
  kind: "ROUTE",
  status: "READY",
  alternatives: [],
  steps: [{ id: "step-1", action: "SEND", description: "send", state: "PENDING" }],
  explanation: "ready",
  createdAt: "2026-08-20T00:00:00.000Z",
};

describe("execution lifecycle", () => {
  it("requires approval before execution and settles in order", () => {
    const now = new Date("2026-08-20T10:00:00.000Z");
    const prepared = prepareExecution({ executionId: "exec-1", idempotencyKey: "idem-1", plan }, now);
    expect(prepared.status).toBe("AWAITING_APPROVAL");

    const authorized = authorizeExecution(prepared, {
      approvedBy: "user-1",
      approvedAt: now.toISOString(),
      authorizationId: "auth-1",
    }, now);
    expect(authorized.status).toBe("AUTHORIZED");

    const executing = beginExecution(authorized, now);
    expect(executing.status).toBe("EXECUTING");
    expect(settleExecution(executing, now).status).toBe("SETTLED");
  });

  it("allows cancellation before execution begins", () => {
    const prepared = prepareExecution({ executionId: "exec-2", idempotencyKey: "idem-2", plan });
    expect(cancelExecution(prepared).status).toBe("CANCELLED");
  });

  it("rejects missing idempotency keys", () => {
    expect(() => prepareExecution({ executionId: "exec-3", idempotencyKey: "", plan })).toThrow("idempotency key");
  });
});
