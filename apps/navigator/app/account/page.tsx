"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Profile = { user_id: string; display_name: string | null; phone_e164: string | null; phone_verified_at: string | null; country_code: string | null; email_verified_at: string | null };
function normalizePhone(value: string) { return value.trim().replace(/[\s()-]/g, ""); }
const E164 = /^\+[1-9][0-9]{6,14}$/;

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("ZW");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/auth"); return; }
      const { data, error } = await supabase.from("money_profiles").select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").eq("user_id", auth.user.id).maybeSingle();
      if (error) setMessage(error.message);
      if (data) { setProfile(data); setDisplayName(data.display_name ?? ""); setPhone(data.phone_e164 ?? ""); setCountry(data.country_code ?? "ZW"); }
      setBusy(false);
    })();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) router.replace("/auth"); });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function signOut() { await createClient().auth.signOut(); router.replace("/auth"); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const supabase = createClient(); const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { router.replace("/auth"); return; }
    const normalized = normalizePhone(phone);
    if (normalized && !E164.test(normalized)) { setMessage("Enter a valid E.164 phone number, for example +263771234567."); setSaving(false); return; }
    const payload = { user_id: auth.user.id, display_name: displayName.trim() || null, phone_e164: normalized || null, country_code: country.trim().toUpperCase() || null };
    const { data, error } = await supabase.from("money_profiles").upsert(payload, { onConflict: "user_id" }).select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").single();
    setSaving(false); if (error) { setMessage(error.message); return; }
    setProfile(data); setPhone(data.phone_e164 ?? ""); setMessage(data.phone_verified_at ? "Profile saved. Phone is verified." : "Profile saved. Verify the phone before using it as a trusted money identifier.");
  }
  async function sendOtp() {
    const normalized = normalizePhone(phone); if (!E164.test(normalized)) { setMessage("Enter a valid E.164 phone number, for example +263771234567."); return; }
    setVerifying(true); setMessage(null); const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("money-phone-otp-v2", { body: { action: "start", phoneE164: normalized } });
    setVerifying(false); if (error || !data?.challengeId) { setMessage(error?.message ?? data?.error ?? "Verification service unavailable."); return; }
    setChallengeId(String(data.challengeId)); setOtpSent(true); setMessage("Verification challenge created. Enter the code sent to your phone when SMS delivery is configured.");
  }
  async function verifyOtp() {
    const normalized = normalizePhone(phone); if (!challengeId || !E164.test(normalized) || !/^\d{6}$/.test(otp)) { setMessage("Enter the 6-digit verification code."); return; }
    setVerifying(true); setMessage(null); const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("money-phone-otp-v2", { body: { action: "verify", phoneE164: normalized, challengeId, otp } });
    setVerifying(false); if (error || !data?.verified) { setMessage(error?.message ?? data?.error ?? "Phone verification failed."); return; }
    const { data: auth } = await supabase.auth.getUser(); if (auth.user) { const { data: refreshed } = await supabase.from("money_profiles").select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").eq("user_id", auth.user.id).single(); if (refreshed) setProfile(refreshed); }
    setOtpSent(false); setChallengeId(""); setOtp(""); setMessage("Phone verified successfully.");
  }

  if (busy) return <main className="shell auth-shell"><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY</p><h1>Loading your account…</h1></section></main>;
  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode Money</span></div><div className="nav-actions"><a href="/">Navigator</a><button className="link-button" type="button" onClick={signOut}>Sign out</button></div></nav><section className="auth-card"><p className="eyebrow">SHADECODE · IDENTITY</p><h1>Your account.</h1><p className="subhead">Keep your identity details current. Phone numbers must be verified before they become trusted money identifiers.</p><form onSubmit={save}><label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} /></label><label>Phone number (E.164)<input inputMode="tel" placeholder="+263771234567" value={phone} onChange={e => setPhone(e.target.value)} /></label><label>Country code<input maxLength={2} placeholder="ZW" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} /></label><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></form>{profile?.phone_verified_at ? <div className="session-message">✓ Phone verified</div> : <div><div className="session-message">○ Phone not verified</div><button type="button" onClick={sendOtp} disabled={verifying || !phone}>{verifying ? "Creating challenge…" : "Send verification code"}</button>{otpSent && <div><label>6-digit code<input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label><button type="button" onClick={verifyOtp} disabled={verifying || otp.length !== 6}>{verifying ? "Verifying…" : "Verify phone"}</button></div>}</div>}{message && <p className="session-message" role="status">{message}</p>}</section></main>;
}
