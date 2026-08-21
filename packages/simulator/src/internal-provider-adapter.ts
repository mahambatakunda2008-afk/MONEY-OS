import type { NormalizedProviderEvent, ProviderExecutionContext, SettlementProviderAdapter } from "../../money-core/src/provider-contract";
import type { PaymentRail } from "../../money-core/src/rails";
import { executeInternalSettlement } from "./internal-provider";

export class InternalProviderAdapter implements SettlementProviderAdapter {
  readonly id = "INTERNAL";
  readonly railType = "INTERNAL" as const;

  async execute(context: ProviderExecutionContext): Promise<NormalizedProviderEvent> {
    const rail = context.instruction.rail;
    const result = executeInternalSettlement(context.settlementId, {
      id: rail.id,
      providerId: this.id,
      name: rail.provider,
      cost: { amount: "0", currency: context.instruction.amount.currency },
      estimatedArrivalMinutes: 0,
      reliabilityScore: 1,
      quote: {
        id: `internal-${context.settlementId}`,
        source: context.instruction.amount,
        destination: context.instruction.amount,
        exchangeRate: "1",
        fees: {
          provider: { amount: "0", currency: context.instruction.amount.currency },
          network: { amount: "0", currency: context.instruction.amount.currency },
          platform: { amount: "0", currency: context.instruction.amount.currency },
          total: { amount: "0", currency: context.instruction.amount.currency },
        },
        effectiveRate: "1",
        expiresAt: "2099-01-01T00:00:00.000Z",
        providerId: this.id,
        routeId: rail.id,
      },
    }, context.instruction.amount);

    const event = result.events.at(-1);
    if (!event) throw new Error("Internal provider returned no terminal event");

    return {
      providerId: this.id,
      eventId: event.eventId,
      eventType: event.eventType,
      ...(result.providerReference === undefined ? {} : { providerReference: result.providerReference }),
      status: event.eventType === "settled" ? "SUCCEEDED" : event.eventType === "failed" ? "FAILED" : "PROCESSING",
      payload: event.payload,
    };
  }

  verifyWebhook(input: { eventId: string; signature: string; payload: string }): boolean {
    return input.eventId.length > 0 && input.signature === `internal:${input.eventId}` && input.payload.length > 0;
  }

  normalizeWebhook(input: { eventId: string; eventType: string; payload: Readonly<Record<string, unknown>>; providerReference?: string }): NormalizedProviderEvent {
    const status = input.eventType === "settled" ? "SUCCEEDED" : input.eventType === "failed" ? "FAILED" : input.eventType === "processing" ? "PROCESSING" : "UNKNOWN";
    return {
      providerId: this.id,
      eventId: input.eventId,
      eventType: input.eventType,
      ...(input.providerReference === undefined ? {} : { providerReference: input.providerReference }),
      status,
      payload: input.payload,
    };
  }
}

export function internalRail(): PaymentRail {
  return { id: "internal", type: "INTERNAL", provider: "Shadecode Internal", countries: ["ZW"], currencies: ["USD", "ZAR", "ZWL", "GBP", "EUR"], status: "ACTIVE", capabilities: ["SEND", "RECEIVE", "PAY", "REFUND"] };
}
