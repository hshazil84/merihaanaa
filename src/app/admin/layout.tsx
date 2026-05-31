"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  LayoutTemplate,
  Video,
  Clapperboard,
  Mic,
  MessageSquare,
  Mail,
  Users,
  Moon,
  Sun,
  LogOut,
  Menu,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import type { UserProfile } from "@/types";

const NAV_GROUPS = [
  [
    { href: "/admin",              label: "ޑޭޝްބޯޑް",        icon: LayoutDashboard },
    { href: "/admin/articles",     label: "ހުރިހާ ލިޔުން",    icon: FileText },
    { href: "/admin/articles/new", label: "އާ ލިޔުން",        icon: FilePlus },
    { href: "/admin/media",        label: "މީޑިއާ",            icon: ImageIcon },
  ],
  [
    { href: "/admin/homepage",     label: "ލޭއައުޓް",         icon: LayoutTemplate },
  ],
  [
    { href: "/admin/videos",       label: "ވީޑިއޯތައް",       icon: Video },
    { href: "/admin/series",       label: "ސީރީސް",            icon: Clapperboard },
    { href: "/admin/podcast",      label: "ޕޮޑްކާސްޓް",       icon: Mic },
  ],
  [
    { href: "/admin/comments",     label: "ކޮމެންޓް",         icon: MessageSquare },
    { href: "/admin/subscribers",  label: "ސަބްސްކްރައިބަރ",  icon: Mail },
    { href: "/admin/authors",      label: "ލިޔުންތެރިން",      icon: Users },
  ],
];

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin":              "ޑޭޝްބޯޑް",
  "/admin/articles":     "ލިޔުންތައް",
  "/admin/articles/new": "އާ ލިޔުން",
  "/admin/media":        "މީޑިއާ",
  "/admin/homepage":     "ހޯމްޕޭޖް",
  "/admin/videos":       "ވީޑިއޯ",
  "/admin/series":       "ސީރީސް",
  "/admin/podcast":      "ޕޮޑްކާސްޓް",
  "/admin/comments":     "ކޮމެންޓް",
  "/admin/subscribers":  "ސަބްސްކްރައިބަރ",
  "/admin/authors":      "ލިޔުންތެރިން",
};

const ROLE_LABELS: Record<string, string> = {
  admin:  "އެޑްމިން",
  editor: "އެޑިޓަރ",
  author: "ލިޔުންތެރިޔާ",
  reader: "ކިޔުންތެރިޔާ",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser]               = useState<UserProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark]               = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("user_profiles").select("*").eq("id", session.user.id).single();

      if (!profile || !["author", "editor", "admin"].includes(profile.role)) {
        router.push("/"); return;
      }
      setUser(profile);
      setLoading(false);
    };
    init();
    setDark(document.documentElement.classList.contains("dark"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("merihaanaa-theme", isDark ? "dark" : "light");
    setDark(isDark);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="font-body text-muted-foreground text-sm">ލޯޑްވަނީ...</p>
      </div>
    );
  }

  const breadcrumb = BREADCRUMB_MAP[pathname] || "އެޑްމިން";

  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">

      {/* ── SIDEBAR ── */}
      <aside className={`
        ${sidebarOpen ? "w-52" : "w-0 overflow-hidden"}
        flex-shrink-0 bg-background border-l border-border
        flex flex-col transition-all duration-300 ease-in-out
      `}>

        {/* Logo */}
        <div className="h-12 flex-shrink-0 flex items-center px-4 border-b border-border">
          <Link href="/" className="flex items-center hover:opacity-70 transition-opacity">
            <Image
              src="/logo.png"
              alt="logo"
              width={110}
              height={32}
              className="h-6 w-auto object-contain dark:invert"
              priority
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="mx-2 my-2 border-t border-border" />}
              {group.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5
                      font-body text-sm transition-all duration-150 cursor-pointer
                      ${isActive
                        ? "bg-foreground text-background font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}>
                      <Icon size={14} className="flex-shrink-0" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="font-body text-[10px] bg-muted-foreground/20">
                    {user?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-semibold text-foreground truncate leading-tight">
                    {user?.full_name || "ނަމެއްނެތް"}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground leading-tight">
                    {ROLE_LABELS[user?.role || "reader"]}
                  </p>
                </div>
                <LogOut size={12} className="text-muted-foreground flex-shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 font-body">
              <DropdownMenuItem onClick={signOut} className="text-destructive gap-2 text-xs">
                <LogOut size={12} />
                ލޮގްއައުޓް
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header — same height as sidebar logo row */}
        <header className="h-12 flex-shrink-0 bg-background border-b border-border flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Menu size={15} />
            </button>
            <div className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
              <span>އެޑްމިން</span>
              <ChevronRight size={12} className="opacity-40" />
              <span className="text-foreground font-semibold">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <Link href="/admin/articles/new">
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity">
                <FilePlus size={13} />
                އާ ލިޔުން
              </button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
