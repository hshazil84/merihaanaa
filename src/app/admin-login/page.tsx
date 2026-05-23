"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Invalid email or password.",
  "Email not confirmed": "Please confirm your email first.",
  "Too many requests": "Too many attempts. Please wait a moment.",
};

const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

export default function AdminLoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(ERROR_MAP[authError.message] || authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (!profile || !["admin", "editor", "author"].includes(profile.role)) {
        await supabase.auth.signOut();
        setError("You don't have access to the admin panel.");
        setLoading(false);
        return;
      }

      // Hard redirect — bypasses Next.js router
      window.location.href = "/admin";
      return;
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6"
      dir="ltr"
      style={PJS}
    >
      <div className="w-full max-w-sm">

        {/* Logo + badge */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image
            src="/logo.svg"
            alt="Merihaanaa"
            width={120}
            height={40}
            priority
            className="dark:invert"
            onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
          />
          <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1 rounded-full">
            <Lock size={10} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium" style={PJS}>
              Admin Access
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-background rounded-2xl border border-border p-8">
          <h1 className="text-xl font-bold text-foreground text-center mb-1" style={PJS}>
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8" style={PJS}>
            Merihaanaa editorial team only
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive text-center" style={PJS}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5" style={PJS}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                autoComplete="email"
                style={PJS}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5" style={PJS}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={PJS}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold"
              style={PJS}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </Button>
          </form>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            style={PJS}
          >
            ← merihaanaa.com
          </a>
        </div>
      </div>
    </div>
  );
}