"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
      else if (active) setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });
      if (result.error) throw result.error;
      if (result.data.session) {
        router.replace("/");
        router.refresh();
        return;
      }
      setMessage(mode === "signup"
        ? "Account created. Check your email and open the confirmation link to finish signing in."
        : "Signed in, but no session was returned. Please try again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) return <main className="shell auth-shell"><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY</p><h1>Checking your session…</h1><p className="subhead">Please wait.</p></section></main>;

  return (
    <main className="shell auth-shell">
      <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode Money</span></div></nav>
      <section className="auth-card">
        <p className="eyebrow">SHADECODE · MONEY</p>
        <h1>{mode === "signin" ? "Welcome back." : "Create your Shadecode Money account."}</h1>
        <p className="subhead">{mode === "signin" ? "Sign in to your private money workspace." : "Create your account first. Phone verification comes after sign-in."}</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create account"}</button>
        </form>
        {message && <p className="session-message" role="status">{message}</p>}
        <button className="link-button" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>{mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  );
}
