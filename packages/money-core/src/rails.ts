import type { MoneyAmount } from "./index";

export type PaymentRailType = "INTERNAL" | "BANK" | "CARD" | "MOBILE_MONEY" | "QR" | "CASH" | "OTHER";
export type PaymentRailStatus = "ACTIVE" | "DEGRADED" | "UNAVAILABLE";

export interface PaymentRail {
  id: string;
  type: PaymentRailType;
  provider: string;
  countries: readonly string[];
  currencies: readonly string[];
  status: PaymentRailStatus;
  capabilities: readonly ("SEND" | "RECEIVE" | "PAY" | "REFUND")[];
}

export interface RailRouteRequest {
  amount: MoneyAmount;
  destinationCountry: string;
  capability: "SEND" | "RECEIVE" | "PAY" | "REFUND";
}

export interface RailRouteScore { railId: string; score: number; reasons: readonly string[]; }

export function isRailEligible(rail: PaymentRail, request: RailRouteRequest): boolean {
  return rail.status === "ACTIVE" && rail.currencies.includes(request.amount.currency.toUpperCase()) && rail.countries.includes(request.destinationCountry.toUpperCase()) && rail.capabilities.includes(request.capability);
}

/** Deterministic first-pass routing. Cost, FX, risk, limits and live availability belong in the next routing layer. */
export function rankRails(rails: readonly PaymentRail[], request: RailRouteRequest): RailRouteScore[] {
  return rails.filter((rail) => isRailEligible(rail, request)).map((rail) => {
    const reasons = ["active", "currency-supported", "country-supported", "capability-supported"];
    const score = rail.type === "INTERNAL" ? 100 : rail.type === "BANK" ? 80 : rail.type === "MOBILE_MONEY" ? 75 : rail.type === "CARD" ? 70 : 60;
    return { railId: rail.id, score, reasons };
  }).sort((a, b) => b.score - a.score || a.railId.localeCompare(b.railId));
}

export function selectRail(rails: readonly PaymentRail[], request: RailRouteRequest): PaymentRail {
  const ranked = rankRails(rails, request);
  const selected = rails.find((rail) => rail.id === ranked[0]?.railId);
  if (!selected) throw new Error("No eligible payment rail");
  return selected;
}
