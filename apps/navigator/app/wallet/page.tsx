"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Account = { id: string; currency: string; available_minor: string; held_minor: string; committed_minor: string };
const money = (minor: string) => (Number(minor) / 100).toFixed(2);

export default function WalletPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]); const [email, setEmail] = useState(""); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(true);
  useEffect(() => { const supabase=createClient(); let active=true; void (async()=>{ const {data:auth,error:ae}=await supabase.auth.getUser(); if(!auth.user){router.replace("/auth");return;} if(ae){setMessage(ae.message);setBusy(false);return;} setEmail(auth.user.email??""); const {data,error}=await supabase.from("money_accounts").select("id,currency,available_minor,held_minor,committed_minor").eq("owner_id",auth.user.id).order("created_at",{ascending:true}); if(active){if(error)setMessage(error.message);else setAccounts((data??[]) as Account[]);setBusy(false);}})(); return()=>{active=false;}; },[router]);
  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode Money</span></div><div className="nav-actions"><a href="/dashboard">Workspace</a><a href="/account">Account</a></div></nav><section className="hero"><p className="eyebrow">SHADECODE · WALLET</p><h1>Your money, clearly.</h1><p className="subhead">{email}</p></section>{busy?<p>Loading accounts…</p>:message?<p className="session-message" role="status">{message}</p>:<><section className="wallet-grid">{accounts.length===0?<article className="preview"><p className="label">READY</p><h2>No money accounts yet.</h2><p>Create your first currency account. This creates an empty ledger account only.</p><a className="link-button" href="/wallet/create">Create account →</a></article>:accounts.map(a=><article className="preview" key={a.id}><p className="label">{a.currency}</p><h2>{money(a.available_minor)} {a.currency}</h2><div className="preview-grid"><div><span>Available</span><strong>{money(a.available_minor)} {a.currency}</strong></div><div><span>Held</span><strong>{money(a.held_minor)} {a.currency}</strong></div><div><span>Committed</span><strong>{money(a.committed_minor)} {a.currency}</strong></div></div></article>)}</section><p><a className="link-button" href="/wallet/create">+ Add another currency</a> · <a className="link-button" href="/transactions">View ledger</a></p></>}<footer>Shadecode Money · Wallet</footer></main>;
}
