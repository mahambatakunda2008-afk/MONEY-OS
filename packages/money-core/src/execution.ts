import type { MoneyAmount } from "./index";
import { commitHold, hold, releaseHold, type BalanceBook } from "./balances";
import { ProviderRegistry, validateProviderResult, type PaymentOperation, type ProviderResult } from "./providers";
import type { PaymentRail } from "./rails";

export type ExecutionStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export interface ExecutionRequest { operation: PaymentOperation; amount: MoneyAmount; rail: PaymentRail; reference: string; idempotencyKey: string; }
export interface ExecutionRecord extends ExecutionRequest { status: ExecutionStatus; providerReference?: string; message?: string; }

export class ExecutionEngine {
  private readonly records = new Map<string, ExecutionRecord>();
  constructor(private readonly providers: ProviderRegistry) {}
  get(idempotencyKey: string): ExecutionRecord | undefined { return this.records.get(idempotencyKey); }
  async execute(request: ExecutionRequest): Promise<ExecutionRecord> {
    const existing = this.records.get(request.idempotencyKey);
    if (existing) return existing;
    const pending: ExecutionRecord = { ...request, status: "PENDING" };
    this.records.set(request.idempotencyKey, pending);
    try {
      const result: ProviderResult = validateProviderResult(await this.providers.get(request.rail.provider).execute(request));
      const record: ExecutionRecord = { ...pending, status: result.status, providerReference: result.providerReference, message: result.message };
      this.records.set(request.idempotencyKey, record);
      return record;
    } catch (error) {
      const record: ExecutionRecord = { ...pending, status: "PENDING", message: error instanceof Error ? error.message : "Provider execution failed" };
      this.records.set(request.idempotencyKey, record);
      return record;
    }
  }
}

export function reserveForExecution(book: BalanceBook, amount: MoneyAmount): BalanceBook { return hold(book, amount); }
export function applyExecutionOutcome(book: BalanceBook, amount: MoneyAmount, outcome: ExecutionStatus): BalanceBook {
  if (outcome === "ACCEPTED") return commitHold(book, amount);
  if (outcome === "REJECTED") return releaseHold(book, amount);
  return book;
}
