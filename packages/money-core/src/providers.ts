import type { MoneyAmount } from "./index";
import type { PaymentRail, PaymentRailType } from "./rails";

export type PaymentOperation = "SEND" | "RECEIVE" | "PAY" | "REFUND";
export type ProviderResultStatus = "ACCEPTED" | "PENDING" | "REJECTED";

export interface PaymentInstruction { operation: PaymentOperation; amount: MoneyAmount; rail: PaymentRail; reference: string; idempotencyKey: string; metadata?: Readonly<Record<string, string>>; }
export interface ProviderResult { status: ProviderResultStatus; providerReference?: string; message?: string; }
export interface PaymentRailProvider { readonly id: string; readonly railType: PaymentRailType; execute(instruction: PaymentInstruction): Promise<ProviderResult>; }

export class ProviderRegistry {
  private readonly providers = new Map<string, PaymentRailProvider>();
  register(provider: PaymentRailProvider): void { if (this.providers.has(provider.id)) throw new Error(`Provider already registered: ${provider.id}`); this.providers.set(provider.id, provider); }
  get(providerId: string): PaymentRailProvider { const provider = this.providers.get(providerId); if (!provider) throw new Error(`Payment provider not registered: ${providerId}`); return provider; }
}

export function validateProviderResult(result: ProviderResult): ProviderResult {
  if (result.status === "ACCEPTED" && !result.providerReference) throw new Error("Accepted provider result requires a provider reference");
  return result;
}
