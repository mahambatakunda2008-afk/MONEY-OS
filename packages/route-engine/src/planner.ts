import type { MoneyAction, MoneyIntent, MoneyPlan, MoneyPlanKind, Route } from "../../money-core/src/index";
import { recommend, type RoutePriority } from "./index";

export function createMoneyPlan(
  intent: MoneyIntent,
  routes: Route[],
  priority: RoutePriority = "BALANCED",
): MoneyPlan {
  if (routes.length === 0) throw new Error("Cannot create a route plan without routes");
  const recommendedRoute = recommend(routes, priority, intent.preferences);

  return {
    id: `plan_${intent.id}`,
    intentId: intent.id,
    kind: "ROUTE",
    status: "READY",
    recommendedRoute,
    alternatives: routes.filter((route) => route.id !== recommendedRoute.id),
    quote: recommendedRoute.quote,
    steps: [
      {
        id: `step_${intent.id}_route`,
        action: intent.action,
        description: `Use ${recommendedRoute.name} to complete the requested money movement.`,
        amount: recommendedRoute.quote.source,
        state: "PENDING",
      },
    ],
    explanation: buildExplanation(recommendedRoute, priority),
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

function stepsForAction(intent: MoneyIntent): MoneyPlan["steps"] {
  if (intent.action === "HOLD") {
    return [
      {
        id: `step_${intent.id}_hold`,
        action: "HOLD",
        description: `Reserve funds for ${intent.hold?.purpose ?? "the requested purpose"}.`,
        amount: intent.amount,
        state: "RESERVED",
      },
    ];
  }

  if (intent.action === "SCHEDULE") {
    return [
      {
        id: `step_${intent.id}_schedule`,
        action: "SCHEDULE",
        description: `Schedule the transfer ${intent.schedule?.frequency.toLowerCase() ?? "recurringly"}.`,
        amount: intent.amount,
        state: "PENDING",
      },
    ];
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

  return [
    {
      id: `step_${intent.id}_action`,
      action: intent.action,
      description: `Prepare the requested ${intent.action.toLowerCase()} operation.`,
      amount: intent.amount ?? intent.targetAmount,
      state: "PENDING",
    },
  ];
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
