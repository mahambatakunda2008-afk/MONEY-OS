import type { MoneyAmount, MoneyState, Route } from "../../money-core/src/index";

export interface SimulatedProvider {
  id: string;
  name: string;
  active: boolean;
  failureRate: number;
}

export interface ExecutionEvent {
  type: string;
  state: MoneyState;
  at: string;
  message: string;
}

export interface SimulatedExecution {
  id: string;
  route: Route;
  amount: MoneyAmount;
  state: MoneyState;
  events: ExecutionEvent[];
}

export function simulateExecution(
  id: string,
  route: Route,
  amount: MoneyAmount,
  options: { failAt?: "PROVIDER" | "SETTLEMENT" } = {},
): SimulatedExecution {
  const now = Date.now();
  const event = (offset: number, type: string, state: MoneyState, message: string): ExecutionEvent => ({
    type,
    state,
    at: new Date(now + offset * 1000).toISOString(),
    message,
  });

  const events: ExecutionEvent[] = [
    event(0, "execution.started", "PENDING", "Execution accepted by the simulator."),
  ];

  if (options.failAt === "PROVIDER") {
    events.push(event(1, "provider.failed", "FAILED", "Simulated provider failure."));
    return { id, route, amount, state: "FAILED", events };
  }

  events.push(event(1, "provider.accepted", "PROCESSING", "Simulated provider accepted the operation."));

  if (options.failAt === "SETTLEMENT") {
    events.push(event(2, "settlement.failed", "FAILED", "Simulated settlement failure."));
    return { id, route, amount, state: "FAILED", events };
  }

  events.push(event(2, "settlement.completed", "COMMITTED", "Simulated settlement completed."));
  events.push(event(3, "transaction.completed", "SETTLED", "Simulated transaction completed."));
  return { id, route, amount, state: "SETTLED", events };
}
