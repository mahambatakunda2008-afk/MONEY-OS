import type { MoneyAction, MoneyIntent, MoneyPlan, MoneyPlanKind, MoneyPlanStep, Route } from "../../money-core/src/index";
import { recommend, type RoutePriority } from "./index";
import { assessRouteRisk, isRouteExecutable, type RouteRisk } from "./route-risk";

export interface PlannedRouteRisk {
  routeId: string;
  risk: RouteRisk;
}

export function createMoneyPlan(
  intent: MoneyIntent,
  routes: Route[],
  priority: RoutePriority = "BALANCED",
): MoneyPlan {
  if (routes.length === 0) throw new Error("Cannot create a route plan without routes");

  const assessed = routes.map((route) => ({ route, risk: assessRouteRisk(route) }));
  const executable = assessed.filter(({ risk }) => isRouteExecutable(risk)).map(({ route }) => route);

  if (executable.length === 0) {
    return {
      id: `plan_${intent.id}`,
      intentId: intent.id,
      kind: "ROUTE",
      status: "REQUIRES_ACTION",
      alternatives: [],
      steps: [],
      explanation: "No route can currently be executed safely. Every available quote is blocked by the route risk screen.",
      createdAt: new Date().toISOString(),
    };
  }

  const recommendedRoute = recommend(executable, priority, intent.preferences);
  const recommendedAssessment = assessed.find(({ route }) => route.id === recommendedRoute.id);
  if (!recommendedAssessment) throw new Error("Recommended route risk assessment is missing");

  const blocked = assessed.filter(({ risk }) => !isRouteExecutable(risk));
  const blockedText = blocked.length > 0
    ? ` ${blocked.length} route${blocked.length === 1 ? " is" : "s are"} excluded by the risk screen.`
    : "";

  return {
    id: `plan_${intent.id}`,
    intentId: intent.id,
    kind: "ROUTE",
    status: "READY",
    recommendedRoute,
    alternatives: executable.filter((route) => route.id !== recommendedRoute.id),
    quote: recommendedRoute.quote,
    steps: [
      {
        id: `step_${intent.id}_route`,
        action: intent.action,
        description: `Use ${recommendedRoute.name} to complete the requested money movement. Risk: ${recommendedAssessment.risk.level}.`,
        amount: recommendedRoute.quote.source,
        state: "PENDING",
      },
    ],
    explanation: `${buildExplanation(recommendedRoute, priority)}${blockedText}`,
    createdAt: new Date().toISOString(),
  };
}

export function createActionPlan(intent: MoneyIntent): MoneyPlan {
  const kind = kindForAction(intent.action);
  const steps = stepsForAction(intent);

  return {
    id: `plan_${intent.id}`,
    intentId: intent.id,
    kind,
    status: validateActionPlan(intent) ? "READY" : "REQUIRES_ACTION",
    alternatives: [],
    steps,
    explanation: explainActionPlan(intent),
    createdAt: new Date().toISOString(),
  };
}

function kindForAction(action: MoneyAction): MoneyPlanKind {
  if (action === "HOLD") return "HOLD";
  if (action === "SCHEDULE") return "SCHEDULE";
  if (action === "SPLIT") return "SPLIT";
  return "ROUTE";
}

function validateActionPlan(intent: MoneyIntent): boolean {
  if (intent.action === "HOLD") return Boolean(intent.amount && intent.hold?.purpose);
  if (intent.action === "SCHEDULE") return Boolean(intent.amount && intent.destination && intent.schedule);
  if (intent.action === "SPLIT") return Boolean(intent.splits?.length && intent.splits.every((split) => split.amount.amount !== "0"));
  return Boolean(intent.amount || intent.targetAmount);
}

function withOptionalAmount(step: Omit<MoneyPlanStep, "amount">, amount?: MoneyPlanStep["amount"]): MoneyPlanStep {
  return amount === undefined ? step : { ...step, amount };
}

function stepsForAction(intent: MoneyIntent): MoneyPlan["steps"] {
  if (intent.action === "HOLD") {
    return [withOptionalAmount({
      id: `step_${intent.id}_hold`,
      action: "HOLD",
      description: `Reserve funds for ${intent.hold?.purpose ?? "the requested purpose"}.`,
      state: "RESERVED",
    }, intent.amount)];
  }

  if (intent.action === "SCHEDULE") {
    return [withOptionalAmount({
      id: `step_${intent.id}_schedule`,
      action: "SCHEDULE",
      description: `Schedule the transfer ${intent.schedule?.frequency.toLowerCase() ?? "recurringly"}.`,
      state: "PENDING",
    }, intent.amount)];
  }

  if (intent.action === "SPLIT") {
    return (intent.splits ?? []).map((split, index) => ({
      id: `step_${intent.id}_split_${index + 1}`,
      action: "SPLIT" as const,
      description: `Allocate funds to ${split.recipientId}.`,
      amount: split.amount,
      state: "PENDING" as const,
    }));
  }

  return [withOptionalAmount({
    id: `step_${intent.id}_action`,
    action: intent.action,
    description: `Prepare the requested ${intent.action.toLowerCase()} operation.`,
    state: "PENDING",
  }, intent.amount ?? intent.targetAmount)];
}

function explainActionPlan(intent: MoneyIntent): string {
  if (intent.action === "HOLD") return `Funds will be reserved for ${intent.hold?.purpose ?? "your requested purpose"} and remain unavailable for ordinary spending.`;
  if (intent.action === "SCHEDULE") return `The transfer is prepared as a recurring ${intent.schedule?.frequency.toLowerCase() ?? "scheduled"} operation.`;
  if (intent.action === "SPLIT") return `The request is divided into ${(intent.splits ?? []).length} recipient allocations that can be reviewed before execution.`;
  return `The ${intent.action.toLowerCase()} request has been converted into an actionable Money OS plan.`;
}

function buildExplanation(route: Route, priority: RoutePriority): string {
  const priorityText = priority === "BALANCED" ? "cost, speed, and reliability" : priority.toLowerCase().replace("_", " ");
  return `${route.name} is recommended based on your ${priorityText} priority. It is estimated to arrive in ${route.estimatedArrivalMinutes} minutes with a reliability score of ${route.reliabilityScore}%.`;
}
