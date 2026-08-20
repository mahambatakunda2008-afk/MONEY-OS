import type { Route } from "../../money-core/src/index";

export type RouteRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RouteRisk {
  level: RouteRiskLevel;
  score: number;
  reasons: string[];
  blockers: string[];
}

/** Deterministic pre-execution risk screen. This is not a fraud or compliance decision. */
export function assessRouteRisk(route: Route, now = new Date()): RouteRisk {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  if (route.reliabilityScore < 90) {
    score += 35;
    reasons.push("Provider reliability is below 90%.");
  } else if (route.reliabilityScore < 97) {
    score += 15;
    reasons.push("Provider reliability is below the strongest tier.");
  }

  if (route.estimatedArrivalMinutes > 240) {
    score += 25;
    reasons.push("Estimated settlement time exceeds four hours.");
  } else if (route.estimatedArrivalMinutes > 60) {
    score += 10;
    reasons.push("Estimated settlement time exceeds one hour.");
  }

  const expiresAt = Date.parse(route.quote.expiresAt);
  if (!Number.isFinite(expiresAt)) {
    score += 40;
    blockers.push("Quote expiry is invalid.");
  } else if (expiresAt <= now.getTime()) {
    score += 50;
    blockers.push("Quote has expired.");
  } else if (expiresAt - now.getTime() < 30_000) {
    score += 20;
    reasons.push("Quote expires in less than 30 seconds.");
  }

  const level: RouteRiskLevel = score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  return { level, score: Math.min(score, 100), reasons, blockers };
}

export function isRouteExecutable(risk: RouteRisk): boolean {
  return risk.blockers.length === 0;
}
