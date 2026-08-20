import type { MoneyAmount, Route } from "../../money-core/src/index";
import { simulateExecution, type SimulatedExecution } from "./index";

export type InternalProviderEventType = "settled" | "failed" | "processing";

export interface ProviderEvent {
  providerId: "INTERNAL";
  eventId: string;
  eventType: InternalProviderEventType;
  providerReference: string;
  payload: Record<string, unknown>;
}

export interface InternalSettlementResult {
  execution: SimulatedExecution;
  providerReference: string;
  events: ProviderEvent[];
}

export function executeInternalSettlement(
  settlementId: string,
  route: Route,
  amount: MoneyAmount,
  options: { failAt?: "PROVIDER" | "SETTLEMENT" } = {},
): InternalSettlementResult {
  const execution = simulateExecution(settlementId, route, amount, options);
  const providerReference = `internal_${settlementId}`;
  const terminal = execution.state === "SETTLED" ? "settled" : "failed";
  const events: ProviderEvent[] = execution.events.map((event, index) => ({
    providerId: "INTERNAL",
    eventId: `${providerReference}_${index + 1}`,
    eventType: event.state === "PROCESSING" ? "processing" : index === execution.events.length - 1 ? terminal : "processing",
    providerReference,
    payload: { type: event.type, state: event.state, at: event.at, message: event.message },
  }));
  return { execution, providerReference, events };
}
