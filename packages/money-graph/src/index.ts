import type { MoneyAmount, Route } from "../../money-core/src/index";

export interface Provider {
  id: string;
  name: string;
  active: boolean;
}

export interface GraphRoute {
  id: string;
  providerId: string;
  name: string;
  sourceCurrency: string;
  destinationCurrency: string;
  cost: MoneyAmount;
  estimatedArrivalMinutes: number;
  reliabilityScore: number;
}

export function toRoute(route: GraphRoute, quote: Route["quote"]): Route {
  return {
    id: route.id,
    providerId: route.providerId,
    name: route.name,
    cost: route.cost,
    estimatedArrivalMinutes: route.estimatedArrivalMinutes,
    reliabilityScore: route.reliabilityScore,
    quote,
  };
}
