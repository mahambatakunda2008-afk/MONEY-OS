"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase";

export default function HomeGate() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      router.replace(data.user ? "/dashboard" : "/auth");
    });
    return () => { active = false; };
  }, [router]);
  return <main className="shell auth-shell"><section className="auth-card"><p className="eyebrow">SHADECODE · MONEY</p><h1>Securing your workspace…</h1><p className="subhead">Checking your signed-in session.</p></section></main>;
}
