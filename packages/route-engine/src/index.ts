import type { MoneyPreferences, Route } from "../../money-core/src/index";

export type RoutePriority = "CHEAPEST" | "FASTEST" | "MOST_RELIABLE" | "BALANCED";

function normalize(value: number, min: number, max: number): number {
  return max === min ? 1 : (value - min) / (max - min);
}

export function scoreRoute(route: Route, routes: Route[], preferences?: MoneyPreferences): number {
  const costs = routes.map((r) => Number(r.cost.amount));
  const delays = routes.map((r) => r.estimatedArrivalMinutes);
  const reliabilities = routes.map((r) => r.reliabilityScore);

  const costScore = 1 - normalize(Number(route.cost.amount), Math.min(...costs), Math.max(...costs));
  const speedScore = 1 - normalize(route.estimatedArrivalMinutes, Math.min(...delays), Math.max(...delays));
  const reliabilityScore = normalize(route.reliabilityScore, Math.min(...reliabilities), Math.max(...reliabilities));

  const p = preferences ?? { cost: 1, speed: 1, reliability: 1 };
  const total = (p.cost ?? 0) + (p.speed ?? 0) + (p.reliability ?? 0);
  if (total === 0) return (costScore + speedScore + reliabilityScore) / 3;

  return ((p.cost ?? 0) * costScore + (p.speed ?? 0) * speedScore + (p.reliability ?? 0) * reliabilityScore) / total;
}

export function rankRoutes(routes: Route[], preferences?: MoneyPreferences): Route[] {
  return [...routes].sort((a, b) => scoreRoute(b, routes, preferences) - scoreRoute(a, routes, preferences));
}

export function recommend(routes: Route[], priority: RoutePriority = "BALANCED", preferences?: MoneyPreferences): Route {
  if (routes.length === 0) throw new Error("Cannot recommend from an empty route set");

  const sorted = [...routes];
  if (priority === "CHEAPEST") sorted.sort((a, b) => Number(a.cost.amount) - Number(b.cost.amount));
  else if (priority === "FASTEST") sorted.sort((a, b) => a.estimatedArrivalMinutes - b.estimatedArrivalMinutes);
  else if (priority === "MOST_RELIABLE") sorted.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  else return rankRoutes(sorted, preferences)[0];

  return sorted[0];
}
