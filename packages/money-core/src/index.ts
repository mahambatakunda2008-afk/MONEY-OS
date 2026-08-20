export * from "./balances";
export * from "./currencies";
export * from "./ledger";

export type MoneyAction =
  | "HOLD"
  | "MOVE"
  | "CONVERT"
  | "SEND"
  | "RECEIVE"
  | "PAY"
  | "SCHEDULE"
  | "SPLIT";

export type MoneyState =
  | "AVAILABLE"
  | "RESERVED"
  | "PENDING"
  | "PROCESSING"
  | "COMMITTED"
  | "SETTLED"
  | "FAILED"
  | "REFUNDED";

export type PlanStatus =
  | "DRAFT"
  | "READY"
  | "REQUIRES_ACTION"
  | "APPROVED"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED";

export type ScheduleFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM";
export type MoneyPlanKind = "ROUTE" | "HOLD" | "SCHEDULE" | "SPLIT" | "GOAL";

export interface MoneyAmount {
  amount: string;
  currency: string;
}

export interface MoneyLocation {
  type:
    | "BANK_ACCOUNT"
    | "WALLET"
    | "CARD"
    | "CASH"
    | "MERCHANT"
    | "PERSON"
    | "PROVIDER";
  id?: string;
  country?: string;
  currency?: string;
}

export interface MoneyPreferences {
  cost?: number;
  speed?: number;
  reliability?: number;
  convenience?: number;
}

export interface MoneyConstraints {
  maxFee?: MoneyAmount;
  maxDelayMinutes?: number;
  allowedProviders?: string[];
}

export interface HoldInstruction {
  purpose: string;
  releaseAt?: string;
}

export interface ScheduleInstruction {
  frequency: ScheduleFrequency;
  nextRunAt: string;
  timezone?: string;
  endAt?: string;
}

export interface SplitInstruction {
  recipientId: string;
  amount: MoneyAmount;
}

export interface MoneyIntent {
  id: string;
  action: MoneyAction;
  source?: MoneyLocation;
  destination?: MoneyLocation;
  amount?: MoneyAmount;
  targetAmount?: MoneyAmount;
  purpose?: string;
  deadline?: string;
  preferences?: MoneyPreferences;
  constraints?: MoneyConstraints;
  hold?: HoldInstruction;
  schedule?: ScheduleInstruction;
  splits?: SplitInstruction[];
}

export interface FeeBreakdown {
  provider: MoneyAmount;
  network: MoneyAmount;
  platform: MoneyAmount;
  total: MoneyAmount;
}

export interface MoneyQuote {
  id: string;
  source: MoneyAmount;
  destination: MoneyAmount;
  exchangeRate: string;
  fees: FeeBreakdown;
  effectiveRate: string;
  estimatedArrivalMinutes?: number;
  expiresAt: string;
  providerId: string;
  routeId: string;
}

export interface Route {
  id: string;
  providerId: string;
  name: string;
  cost: MoneyAmount;
  estimatedArrivalMinutes: number;
  reliabilityScore: number;
  quote: MoneyQuote;
}

export interface MoneyPlanStep {
  id: string;
  action: MoneyAction;
  description: string;
  amount?: MoneyAmount;
  state?: MoneyState;
}

export interface MoneyPlan {
  id: string;
  intentId: string;
  kind: MoneyPlanKind;
  status: PlanStatus;
  recommendedRoute?: Route;
  alternatives: Route[];
  quote?: MoneyQuote;
  steps: MoneyPlanStep[];
  explanation: string;
  createdAt: string;
}

export const TERMINAL_STATES = new Set<MoneyState>(["SETTLED", "FAILED", "REFUNDED"]);

export function canTransition(from: MoneyState, to: MoneyState): boolean {
  const transitions: Record<MoneyState, MoneyState[]> = {
    AVAILABLE: ["RESERVED", "PENDING", "FAILED"],
    RESERVED: ["AVAILABLE", "PENDING", "FAILED"],
    PENDING: ["PROCESSING", "FAILED", "REFUNDED"],
    PROCESSING: ["COMMITTED", "FAILED", "REFUNDED"],
    COMMITTED: ["SETTLED", "FAILED", "REFUNDED"],
    SETTLED: [],
    FAILED: ["PENDING", "REFUNDED"],
    REFUNDED: [],
  };

  return transitions[from].includes(to);
}

export function assertTransition(from: MoneyState, to: MoneyState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid money state transition: ${from} → ${to}`);
  }
}
