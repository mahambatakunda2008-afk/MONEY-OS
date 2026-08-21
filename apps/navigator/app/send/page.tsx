"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";
import { getRouteQuote, type RouteQuote } from "./quote";

type Recipient = { user_id: string; display_name: string | null; country_code: string | null };
function normalizePhone(value: string) { return value.trim().replace(/[\s()-]/g, ""); }

export default function SendPage() {
  const [phone, setPhone] = useState(""); const [amount, setAmount] = useState(""); const [currency, setCurrency] = useState("USD");
  const [recipient, setRecipient] = useState<Recipient | null>(null); const [routes, setRoutes] = useState<RouteQuote[]>([]); const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  async function findRecipient() {
    setBusy(true); setMessage(null); setRecipient(null); setRoutes([]); setSelectedRoute(null);
    const normalized = normalizePhone(phone); if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) { setMessage("Enter a valid international phone number."); setBusy(false); return; }
    const supabase = createClient(); const { data, error } = await supabase.rpc("lookup_money_recipient_by_phone", { p_phone_e164: normalized }); setBusy(false);
    if (error) { setMessage(error.message); return; } const match = Array.isArray(data) ? data[0] : data; if (!match) { setMessage("No verified Shadecode Money recipient was found."); return; } setRecipient(match as Recipient);
  }

  async function quote() {
    setMessage(null); setRoutes([]); setSelectedRoute(null); const numeric = Number(amount);
    if (!recipient) return setMessage("Find and review the recipient first."); if (!Number.isFinite(numeric) || numeric <= 0) return setMessage("Enter a valid positive amount.");
    setBusy(true); try { const result = await getRouteQuote(numeric, currency, recipient.country_code ?? ""); setRoutes(result.routes); if (!result.routes.length) setMessage("No eligible money rail is configured for this currency."); } catch (error) { setMessage(error instanceof Error ? error.message : "Route quote failed."); } finally { setBusy(false); }
  }

  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/wallet">← Wallet</a></nav><section className="hero"><p className="eyebrow">SHADECODE · SEND</p><h1>Prepare a transfer.</h1><p className="subhead">Recipient identity and route eligibility are checked before any transaction can be created.</p></section>
    <section className="preview"><p className="label">01 · RECIPIENT</p><div className="recipient-form"><input inputMode="tel" placeholder="Recipient +263771234567" value={phone} onChange={e => setPhone(e.target.value)} /><button onClick={findRecipient} disabled={busy}>{busy ? "Looking up…" : "Find recipient"}</button></div>{recipient && <div className="recipient-result"><strong>{recipient.display_name ?? "Shadecode Money user"}</strong><span>{recipient.country_code ?? ""}</span><p>Verified recipient identity found.</p></div>}</section>
    <section className="preview"><p className="label">02 · AMOUNT</p><div className="recipient-form"><input inputMode="decimal" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} /><select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>ZAR</option><option>ZWG</option><option>GBP</option><option>EUR</option></select></div><button onClick={quote} disabled={!recipient || !amount || busy}>{busy ? "Quoting…" : "Get route options"}</button></section>
    {routes.length > 0 && <section className="preview"><p className="label">03 · ROUTES</p><h2>Choose an eligible route.</h2><p>Fees and eligibility are calculated server-side from the current money-rail configuration.</p><div className="route-list">{routes.map(route => <button className="transaction-row" key={route.id} disabled={!route.sufficientBalance} onClick={() => setSelectedRoute(route.id)} aria-pressed={selectedRoute === route.id}><div><strong>{route.name}</strong><span>{route.railType} · {route.eta}</span></div><div><strong>{route.fee.toFixed(2)} {route.currency}</strong><span>{route.sufficientBalance ? "Eligible" : "Insufficient balance"}</span></div></button>)}</div>{selectedRoute && <p className="session-message">Route selected. Final confirmation still does not create a transaction or move funds.</p>}</section>}
    {message && <p className="session-message" role="status">{message}</p>}<footer>Shadecode · Transfer intent · No real-money execution</footer></main>;
}
