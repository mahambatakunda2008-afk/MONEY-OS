import type { MoneyAmount, MoneyPreferences, Route } from "../../money-core/src/index";
import { rankRoutes, recommend, type RoutePriority } from "./index";

export interface RouteComparison {
  route: Route;
  sourceCost: MoneyAmount;
  targetAmount: MoneyAmount;
  etaMinutes: number;
  reliabilityScore: number;
  score: number;
  savingsVsMostExpensive?: MoneyAmount;
  fasterThanSlowestMinutes: number;
}

export interface RouteCompetition {
  recommended: RouteComparison;
  alternatives: RouteComparison[];
  reason: string;
}

/** Compare viable routes for one money objective, then explain the recommendation. */
export function compareRoutes(
  routes: Route[],
  priority: RoutePriority = "BALANCED",
  preferences?: MoneyPreferences,
): RouteCompetition {
  if (routes.length === 0) throw new Error("Cannot compare an empty route set");

  const ranked = rankRoutes(routes, preferences);
  const recommendedRoute = recommend(routes, priority, preferences);
  const mostExpensive = routes.reduce((max, route) =>
    Number(route.quote.source.amount) > Number(max.quote.source.amount) ? route : max,
  );
  const slowestMinutes = Math.max(...routes.map((route) => route.estimatedArrivalMinutes));

  const comparisons = ranked.map((route) => {
    const sourceCost = route.quote.source;
    const expensive = subtractPositive(mostExpensive.quote.source, sourceCost);
    return {
      route,
      sourceCost,
      targetAmount: route.quote.destination,
      etaMinutes: route.estimatedArrivalMinutes,
      reliabilityScore: route.reliabilityScore,
      score: scoreFor(route, routes, preferences),
      ...(expensive !== undefined ? { savingsVsMostExpensive: expensive } : {}),
      fasterThanSlowestMinutes: slowestMinutes - route.estimatedArrivalMinutes,
    } satisfies RouteComparison;
  });

  const recommended = comparisons.find((comparison) => comparison.route.id === recommendedRoute.id);
  if (!recommended) throw new Error("Recommended route was not present in comparison results");

  return {
    recommended,
    alternatives: comparisons.filter((comparison) => comparison.route.id !== recommendedRoute.id),
    reason: explainRecommendation(recommended, comparisons, priority),
  };
}

function scoreFor(route: Route, routes: Route[], preferences?: MoneyPreferences): number {
  const ranked = rankRoutes(routes, preferences);
  const index = ranked.findIndex((candidate) => candidate.id === route.id);
  return ranked.length <= 1 ? 1 : 1 - index / (ranked.length - 1);
}

function subtractPositive(a: MoneyAmount, b: MoneyAmount): MoneyAmount | undefined {
  if (a.currency.toUpperCase() !== b.currency.toUpperCase()) return undefined;
  const value = Number(a.amount) - Number(b.amount);
  if (value <= 0) return undefined;
  return { amount: value.toFixed(12).replace(/\.?0+$/, ""), currency: a.currency };
}

function explainRecommendation(
  recommended: RouteComparison,
  alternatives: RouteComparison[],
  priority: RoutePriority,
): string {
  if (priority === "CHEAPEST") return `${recommended.route.name} is the cheapest viable route.`;
  if (priority === "FASTEST") return `${recommended.route.name} is the fastest viable route at ${recommended.etaMinutes} minutes.`;
  if (priority === "MOST_RELIABLE") return `${recommended.route.name} has the strongest reliability profile at ${recommended.reliabilityScore}%.`;

  const betterPriced = alternatives.filter((item) => Number(item.sourceCost.amount) < Number(recommended.sourceCost.amount));
  const faster = alternatives.filter((item) => item.etaMinutes < recommended.etaMinutes);
  if (betterPriced.length === 0 && faster.length === 0) {
    return `${recommended.route.name} is the strongest overall option across cost, speed, and reliability.`;
  }
  if (betterPriced.length > 0 && faster.length === 0) {
    return `${recommended.route.name} costs more than the cheapest option, but provides a better overall balance of speed and reliability.`;
  }
  if (betterPriced.length === 0 && faster.length > 0) {
    return `${recommended.route.name} is not the fastest option, but offers a stronger overall balance of cost and reliability.`;
  }
  return `${recommended.route.name} is the balanced recommendation rather than optimizing only one dimension.`;
}
