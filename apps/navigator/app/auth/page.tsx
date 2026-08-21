"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setMessage(mode === "signin" ? "Signed in successfully." : "Account created. Check your email if confirmation is enabled.");
  }

  return (
    <main className="shell auth-shell">
      <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode</span></div><a href="/">← Back</a></nav>
      <section className="auth-card">
        <p className="eyebrow">SHADECODE · ACCOUNT</p>
        <h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
        <p className="subhead">Your account is the boundary between simulation and real money operations.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        {message && <p className="session-message" role="status">{message}</p>}
        <button className="link-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>{mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  );
}
