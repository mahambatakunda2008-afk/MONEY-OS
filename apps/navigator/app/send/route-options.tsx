"use client";

import { useMemo } from "react";

type Props = { amount: number; currency: string; recipientCountry?: string | null };

type Route = { id: string; name: string; rail: string; fee: number; eta: string; score: number; note: string };

export function RouteOptions({ amount, currency, recipientCountry }: Props) {
  const routes = useMemo<Route[]>(() => {
    const base = Math.max(0.5, amount * 0.01);
    return [
      { id: "standard", name: "Standard transfer", rail: "Account-to-account", fee: Number(base.toFixed(2)), eta: "1–2 business days", score: 82, note: "Lower cost, slower settlement." },
      { id: "fast", name: "Fast transfer", rail: "Priority rail", fee: Number((base * 1.8).toFixed(2)), eta: "Minutes–hours", score: 91, note: "Higher fee for faster settlement." },
    ].sort((a, b) => b.score - a.score);
  }, [amount]);

  return <section className="preview"><p className="label">04 · ROUTES</p><h2>Compare available routes.</h2><p>Simulation only. These are planning estimates, not live provider quotes.</p><div className="route-list">{routes.map(route => <article className="transaction-row" key={route.id}><div><strong>{route.name}</strong><span>{route.rail} · {route.eta}</span><span>{route.note}</span></div><div><strong>{route.fee.toFixed(2)} {currency}</strong><span>Score {route.score}/100</span></div></article>)}</div><p className="session-message">Destination: {recipientCountry ?? "unknown"}. A production route must come from authorized rail configuration and a fresh server-side quote.</p></section>;
}
