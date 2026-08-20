import type { MoneyAmount } from "./index";
import type { PaymentRail, PaymentRailType } from "./rails";

export type ProviderEventStatus = "PROCESSING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";

export interface ProviderExecutionContext {
  settlementId: string;
  instruction: { amount: MoneyAmount; rail: PaymentRail; reference: string; idempotencyKey: string };
}

export interface NormalizedProviderEvent {
  providerId: string;
  eventId: string;
  eventType: string;
  providerReference?: string;
  status: ProviderEventStatus;
  payload: Readonly<Record<string, unknown>>;
}

export interface SettlementProviderAdapter {
  readonly id: string;
  readonly railType: PaymentRailType;
  execute(context: ProviderExecutionContext): Promise<NormalizedProviderEvent>;
  verifyWebhook(input: { eventId: string; signature: string; payload: string }): boolean;
  normalizeWebhook(input: { eventId: string; eventType: string; payload: Readonly<Record<string, unknown>>; providerReference?: string }): NormalizedProviderEvent;
}

export function assertProviderEvent(event: NormalizedProviderEvent): void {
  if (!event.providerId || !event.eventId || !event.eventType) throw new Error("Provider event identity is required");
  if (event.status === "SUCCEEDED" && !event.providerReference) throw new Error("Successful provider event requires a provider reference");
}
