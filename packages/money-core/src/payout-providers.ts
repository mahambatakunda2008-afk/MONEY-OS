import type { MoneyAmount, MoneyLocation } from "./index";

export type PayoutStatus = "ACCEPTED" | "PENDING" | "REJECTED";

export interface PayoutInstruction {
  amount: MoneyAmount;
  destination: MoneyLocation;
  reference: string;
  idempotencyKey: string;
  metadata?: Readonly<Record<string, string>>;
}

export interface PayoutResult {
  status: PayoutStatus;
  providerReference?: string;
  message?: string;
}

/**
 * Server-side contract for external disbursement rails.
 * Implementations must live outside the browser and must never expose provider
 * credentials to the client. The adapter is deliberately provider-agnostic so
 * Paynow Disbursement, Linkwa, Payonify or a bank-specific rail can be plugged
 * in without changing the customer-facing Send flow.
 */
export interface ExternalPayoutProvider {
  readonly id: string;
  readonly countries: readonly string[];
  readonly currencies: readonly string[];
  readonly destinationTypes: readonly MoneyLocation["type"][];
  payout(instruction: PayoutInstruction): Promise<PayoutResult>;
  verifyWebhook(input: { eventId: string; signature: string; payload: string }): boolean;
}

export class PayoutProviderRegistry {
  private readonly providers = new Map<string, ExternalPayoutProvider>();

  register(provider: ExternalPayoutProvider): void {
    if (this.providers.has(provider.id)) throw new Error(`Payout provider already registered: ${provider.id}`);
    this.providers.set(provider.id, provider);
  }

  get(providerId: string): ExternalPayoutProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Payout provider not registered: ${providerId}`);
    return provider;
  }

  list(): readonly ExternalPayoutProvider[] {
    return [...this.providers.values()];
  }
}

export function assertPayoutResult(result: PayoutResult): void {
  if (result.status === "ACCEPTED" && !result.providerReference) {
    throw new Error("Accepted payout requires a provider reference");
  }
}

export function isPayoutProviderEligible(provider: ExternalPayoutProvider, instruction: PayoutInstruction): boolean {
  const currency = instruction.amount.currency.toUpperCase();
  const country = instruction.destination.country?.toUpperCase();
  const destinationType = instruction.destination.type;
  return Boolean(country)
    && provider.countries.some((value) => value.toUpperCase() === country)
    && provider.currencies.some((value) => value.toUpperCase() === currency)
    && provider.destinationTypes.includes(destinationType);
}
