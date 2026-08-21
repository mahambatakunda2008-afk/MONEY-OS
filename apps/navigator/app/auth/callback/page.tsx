"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const supabase = createClient();
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("Your confirmation link has expired or is invalid. Please sign in again.");
        router.replace("/");
        router.refresh();
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "We could not complete sign-in.");
      }
    })();
    return () => { active = false; };
  }, [router]);

  return <main className="shell auth-shell"><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY</p><h1>{message === "Finishing sign-in…" ? "Finishing sign-in…" : "Sign-in link issue"}</h1><p className="subhead">{message}</p>{message !== "Finishing sign-in…" && <a className="link-button" href="/auth">Return to sign in</a>}</section></main>;
}
