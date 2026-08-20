import type { MoneyAmount, MoneyLocation, Route } from "../../money-core/src/index";

export interface Provider {
  id: string;
  name: string;
  active: boolean;
  countries: string[];
  currencies: string[];
}

export interface GraphNode {
  id: string;
  type: "CURRENCY" | "COUNTRY" | "BANK" | "WALLET" | "CARD" | "PROVIDER" | "RAIL" | "MERCHANT" | "PERSON";
  country?: string;
  currency?: string;
}

export interface GraphRoute {
  id: string;
  providerId: string;
  name: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceCountry?: string;
  destinationCountry?: string;
  cost: MoneyAmount;
  estimatedArrivalMinutes: number;
  reliabilityScore: number;
  active: boolean;
}

export interface MoneyGraph {
  providers: Provider[];
  nodes: GraphNode[];
  routes: GraphRoute[];
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

export function findRoutes(
  graph: MoneyGraph,
  source: Pick<MoneyLocation, "country" | "currency">,
  destination: Pick<MoneyLocation, "country" | "currency">,
): GraphRoute[] {
  const sourceCurrency = source.currency?.toUpperCase();
  const destinationCurrency = destination.currency?.toUpperCase();
  if (!sourceCurrency || !destinationCurrency) return [];

  const activeProviders = new Set(
    graph.providers
      .filter((provider) => provider.active)
      .filter((provider) => provider.currencies.includes(sourceCurrency) && provider.currencies.includes(destinationCurrency))
      .filter((provider) => !source.country || provider.countries.includes(source.country))
      .filter((provider) => !destination.country || provider.countries.includes(destination.country))
      .map((provider) => provider.id),
  );

  return graph.routes.filter(
    (route) =>
      route.active &&
      route.sourceCurrency === sourceCurrency &&
      route.destinationCurrency === destinationCurrency &&
      activeProviders.has(route.providerId),
  );
}
