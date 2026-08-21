"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase";

const currencies = ["USD", "ZWL", "ZAR", "BWP", "GBP", "EUR"];

export default function CreateWalletPage() {
  const [currency, setCurrency] = useState("USD");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setMessage(authError?.message ?? "Sign in before creating a money account.");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.rpc("create_money_account", { p_currency: currency });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setAccountId(data as string);
    setMessage(`Your ${currency} account was created successfully.`);
  }

  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/wallet">← Wallet</a></nav><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY ACCOUNT</p><h1>Create an account.</h1><p className="subhead">This creates an empty ledger account. It does not deposit, withdraw, or transfer real money.</p><form onSubmit={createAccount}><label>Currency<select value={currency} onChange={e => setCurrency(e.target.value)}>{currencies.map(value => <option key={value} value={value}>{value}</option>)}</select></label><button type="submit" disabled={busy}>{busy ? "Creating…" : "Create money account"}</button></form>{accountId && <p className="session-message" role="status">Account ID: {accountId}</p>}{message && <p className="session-message" role="status">{message}</p>}</section></main>;
}
