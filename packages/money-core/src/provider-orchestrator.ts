import type { MoneyAmount } from "./index";
import { assertProviderEvent, type NormalizedProviderEvent, type SettlementProviderAdapter } from "./provider-contract";
import { ProviderRegistry, validateProviderResult, type PaymentInstruction, type ProviderResult } from "./providers";
import { selectRail, type PaymentRail, type RailRouteRequest } from "./rails";

export interface ProviderCatalog {
  rails: readonly PaymentRail[];
}

export interface OrchestrationRequest extends RailRouteRequest {
  operation: PaymentInstruction["operation"];
  reference: string;
  idempotencyKey: string;
  metadata?: Readonly<Record<string, string>>;
}

export interface OrchestrationResult {
  rail: PaymentRail;
  provider: string;
  result: ProviderResult;
}

/**
 * Production boundary between Money's deterministic domain and real payment providers.
 * Provider adapters are injected by the server runtime. This package never contains
 * provider credentials and never performs client-side settlement.
 */
export class PaymentOrchestrator {
  constructor(private readonly providers: ProviderRegistry, private readonly catalog: ProviderCatalog) {}

  select(request: RailRouteRequest): PaymentRail {
    return selectRail(this.catalog.rails, request);
  }

  async execute(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const rail = this.select(request);
    const instruction: PaymentInstruction = {
      operation: request.operation,
      amount: request.amount,
      rail,
      reference: request.reference,
      idempotencyKey: request.idempotencyKey,
      ...(request.metadata === undefined ? {} : { metadata: request.metadata }),
    };
    const result = validateProviderResult(await this.providers.get(rail.provider).execute(instruction));
    return { rail, provider: rail.provider, result };
  }
}

export class SettlementAdapterRegistry {
  private readonly adapters = new Map<string, SettlementProviderAdapter>();

  register(adapter: SettlementProviderAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error(`Settlement adapter already registered: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  get(providerId: string): SettlementProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) throw new Error(`Settlement adapter not registered: ${providerId}`);
    return adapter;
  }

  ingestWebhook(input: { providerId: string; eventId: string; eventType: string; signature: string; rawPayload: string; payload: Readonly<Record<string, unknown>>; providerReference?: string }): NormalizedProviderEvent {
    const adapter = this.get(input.providerId);
    if (!adapter.verifyWebhook({ eventId: input.eventId, signature: input.signature, payload: input.rawPayload })) throw new Error("Invalid provider webhook signature");
    const event = adapter.normalizeWebhook({ eventId: input.eventId, eventType: input.eventType, payload: input.payload, providerReference: input.providerReference });
    assertProviderEvent(event);
    return event;
  }
}

export function assertLiveSettlementConfiguration(input: { providerId: string; rail: PaymentRail; amount: MoneyAmount }): void {
  if (input.providerId !== input.rail.provider) throw new Error("Provider does not match selected rail");
  if (input.amount.currency.toUpperCase() !== input.rail.currencies.find((currency) => currency.toUpperCase() === input.amount.currency.toUpperCase())) throw new Error("Currency is not supported by selected rail");
  if (input.rail.status === "UNAVAILABLE") throw new Error("Selected payment rail is unavailable");
}
