"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Profile = { user_id: string; display_name: string | null; phone_e164: string | null; phone_verified_at: string | null; country_code: string | null; email_verified_at: string | null };

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("ZW");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { setMessage("Sign in to manage your account."); setBusy(false); return; }
      const { data, error } = await supabase.from("money_profiles").select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").eq("user_id", auth.user.id).maybeSingle();
      if (error) setMessage(error.message);
      if (data) { setProfile(data); setDisplayName(data.display_name ?? ""); setPhone(data.phone_e164 ?? ""); setCountry(data.country_code ?? "ZW"); }
      setBusy(false);
    };
    void load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMessage("Sign in first."); setSaving(false); return; }
    const normalized = phone.trim().replace(/[\s()-]/g, "");
    const payload = { user_id: auth.user.id, display_name: displayName.trim() || null, phone_e164: normalized || null, country_code: country.trim().toUpperCase() || null };
    const { data, error } = await supabase.from("money_profiles").upsert(payload, { onConflict: "user_id" }).select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").single();
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setProfile(data); setPhone(data.phone_e164 ?? ""); setMessage(data.phone_verified_at ? "Profile saved. Phone is verified." : "Profile saved. Phone still needs verification before it can be trusted for money operations.");
  }

  if (busy) return <main className="shell"><p>Loading account…</p></main>;
  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/">← Navigator</a></nav><section className="auth-card"><p className="eyebrow">SHADECODE · IDENTITY</p><h1>Your account.</h1><p className="subhead">Keep your identity details current. Phone numbers must be verified before they become trusted money identifiers.</p><form onSubmit={save}><label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} /></label><label>Phone number (E.164)<input inputMode="tel" placeholder="+263771234567" value={phone} onChange={e => setPhone(e.target.value)} /></label><label>Country code<input maxLength={2} placeholder="ZW" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} /></label><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></form>{profile && <div className="session-message">{profile.phone_verified_at ? "✓ Phone verified" : "○ Phone not verified"}</div>}{message && <p className="session-message" role="status">{message}</p>}</section></main>;
}
