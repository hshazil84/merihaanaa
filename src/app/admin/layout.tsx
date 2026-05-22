"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";

// ── SIDEBAR NAV ITEMS — all in Thaana ────────────────────

const NAV = [
  {
    section: "ލިޔުންތައް",
    items: [
      { href: "/admin", label: "ޑޭޝްބޯޑް", icon: "⊞" },
      { href: "/admin/articles", label: "ހުރިހާ ލިޔުން", icon: "▤" },
      { href: "/admin/articles/new", label: "އާ ލިޔުން", icon: "✎" },
    ],
  },
  {
    section: "ހޯމްޕޭޖް",
    items: [
      { href: "/admin/homepage", label: "ލޭއައުޓް ކޮންޓްރޯލް", icon: "⊡" },
    ],
  },
  {
    section: "ވީޑިއޯ",
    items: [
      { href: "/admin/videos", label: "ވީޑިއޯތައް", icon: "▶" },
      { href: "/admin/series", label: "ސީރީސް", icon: "≡" },
    ],
  },
  {
    section: "ޕޮޑްކާސްޓް",
    items: [
      { href: "/admin/podcast", label: "ޕޮޑްކާސްޓް", icon: "◎" },
    ],
  },
  {
    section: "ކޮމިއުނިޓީ",
    items: [
      { href: "/admin/comments", label: "ކޮމެންޓް", icon: "💬" },
      { href: "/admin/subscribers", label: "ސަބްސްކްރައިބަރ", icon: "✉" },
    ],
  },
  {
    section: "ތިލަ",
    items: [
      { href: "/admin/authors", label: "ލިޔުންތެރިން", icon: "◉" },
    ],
  },
];

// Editor-only nav (hidden from authors)
const EDITOR_NAV = [
  { href: "/admin/authors", label: "ލިޔުންތެރިން", icon: "◉" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile || !["author", "editor", "admin"].includes(profile.role)) {
        router.push("/");
        return;
      }

      setUser(profile);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="font-body text-neutral-400 text-sm">ލޯޑްވަނީ...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-50 dark:bg-neutral-900">

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          ${sidebarOpen ? "w-56" : "w-0 overflow-hidden"}
          flex-shrink-0 bg-white dark:bg-neutral-900
          border-l border-neutral-100 dark:border-neutral-800
          flex flex-col transition-all duration-300
        `}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <Link href="/" className="font-display text-lg text-black dark:text-white">
            މެރިހާނާ
          </Link>
          <span className="text-2xs font-body text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
            ތިލަ
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((section) => (
            <div key={section.section} className="mb-1">
              <div className="px-4 py-2 text-2xs font-body font-bold text-neutral-400 uppercase tracking-widest">
                {section.section}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2.5 px-4 py-2.5
                      font-body text-sm transition-all duration-150
                      border-r-2
                      ${isActive
                        ? "bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white font-bold border-r-black dark:border-r-white"
                        : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white border-r-transparent"
                      }
                    `}
                  >
                    <span className="text-sm w-4 text-center flex-shrink-0">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-body font-bold text-neutral-600 dark:text-neutral-400 flex-shrink-0">
              {user?.full_name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body text-sm font-bold text-black dark:text-white truncate">
                {user?.full_name || "ނަމެއްނެތް"}
              </div>
              <div className="font-body text-2xs text-neutral-400 capitalize">
                {
                  {
                    admin: "ތިލަ",
                    editor: "އެޑިޓަރ",
                    author: "ލިޔުންތެރިޔާ",
                    reader: "ކިޔުންތެރިޔާ",
                  }[user?.role || "reader"]
                }
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors text-xs font-body"
              title="ލޮގްއައުޓް"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-13 flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
            >
              ☰
            </button>
            {/* Breadcrumb */}
            <Breadcrumb pathname={pathname} />
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <DarkModeToggle />

            {/* New article shortcut */}
            <Link
              href="/admin/articles/new"
              className="font-body text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg hover:opacity-85 transition-opacity"
            >
              + އާ ލިޔުން
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── BREADCRUMB ────────────────────────────────────────────

function Breadcrumb({ pathname }: { pathname: string }) {
  const MAP: Record<string, string> = {
    "/admin":                 "ޑޭޝްބޯޑް",
    "/admin/articles":        "ލިޔުންތައް",
    "/admin/articles/new":    "އާ ލިޔުން",
    "/admin/homepage":        "ހޯމްޕޭޖް",
    "/admin/videos":          "ވީޑިއޯ",
    "/admin/series":          "ސީރީސް",
    "/admin/podcast":         "ޕޮޑްކާސްޓް",
    "/admin/comments":        "ކޮމެންޓް",
    "/admin/subscribers":     "ސަބްސްކްރައިބަރ",
    "/admin/authors":         "ލިޔުންތެރިން",
  };

  const label = MAP[pathname] || "ތިލަ";

  return (
    <div className="flex items-center gap-2 font-body text-sm">
      <span className="text-neutral-400">ތިލަ</span>
      <span className="text-neutral-300 dark:text-neutral-700">/</span>
      <span className="text-black dark:text-white font-bold">{label}</span>
    </div>
  );
}

// ── DARK MODE TOGGLE ──────────────────────────────────────

function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("merihaanaa-theme", isDark ? "dark" : "light");
    setDark(isDark);
  };

  return (
    <button
      onClick={toggle}
      className="text-neutral-400 hover:text-black dark:hover:text-white transition-colors text-base"
      title={dark ? "ލައިޓް" : "ޑާކް"}
    >
      {dark ? "☀" : "◑"}
    </button>
  );
}
