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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/account");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/account");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signin") {
      router.replace("/account");
      router.refresh();
      return;
    }
    if (result.data.session) {
      router.replace("/account");
      router.refresh();
    } else {
      setMessage("Account created. Check your email to confirm your account, then return here to sign in.");
    }
  }

  return (
    <main className="shell auth-shell">
      <nav className="nav"><div className="brand"><span className="brand-mark">S</span><span>Shadecode Money</span></div><a href="/">← Home</a></nav>
      <section className="auth-card">
        <p className="eyebrow">SHADECODE · MONEY</p>
        <h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
        <p className="subhead">Sign in to access your private money workspace. Your account is the boundary between simulation and money operations.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        {message && <p className="session-message" role="status">{message}</p>}
        <button className="link-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>{mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  );
}
