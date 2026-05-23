"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Invalid email or password.",
  "Email not confirmed": "Please confirm your email first.",
  "Too many requests": "Too many attempts. Please wait a moment.",
};

export default function AdminLoginPage() {
  const router = useRouter();
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
      // Check role — must be admin, editor, or author
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

      router.push("/admin");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6" dir="ltr">

      <div className="w-full max-w-sm">

        {/* Logo + lock icon */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <Image
            src="/logo.svg"
            alt="Merihaanaa"
            width={120}
            height={40}
            className="dark:invert"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.png";
            }}
          />
          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
            <Lock size={11} className="text-muted-foreground" />
            <span className="font-body text-xs text-muted-foreground font-medium">
              Admin Access
            </span>
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border p-8">

          <h1 className="font-display text-xl text-foreground text-center mb-1">
            Sign in
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            Merihaanaa editorial team only
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-xs font-bold text-muted-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div>
              <label className="font-body text-xs font-bold text-muted-foreground block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-body text-sm font-bold mt-2"
            >
              {loading ? "Signing in..." : "Sign in →"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a
            href="/"
            className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← merihaanaa.com
          </a>
        </div>
      </div>
    </div>
  );
}