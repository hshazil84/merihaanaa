"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register" | "forgot";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Invalid email or password. Please try again.",
  "Email not confirmed": "Please confirm your email before signing in.",
  "User already registered": "An account with this email already exists.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
};

const PJS = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

export default function ReaderLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => { setError(null); setSuccess(null); };
  const switchMode = (m: Mode) => { setMode(m); reset(); };

  const handleLogin = async () => {
    setLoading(true); reset();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(ERROR_MAP[authError.message] || authError.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); reset();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (authError) {
      setError(ERROR_MAP[authError.message] || authError.message);
    } else {
      setSuccess("Account created! You can now sign in.");
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); reset();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (authError) {
      setError("Failed to send reset email. Please try again.");
    } else {
      setSuccess("Password reset link sent to your email.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "register") handleRegister();
    else handleForgot();
  };

  return (
    <div
      className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6"
      dir="ltr"
      style={PJS}
    >
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.svg"
          alt="Merihaanaa"
          width={140}
          height={48}
          className="dark:invert"
          onError={(e) => { (e.target as HTMLImageElement).src = "/logo.png"; }}
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-background rounded-2xl border border-border p-8">

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground text-center mb-1" style={PJS}>
            {mode === "login"    ? "Welcome back" :
             mode === "register" ? "Create account" :
             "Reset password"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-8" style={PJS}>
            {mode === "login"    ? "Sign in to your Merihaanaa account" :
             mode === "register" ? "Join the Merihaanaa reader community" :
             "Enter your email and we'll send a reset link"}
          </p>

          {/* Mode toggle */}
          {mode !== "forgot" && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={PJS}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                style={PJS}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive text-center" style={PJS}>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl">
              <p className="text-sm text-green-700 dark:text-green-400 text-center" style={PJS}>{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div key={mode} className="auth-form-content space-y-4">

              {mode === "register" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5" style={PJS}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    style={PJS}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>
              )}

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
                  style={PJS}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {mode !== "forgot" && (
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
                    style={PJS}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      style={PJS}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-sm font-semibold"
                style={PJS}
              >
                {loading ? "Please wait..." :
                 mode === "login"    ? "Sign in →" :
                 mode === "register" ? "Create account →" :
                 "Send reset link →"}
              </Button>

              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  style={PJS}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  ← Back to sign in
                </button>
              )}

            </div>
          </form>

          {mode === "register" && (
            <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed" style={PJS}>
              By registering you agree to our Privacy Policy
              <br />and Terms of Service
            </p>
          )}
        </div>

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