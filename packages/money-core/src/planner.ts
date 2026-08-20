import type { MoneyIntent, MoneyPlan, Route } from "./index";
import { recommend, type RoutePriority } from "../../route-engine/src/index";

export function createMoneyPlan(
  intent: MoneyIntent,
  routes: Route[],
  priority: RoutePriority = "BALANCED",
): MoneyPlan {
  if (routes.length === 0) throw new Error("Cannot create a plan without routes");
  const recommendedRoute = recommend(routes, priority, intent.preferences);
  return {
    id: `plan_${intent.id}`,
    intentId: intent.id,
    status: "READY",
    recommendedRoute,
    alternatives: routes.filter((route) => route.id !== recommendedRoute.id),
    quote: recommendedRoute.quote,
    explanation: buildExplanation(recommendedRoute, priority),
    createdAt: new Date().toISOString(),
  };
}

function buildExplanation(route: Route, priority: RoutePriority): string {
  const priorityText = priority === "BALANCED" ? "cost, speed, and reliability" : priority.toLowerCase().replace("_", " ");
  return `${route.name} is recommended based on your ${priorityText} priority. It is estimated to arrive in ${route.estimatedArrivalMinutes} minutes with a reliability score of ${route.reliabilityScore}%.`;
}
