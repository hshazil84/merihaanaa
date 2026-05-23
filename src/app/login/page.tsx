"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register" | "forgot";

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials":    "އީމެއިލް ނުވަތަ ޕާސްވޯޑް ދިމާ ނުވި",
  "Email not confirmed":           "ތިމެއިލް ކޮންފަރމްކޮށްލާ",
  "User already registered":       "މި އީމެއިލް ރެޖިސްޓާ ވެފައިވޭ",
  "Password should be at least 6 characters": "ޕާސްވޯޑް މަދުވެގެން 2 ކެރެކްޓަރ ހިމެނެން ޖެހޭ",
};

export default function LoginPage() {
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

  const handleLogin = async () => {
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(ERROR_MAP[error.message] || "ކޮންމެވެސް ގޯހެއް ދިމާވި. އަލުން ލޯޑްކޮށްލާ.");
      setLoading(false);
      return;
    }
    // Check role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile && ["admin","editor","author"].includes(profile.role)) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); reset();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(ERROR_MAP[error.message] || "ކޮންމެވެސް ގޯހެއް ދިމާވެއްޖެ. އަލުން ލޯޑްކޮށްލާ.");
    } else {
      setSuccess("ރެޖިސްޓްރޭޝަން ކޮންފާމް! މެއިލް ޗެކްކޮށްލާ.");
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("މެއިލް ލިޔެލާ"); return; }
    setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError("ތިމެއިލް ފޮނުވުން ނާކާމިޔާބު. އަލުން ފޮނުވާ.");
    } else {
      setSuccess("ޕާސްވޯޑް ރީސެޓް ލިންކް ތިމެއިލަށް ފޮނުވިއްޖެ.");
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
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/logo.svg"
          alt="މެރިހާނާ"
          width={140}
          height={48}
          className="dark:invert"
          onError={(e) => {
            // Fallback to PNG if SVG fails
            (e.target as HTMLImageElement).src = "/logo.png";
          }}
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-background rounded-2xl border border-border p-8">

          {/* Title */}
          <h1 className="font-display text-xl text-foreground text-center mb-1">
            {mode === "login"  ? "ލޮގިން" :
             mode === "register" ? "ކިޔުންތެރިއަކަށްވޭ" :
             "ޕާސްވޯޑް ރީސެޓް"}
          </h1>
          <p className="font-body text-sm text-muted-foreground text-center mb-8">
            {mode === "login"    ? "މެރިހާނާގެ ކިޔުންތެރިންނަށް މަރުހަބާ" :
             mode === "register" ? "ލިޔުންތެރިން" :
             "ލިންކް ފޮނުވުމަށް މެއިލް އެއްދީ"}
          </p>

          {/* Mode toggle — only login/register */}
          {mode !== "forgot" && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode("login"); reset(); }}
                className={`flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all
                  ${mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                  }`}
              >
                ވަދެލާ
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); reset(); }}
                className={`flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all
                  ${mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                  }`}
              >
                ރެޖިސްޓާ
              </button>
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="font-body text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-xl">
              <p className="font-body text-sm text-green-700 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="font-body text-xs font-bold text-muted-foreground block mb-1.5">
                  ފުރިހަމަ ނަން
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ތިބޭފުޅާގެ ނަން"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}

            <div>
              <label className="font-body text-xs font-bold text-muted-foreground block mb-1.5">
                އީމެއިލް
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                dir="ltr"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors text-left"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="font-body text-xs font-bold text-muted-foreground block mb-1.5">
                  ޕާސްވޯޑް
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); reset(); }}
                    className="mt-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ޕާސްވޯޑް ހަނދާން ނެތުނީތަ؟
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-body text-sm font-bold mt-2"
            >
              {loading ? "ލޯޑްވަނީ..." :
               mode === "login"    ? "ވަދެލާ ←" :
               mode === "register" ? "ރެޖިސްޓާ ←" :
               "ލިންކް ފޮނުވާ ←"}
            </Button>

            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => { setMode("login"); reset(); }}
                className="w-full font-body text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← ލޮގިން ޕޭޖަށް ދޭ
              </button>
            )}
          </form>

          {mode === "register" && (
            <p className="font-body text-xs text-muted-foreground text-center mt-6 leading-relaxed">
              ރެޖިސްޓާ ކުރުމުން ޕްރައިވަސީ ޕޮލިސީ
              <br />
              އަދި ޓާމްސް ގަބޫލު ކޮށްލުމަށް
            </p>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← ސައިޓަށް ދިޔުމަށް
          </a>
        </div>
      </div>
    </div>
  );
}
