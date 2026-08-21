"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Account = { id: string; name: string | null; currency: string; balance: string; status: string };

export default function WalletPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) { setMessage(authError.message); setBusy(false); return; }
      if (!auth.user) { setMessage("Sign in to view your wallet."); setBusy(false); return; }
      setEmail(auth.user.email ?? null);
      const { data, error } = await supabase.from("money_accounts").select("id,name,currency,balance,status").eq("owner_id", auth.user.id).order("created_at", { ascending: true });
      if (error) setMessage(error.message);
      else setAccounts((data ?? []) as Account[]);
      setBusy(false);
    };
    void load();
  }, []);

  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><div className="nav-actions"><span>{email ?? "Guest"}</span><a href="/">Navigator</a></div></nav><section className="hero"><p className="eyebrow">SHADECODE · WALLET</p><h1>Your money, clearly.</h1><p className="subhead">Balances shown here come directly from your owner-scoped Supabase account data.</p></section>{busy ? <p>Loading accounts…</p> : message ? <p className="session-message" role="status">{message}</p> : <section className="wallet-grid">{accounts.length === 0 ? <article className="preview"><p className="label">NO ACCOUNTS</p><h2>Your wallet is ready for its first account.</h2><p>Create an account through the authenticated money flow before funds can be represented here.</p></article> : accounts.map(account => <article className="preview" key={account.id}><p className="label">{account.status}</p><h2>{account.name ?? "Money account"}</h2><strong>{account.balance} {account.currency}</strong><p>Account ID · {account.id}</p></article>)}</section>}<footer>Shadecode · Wallet · Read-only balance view</footer></main>;
}
