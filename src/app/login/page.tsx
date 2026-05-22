"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check role — if admin/editor/author redirect to admin
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", (await supabase.auth.getUser()).data.user?.id!)
          .single();

        if (profile && ["admin", "editor", "author"].includes(profile.role)) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) throw error;

        setSuccess("ރެޖިސްޓްރޭޝަން ވީ! ހިތްހަމަ ޖެހިލި. ތިމެއިލް ޗެކްކޮށްލާ.");
      }
    } catch (err: any) {
      // Translate common errors to Thaana
      const errorMap: Record<string, string> = {
        "Invalid login credentials":  "އީމެއިލް ނުވަތަ ޕާސްވޯޑް ދިމާ ނުވި",
        "Email not confirmed":         "ތިމެއިލް ކޮންފަރމްކޮށްލާ",
        "User already registered":     "މި އީމެއިލް ރެޖިސްޓާ ވެފައިވޭ",
        "Password should be at least 6 characters": "ޕާސްވޯޑް މަދުވެގެން 6 ކެރެކްޓަރ ހިމެނެން ޖެހޭ",
      };
      setError(errorMap[err.message] || "ކޮންމެވެސް ގޯހެއް ދިމާވި. އަލުން ތިލަ ކޮށްލާ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <Link
        href="/"
        className="font-display text-2xl text-black dark:text-white mb-10 hover:opacity-70 transition-opacity"
      >
        މެރިހާނާ
      </Link>

      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-8">

          {/* Icon */}
          <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="font-display text-xl text-white dark:text-black">
              މ
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-xl text-black dark:text-white text-center mb-2">
            {mode === "login" ? "ޚޮޝްއާމަދީ" : "ކިޔުންތެރިއަކަށްވޭ"}
          </h1>
          <p className="font-body text-sm text-neutral-400 text-center mb-8">
            {mode === "login"
              ? "ތިޔަ ހިތްވަރުގަދަ ކިޔުންތެރިއެއް"
              : "ދިވެހި ކިޔުންތެރި ކޮމިއުނިޓީ"
            }
          </p>

          {/* Mode toggle */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`
                flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all
                ${mode === "login"
                  ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm"
                  : "text-neutral-500"
                }
              `}
            >
              ވަދެލާ
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`
                flex-1 py-2 rounded-lg font-body text-sm font-bold transition-all
                ${mode === "register"
                  ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm"
                  : "text-neutral-500"
                }
              `}
            >
              ރެޖިސްޓާ
            </button>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl">
              <p className="font-body text-sm text-red-700 dark:text-red-400">{error}</p>
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
                <label className="block font-body text-xs font-bold text-neutral-500 mb-2">
                  ފުރިހަމަ ނަން
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ތިބޭފުޅާ ނަން"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-body text-sm text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block font-body text-xs font-bold text-neutral-500 mb-2">
                އީމެއިލް
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                dir="ltr"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-body text-sm text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors text-left"
              />
            </div>

            <div>
              <label className="block font-body text-xs font-bold text-neutral-500 mb-2">
                ޕާސްވޯޑް
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-body text-sm text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              />
              {mode === "login" && (
                <button
                  type="button"
                  className="mt-2 font-body text-xs text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  ޕާސްވޯޑް ހަނދާން ނެތުނީތަ؟
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-body text-sm font-bold hover:opacity-85 disabled:opacity-40 transition-opacity mt-2"
            >
              {loading
                ? "ލޯޑްވަނީ..."
                : mode === "login" ? "ވަދެލާ ←" : "ރެޖިސްޓާ ←"
              }
            </button>
          </form>

          {mode === "register" && (
            <p className="font-body text-2xs text-neutral-400 text-center mt-6 leading-relaxed">
              ރެޖިސްޓާ ކުރުމުން ޕްރައިވަސީ ޕޮލިސީ
              <br />
              އަދި ޓާމްސް ގަބޫލު ކޮށްލެވޭ
            </p>
          )}
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="font-body text-sm text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ← ސައިޓަށް ދޭ
          </Link>
        </div>
      </div>
    </div>
  );
}
