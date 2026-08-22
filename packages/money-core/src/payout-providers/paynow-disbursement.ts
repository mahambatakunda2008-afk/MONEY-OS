import type { ExternalPayoutProvider, PayoutInstruction, PayoutResult } from "../payout-providers";

/**
 * Paynow Disbursement adapter boundary.
 * Credentials and HTTP transport belong in the server application layer.
 * This package deliberately contains no secrets and performs no network I/O.
 */
export interface PaynowDisbursementTransport {
  createDisbursement(input: {
    amount: string;
    currency: string;
    destination: string;
    reference: string;
    idempotencyKey: string;
    metadata?: Readonly<Record<string, string>>;
  }): Promise<{ status: "ACCEPTED" | "PENDING" | "REJECTED"; providerReference?: string; message?: string }>;
  verifyWebhookSignature(input: { eventId: string; signature: string; payload: string }): boolean;
}

export interface PaynowDisbursementConfig {
  transport: PaynowDisbursementTransport;
  countries?: readonly string[];
  currencies?: readonly string[];
}

export function createPaynowDisbursementProvider(config: PaynowDisbursementConfig): ExternalPayoutProvider {
  return {
    id: "paynow-disbursement",
    countries: config.countries ?? ["ZW"],
    currencies: config.currencies ?? ["USD", "ZWL"],
    destinationTypes: ["PERSON", "WALLET", "BANK_ACCOUNT"],
    async payout(instruction: PayoutInstruction): Promise<PayoutResult> {
      const result = await config.transport.createDisbursement({
        amount: instruction.amount.amount,
        currency: instruction.amount.currency.toUpperCase(),
        destination: instruction.destination.id ?? "",
        reference: instruction.reference,
        idempotencyKey: instruction.idempotencyKey,
        metadata: instruction.metadata,
      });
      return result;
    },
    verifyWebhook(input) {
      return config.transport.verifyWebhookSignature(input);
    },
  };
}
