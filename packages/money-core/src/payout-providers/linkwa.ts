import type { ExternalPayoutProvider, PayoutInstruction, PayoutResult } from "../payout-providers";

/**
 * Linkwa payout adapter boundary.
 * Transport, credentials and API base URL remain server-only.
 */
export interface LinkwaPayoutTransport {
  createPayout(input: {
    amount: string;
    currency: string;
    mobileNumber: string;
    reference: string;
    idempotencyKey: string;
    metadata?: Readonly<Record<string, string>>;
  }): Promise<PayoutResult>;
  verifyWebhookSignature(input: { eventId: string; signature: string; payload: string }): boolean;
}

export interface LinkwaPayoutConfig {
  transport: LinkwaPayoutTransport;
  countries?: readonly string[];
  currencies?: readonly string[];
}

export function createLinkwaPayoutProvider(config: LinkwaPayoutConfig): ExternalPayoutProvider {
  return {
    id: "linkwa",
    countries: config.countries ?? ["ZW"],
    currencies: config.currencies ?? ["USD", "ZWG", "ZWL"],
    destinationTypes: ["PERSON", "WALLET"],
    async payout(instruction: PayoutInstruction): Promise<PayoutResult> {
      if (!instruction.destination.id) throw new Error("Linkwa payout requires a mobile-wallet destination");
      return config.transport.createPayout({
        amount: instruction.amount.amount,
        currency: instruction.amount.currency.toUpperCase(),
        mobileNumber: instruction.destination.id,
        reference: instruction.reference,
        idempotencyKey: instruction.idempotencyKey,
        metadata: instruction.metadata,
      });
    },
    verifyWebhook(input) {
      return config.transport.verifyWebhookSignature(input);
    },
  };
}
