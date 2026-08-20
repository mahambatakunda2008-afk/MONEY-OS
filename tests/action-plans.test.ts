import { describe, expect, it } from "vitest";
import { createActionPlan } from "../packages/route-engine/src/planner";
import type { MoneyIntent } from "../packages/money-core/src/index";

describe("action plans", () => {
  it("creates a HOLD plan without requiring a payment route", () => {
    const intent: MoneyIntent = {
      id: "hold-1",
      action: "HOLD",
      amount: { amount: "200", currency: "USD" },
      hold: { purpose: "emergency reserve" },
    };

    const plan = createActionPlan(intent);

    expect(plan.kind).toBe("HOLD");
    expect(plan.status).toBe("READY");
    expect(plan.recommendedRoute).toBeUndefined();
    expect(plan.quote).toBeUndefined();
    expect(plan.steps[0]?.state).toBe("RESERVED");
  });

  it("creates a recurring schedule plan", () => {
    const intent: MoneyIntent = {
      id: "schedule-1",
      action: "SCHEDULE",
      amount: { amount: "300", currency: "USD" },
      destination: { type: "PERSON", id: "mum" },
      schedule: { frequency: "MONTHLY", nextRunAt: "2026-09-01T09:00:00Z" },
    };

    const plan = createActionPlan(intent);

    expect(plan.kind).toBe("SCHEDULE");
    expect(plan.status).toBe("READY");
    expect(plan.steps).toHaveLength(1);
  });

  it("creates one step per split recipient", () => {
    const intent: MoneyIntent = {
      id: "split-1",
      action: "SPLIT",
      splits: [
        { recipientId: "mum", amount: { amount: "500", currency: "USD" } },
        { recipientId: "dad", amount: { amount: "300", currency: "USD" } },
        { recipientId: "sister", amount: { amount: "200", currency: "USD" } },
      ],
    };

    const plan = createActionPlan(intent);

    expect(plan.kind).toBe("SPLIT");
    expect(plan.status).toBe("READY");
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps.map((step) => step.amount?.amount)).toEqual(["500", "300", "200"]);
  });
});
