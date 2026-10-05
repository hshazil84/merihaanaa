"use client";
// Tracks the signed-in Supabase user (name + avatar) for the public site nav.

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AuthUser = { id: string; name: string; avatar: string | null };

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load(userId: string | null) {
      if (!userId) {
        if (!cancelled) { setUser(null); setReady(true); }
        return;
      }
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, avatar")
        .eq("id", userId)
        .maybeSingle();
      if (!cancelled) {
        setUser({ id: userId, name: profile?.full_name || "", avatar: profile?.avatar ?? null });
        setReady(true);
      }
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: don't call supabase from inside the auth callback synchronously
      setTimeout(() => load(session?.user?.id ?? null), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}
