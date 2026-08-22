import type { MoneyAmount, MoneyLocation } from "./index";
import {
  assertPayoutResult,
  isPayoutProviderEligible,
  type ExternalPayoutProvider,
  type PayoutInstruction,
  type PayoutResult,
} from "./payout-providers";

export interface PayoutRoutePreference {
  allowedProviders?: readonly string[];
  maxFee?: MoneyAmount;
}

export interface RoutedPayout {
  provider: ExternalPayoutProvider;
  instruction: PayoutInstruction;
}

/**
 * Chooses an eligible external rail without embedding provider-specific logic
 * in the customer-facing Send flow. Provider ordering is explicit and stable.
 */
export function routePayout(
  providers: readonly ExternalPayoutProvider[],
  instruction: PayoutInstruction,
  preference: PayoutRoutePreference = {},
): RoutedPayout {
  const allowed = preference.allowedProviders ? new Set(preference.allowedProviders) : undefined;
  const candidates = providers.filter((provider) =>
    (!allowed || allowed.has(provider.id)) && isPayoutProviderEligible(provider, instruction),
  );
  const provider = candidates[0];
  if (!provider) throw new Error("No eligible payout provider is available for this destination");
  return { provider, instruction };
}

export async function executeRoutedPayout(route: RoutedPayout): Promise<PayoutResult> {
  const result = await route.provider.payout(route.instruction);
  assertPayoutResult(result);
  return result;
}

export function makePayoutInstruction(input: {
  amount: MoneyAmount;
  destination: MoneyLocation;
  reference: string;
  idempotencyKey: string;
  metadata?: Readonly<Record<string, string>>;
}): PayoutInstruction {
  if (!input.reference.trim()) throw new Error("Payout reference is required");
  if (!input.idempotencyKey.trim()) throw new Error("Payout idempotency key is required");
  if (!input.destination.country) throw new Error("Payout destination country is required");
  if (!input.amount.currency) throw new Error("Payout currency is required");
  return { ...input, reference: input.reference.trim(), idempotencyKey: input.idempotencyKey.trim() };
}
