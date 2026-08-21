"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Profile = { display_name: string | null; phone_verified_at: string | null; country_code: string | null };
type Account = { id: string; currency: string; available_minor: string; held_minor: string; committed_minor: string };

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!active) return;
      if (!auth.user) { router.replace("/auth"); return; }
      const [{ data: p }, { data: a, error: ae }] = await Promise.all([
        supabase.from("money_profiles").select("display_name,phone_verified_at,country_code").eq("user_id", auth.user.id).maybeSingle(),
        supabase.from("money_accounts").select("id,currency,available_minor,held_minor,committed_minor").eq("owner_id", auth.user.id).order("created_at", { ascending: true }),
      ]);
      if (ae) setError(ae.message);
      if (active) { setProfile(p); setAccounts((a ?? []) as Account[]); setReady(true); }
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) router.replace("/auth"); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [router]);

  if (!ready) return <main className="shell auth-shell"><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY</p><h1>Loading your workspace…</h1><p className="subhead">Checking identity, wallet and money services.</p></section></main>;
  const available = accounts.reduce((sum, a) => sum + Number(a.available_minor), 0) / 100;
  const held = accounts.reduce((sum, a) => sum + Number(a.held_minor), 0) / 100;

  return <main className="shell">
    <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode Money</span></div><div className="nav-actions"><a href="/account">Account</a></div></nav>
    <section className="hero"><p className="eyebrow">SHADECODE · MONEY WORKSPACE</p><h1>{profile?.display_name ? `Welcome, ${profile.display_name}.` : "Your money workspace."}</h1><p className="subhead">Plan, compare, confirm and track money movement from one place. M0.1 remains simulation-only.</p></section>
    {error && <p className="session-message" role="status">{error}</p>}
    {!profile?.phone_verified_at && <section className="preview"><div><p className="label">IDENTITY</p><h2>Verify your phone first.</h2><p className="request">Phone verification is required before your number can be used as a trusted money identifier or recipient lookup target.</p></div><a className="link-button" href="/account">Open account →</a></section>}
    <section className="preview-grid workspace-grid">
      <a className="preview tile" href="/wallet"><p className="label">WALLET</p><h2>{accounts.length} account{accounts.length === 1 ? "" : "s"}</h2><p>Available {available.toFixed(2)} · Held {held.toFixed(2)}</p><strong>Open wallet →</strong></a>
      <a className="preview tile" href="/send"><p className="label">SEND</p><h2>Prepare a transfer</h2><p>Find a verified recipient, compare routes, check balance and authorize a hold.</p><strong>Start transfer →</strong></a>
      <a className="preview tile" href="/transactions"><p className="label">LEDGER</p><h2>Transaction history</h2><p>Inspect your owner-scoped transaction and settlement state.</p><strong>View history →</strong></a>
      <a className="preview tile" href="/account"><p className="label">IDENTITY</p><h2>Account & phone</h2><p>Manage your display name, country and verified phone number.</p><strong>Manage identity →</strong></a>
    </section>
    <section className="principles"><article><b>01</b><h3>Understand</h3><p>Describe the outcome you want.</p></article><article><b>02</b><h3>Compare</h3><p>See route cost, speed and balance eligibility.</p></article><article><b>03</b><h3>Confirm</h3><p>Verify the recipient before funds are held.</p></article></section>
    <footer>Shadecode Money · Navigator · M0.1 · No real-money execution</footer>
  </main>;
}
