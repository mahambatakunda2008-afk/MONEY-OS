"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase";

const examples = ["Send enough money so Mum receives $300", "Convert $500 USD to ZAR", "Hold $200 for emergencies", "Pay for my hotel in South Africa"];

type Recipient = { user_id: string; display_name: string | null; country_code: string | null };

function normalizePhone(value: string) { return value.trim().replace(/[\s()-]/g, ""); }

export default function Home() {
  const [request, setRequest] = useState("");
  const [phone, setPhone] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function findRecipient() {
    setBusy(true); setMessage(null); setRecipient(null);
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) { setMessage("Enter a valid phone number in international format, for example +263771234567."); setBusy(false); return; }
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("lookup_money_recipient_by_phone", { p_phone_e164: normalized });
      if (error) throw error;
      const match = Array.isArray(data) ? data[0] : data;
      if (!match) setMessage("No verified Shadecode Money recipient was found for that number.");
      else setRecipient(match as Recipient);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Recipient lookup failed."); }
    finally { setBusy(false); }
  }

  return <main className="shell">
    <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><div className="nav-actions"><a href="/auth">Sign in</a><a href="/account">Account</a></div></nav>
    <section className="hero"><p className="eyebrow">SHADECODE · FINANCIAL NAVIGATION</p><h1>Tell us what you want your money to do.</h1><p className="subhead">Turn the outcome into a clear plan, compare routes, and understand the trade-offs before anything moves.</p>
      <div className="composer"><textarea value={request} onChange={e => setRequest(e.target.value)} placeholder="e.g. I need Mum to receive $300" aria-label="Describe what you want your money to do" /><button disabled={!request.trim()}>Build plan <span>→</span></button></div>
      <div className="chips">{examples.map(example => <button key={example} onClick={() => setRequest(example)}>{example}</button>)}</div>
    </section>
    <section className="preview"><div><p className="label">RECIPIENT</p><h2>Find a verified recipient</h2><p className="request">Use their verified phone number. We only reveal the minimum identity needed to confirm the destination.</p></div><div className="recipient-form"><input inputMode="tel" placeholder="+263771234567" value={phone} onChange={e => setPhone(e.target.value)} aria-label="Recipient phone number"/><button onClick={findRecipient} disabled={busy}>{busy ? "Looking up…" : "Find recipient"}</button></div>{recipient && <div className="recipient-result"><strong>{recipient.display_name ?? "Shadecode Money user"}</strong><span>{recipient.country_code ?? ""}</span><p>Verified phone identity matched. Review the recipient before creating a transaction.</p></div>}{message && <p className="session-message" role="status">{message}</p>}</section>
    <section className="principles"><article><b>01</b><h3>Understand</h3><p>Turn natural language into a structured money intent.</p></article><article><b>02</b><h3>Compare</h3><p>Evaluate cost, speed and reliability across routes.</p></article><article><b>03</b><h3>Confirm</h3><p>Verify the destination before anything can move.</p></article></section>
    <footer>Shadecode · M0.1 · No real-money execution</footer>
  </main>;
}
