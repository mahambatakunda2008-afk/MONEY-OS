"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Transaction = { id: string; status: string; action: string | null; amount: string | null; currency: string | null; description: string | null; created_at: string };

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) { setMessage(authError.message); setBusy(false); return; }
      if (!auth.user) { setMessage("Sign in to view your transaction history."); setBusy(false); return; }
      const { data, error } = await supabase.from("money_transactions").select("id,status,action,amount,currency,description,created_at").eq("owner_id", auth.user.id).order("created_at", { ascending: false }).limit(100);
      if (error) setMessage(error.message); else setItems((data ?? []) as Transaction[]);
      setBusy(false);
    };
    void load();
  }, []);

  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/wallet">← Wallet</a></nav><section className="hero"><p className="eyebrow">SHADECODE · LEDGER</p><h1>Transaction history.</h1><p className="subhead">A read-only view of your owner-scoped money activity.</p></section>{busy ? <p>Loading transactions…</p> : message ? <p className="session-message" role="status">{message}</p> : items.length === 0 ? <section className="preview"><p className="label">LEDGER EMPTY</p><h2>No transactions yet.</h2><p>Nothing has been created on this account.</p></section> : <section className="transaction-list">{items.map(item => <article className="transaction-row" key={item.id}><div><strong>{item.description ?? item.action ?? "Money transaction"}</strong><span>{new Date(item.created_at).toLocaleString()}</span></div><div><strong>{item.amount ?? "—"} {item.currency ?? ""}</strong><span>{item.status}</span></div></article>)}</section>}<footer>Shadecode · Ledger · Read-only</footer></main>;
}
