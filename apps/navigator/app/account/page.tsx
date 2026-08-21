"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type Profile = { user_id: string; display_name: string | null; phone_e164: string | null; phone_verified_at: string | null; country_code: string | null; email_verified_at: string | null };

function normalizePhone(value: string) {
  return value.trim().replace(/[\s()-]/g, "");
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("ZW");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
    const normalized = normalizePhone(phone);
    const payload = { user_id: auth.user.id, display_name: displayName.trim() || null, phone_e164: normalized || null, country_code: country.trim().toUpperCase() || null };
    const { data, error } = await supabase.from("money_profiles").upsert(payload, { onConflict: "user_id" }).select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").single();
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setProfile(data); setPhone(data.phone_e164 ?? ""); setMessage(data.phone_verified_at ? "Profile saved. Phone is verified." : "Profile saved. Verify the phone before using it as a trusted money identifier.");
  }

  async function sendOtp() {
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9][0-9]{6,14}$/.test(normalized)) { setMessage("Enter a valid E.164 phone number, for example +263771234567."); return; }
    setVerifying(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setVerifying(false);
    if (error) { setMessage(error.message); return; }
    setOtpSent(true); setMessage("Verification code sent. Enter the code you received.");
  }

  async function verifyOtp() {
    const normalized = normalizePhone(phone);
    if (!/^\d{6}$/.test(otp)) { setMessage("Enter the 6-digit verification code."); return; }
    setVerifying(true); setMessage(null);
    const supabase = createClient();
    const { data: auth, error } = await supabase.auth.verifyOtp({ phone: normalized, token: otp, type: "sms" });
    if (error || !auth.user) { setVerifying(false); setMessage(error?.message ?? "Phone verification failed."); return; }
    const { data, error: profileError } = await supabase.from("money_profiles").upsert({ user_id: auth.user.id, phone_e164: normalized, phone_verified_at: new Date().toISOString(), country_code: country.trim().toUpperCase() || null }, { onConflict: "user_id" }).select("user_id,display_name,phone_e164,phone_verified_at,country_code,email_verified_at").single();
    setVerifying(false);
    if (profileError) { setMessage(profileError.message); return; }
    setProfile(data); setOtpSent(false); setOtp(""); setMessage("Phone verified successfully.");
  }

  if (busy) return <main className="shell"><p>Loading account…</p></main>;
  return <main className="shell"><nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/">← Navigator</a></nav><section className="auth-card"><p className="eyebrow">SHADECODE · IDENTITY</p><h1>Your account.</h1><p className="subhead">Keep your identity details current. Phone numbers must be verified before they become trusted money identifiers.</p><form onSubmit={save}><label>Display name<input value={displayName} onChange={e => setDisplayName(e.target.value)} /></label><label>Phone number (E.164)<input inputMode="tel" placeholder="+263771234567" value={phone} onChange={e => setPhone(e.target.value)} /></label><label>Country code<input maxLength={2} placeholder="ZW" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} /></label><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></form>{profile?.phone_verified_at ? <div className="session-message">✓ Phone verified</div> : <div><div className="session-message">○ Phone not verified</div><button type="button" onClick={sendOtp} disabled={verifying || !phone}>{verifying ? "Sending…" : "Send verification code"}</button>{otpSent && <div><label>6-digit code<input inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} /></label><button type="button" onClick={verifyOtp} disabled={verifying || otp.length !== 6}>{verifying ? "Verifying…" : "Verify phone"}</button></div>}</div>}{message && <p className="session-message" role="status">{message}</p>}</section></main>;
}
