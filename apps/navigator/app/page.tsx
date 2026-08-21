"use client";

import { useMemo, useState } from "react";
import { createClient } from "../lib/supabase";

const examples = [
  "Send enough money so Mum receives $300",
  "Convert $500 USD to ZAR",
  "Hold $200 for emergencies",
  "Pay for my hotel in South Africa",
];

function classify(text: string) {
  const lower = text.toLowerCase();
  if (/hold|reserve|set aside/.test(lower)) return "HOLD";
  if (/convert|exchange/.test(lower)) return "CONVERT";
  if (/pay|purchase|buy/.test(lower)) return "PAY";
  if (/receive/.test(lower)) return "RECEIVE";
  if (/send|transfer/.test(lower)) return "SEND";
  return "MOVE";
}

export default function Home() {
  const [request, setRequest] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const action = useMemo(() => (request ? classify(request) : null), [request]);

  async function checkSession() {
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      setMessage(data.user ? `Authenticated as ${data.user.email ?? "your account"}.` : "You are not signed in yet. Simulation mode is available without an account.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reach Supabase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div>
        <div className="nav-actions">
          <span className="status"><i /> Simulation mode</span>
          <button className="session-button" onClick={checkSession} disabled={busy}>{busy ? "Checking…" : "Check account"}</button>
        </div>
      </nav>

      <section className="hero">
        <p className="eyebrow">SHADECODE · FINANCIAL NAVIGATION</p>
        <h1>Tell us what you want your money to do.</h1>
        <p className="subhead">Turn the outcome into a clear plan, compare routes, and understand the trade-offs before anything moves.</p>

        <div className="composer">
          <textarea value={request} onChange={(event) => setRequest(event.target.value)} placeholder="e.g. I need Mum to receive $300" aria-label="Describe what you want your money to do" />
          <button disabled={!request.trim()} onClick={() => setRequest(request.trim())}>Build plan <span>→</span></button>
        </div>

        <div className="chips">{examples.map((example) => <button key={example} onClick={() => setRequest(example)}>{example}</button>)}</div>
        {message && <p className="session-message" role="status">{message}</p>}
      </section>

      {request && (
        <section className="preview">
          <div><p className="label">UNDERSTANDING</p><h2>{action} request detected</h2><p className="request">“{request}”</p></div>
          <div className="preview-grid"><div><span>Mode</span><strong>Simulation</strong></div><div><span>Next</span><strong>Quote → Route → Plan</strong></div></div>
        </section>
      )}

      <section className="principles">
        <article><b>01</b><h3>Understand</h3><p>Turn natural language into a structured money intent.</p></article>
        <article><b>02</b><h3>Compare</h3><p>Evaluate cost, speed and reliability across routes.</p></article>
        <article><b>03</b><h3>Explain</h3><p>Show what will happen and why a route was recommended.</p></article>
      </section>

      <footer>Shadecode · M0.1 · No real-money execution</footer>
    </main>
  );
}
