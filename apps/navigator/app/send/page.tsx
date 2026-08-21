"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase";

type Recipient = { user_id: string; display_name: string | null; country_code: string | null };

function normalizePhone(value: string) { return value.trim().replace(/[\s()-]/g, ""); }

export default function SendPage() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function findRecipient() {
    setBusy(true); setMessage(null); setRecipient(null); setConfirmed(false);
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) { setMessage("Enter a valid international phone number."); setBusy(false); return; }
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lookup_money_recipient_by_phone", { p_phone_e164: normalized });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    const match = Array.isArray(data) ? data[0] : data;
    if (!match) { setMessage("No verified Shadecode Money recipient was found."); return; }
    setRecipient(match as Recipient);
  }

  function review() {
    setMessage(null);
    const numeric = Number(amount);
    if (!recipient) return setMessage("Find and review the recipient first.");
    if (!Number.isFinite(numeric) || numeric <= 0) return setMessage("Enter a valid positive amount.");
    setConfirmed(true);
  }

  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/wallet">← Wallet</a></nav><section className="hero"><p className="eyebrow">SHADECODE · SEND</p><h1>Prepare a transfer.</h1><p className="subhead">We identify the recipient and prepare the transaction intent first. No money moves from this screen.</p></section><section className="preview"><p className="label">01 · RECIPIENT</p><div className="recipient-form"><input inputMode="tel" placeholder="Recipient +263771234567" value={phone} onChange={e => setPhone(e.target.value)} /><button onClick={findRecipient} disabled={busy}>{busy ? "Looking up…" : "Find recipient"}</button></div>{recipient && <div className="recipient-result"><strong>{recipient.display_name ?? "Shadecode Money user"}</strong><span>{recipient.country_code ?? ""}</span><p>Verified recipient identity found. Confirm the destination before continuing.</p></div>}</section><section className="preview"><p className="label">02 · AMOUNT</p><div className="recipient-form"><input inputMode="decimal" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} /><select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>ZAR</option><option>ZWG</option><option>GBP</option><option>EUR</option></select></div><button onClick={review} disabled={!recipient || !amount}>Review transfer</button></section>{confirmed && recipient && <section className="preview"><p className="label">03 · CONFIRMATION</p><h2>Ready for route selection.</h2><p>You intend to send <strong>{amount} {currency}</strong> to <strong>{recipient.display_name ?? "the verified recipient"}</strong>.</p><p className="session-message">No transaction has been created and no funds have moved. The next layer must quote and select an authorized route.</p></section>}{message && <p className="session-message" role="status">{message}</p>}<footer>Shadecode · Transfer intent · No real-money execution</footer></main>;
}
