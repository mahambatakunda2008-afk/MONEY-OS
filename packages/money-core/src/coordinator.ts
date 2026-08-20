import type { MoneyAmount } from "./index";
import { applyExecutionOutcome, ExecutionEngine, reserveForExecution, type ExecutionRecord } from "./execution";
import type { BalanceBook } from "./balances";
import { createTransaction, transitionTransaction, type TransactionRecord } from "./transaction";
import type { PaymentRail } from "./rails";

export interface PaymentCoordinatorRequest { transactionId: string; operation: "SEND" | "RECEIVE" | "PAY" | "REFUND" | "EXCHANGE"; accountId: string; amount: MoneyAmount; rail: PaymentRail; reference: string; idempotencyKey: string; }
export interface PaymentCoordinatorResult { transaction: TransactionRecord; execution: ExecutionRecord; balances: BalanceBook; }

/** Coordinates domain state. Persistence/DB transactions should wrap this flow before production use. */
export async function coordinatePayment(request: PaymentCoordinatorRequest, balanceBook: BalanceBook, executionEngine: ExecutionEngine, now = new Date()): Promise<PaymentCoordinatorResult> {
  const transaction = createTransaction({ id: request.transactionId, idempotencyKey: request.idempotencyKey, operation: request.operation, status: "PENDING", entries: [
    { accountId: request.accountId, type: "DEBIT", amount: request.amount },
    { accountId: "pending-settlement", type: "CREDIT", amount: request.amount },
  ] }, now);
  let balances = reserveForExecution(balanceBook, request.amount);
  const authorized = transitionTransaction(transaction, "AUTHORIZED", now);
  const execution = await executionEngine.execute(request);
  if (execution.status === "ACCEPTED") {
    const committed = transitionTransaction(authorized, "COMMITTED", now);
    balances = applyExecutionOutcome(balances, request.amount, "ACCEPTED");
    return { transaction: committed, execution, balances };
  }
  if (execution.status === "REJECTED") {
    const released = transitionTransaction(authorized, "RELEASED", now);
    balances = applyExecutionOutcome(balances, request.amount, "REJECTED");
    return { transaction: released, execution, balances };
  }
  return { transaction: authorized, execution, balances };
}
