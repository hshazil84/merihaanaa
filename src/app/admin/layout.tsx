"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import type { UserProfile } from "@/types";

const NAV = [
  {
    section: "ލިޔުންތައް",
    items: [
      { href: "/admin",               label: "ޑޭޝްބޯޑް",        icon: LayoutDashboard },
      { href: "/admin/articles",      label: "ހުރިހާ ލިޔުން",    icon: FileText },
      { href: "/admin/articles/new",  label: "އާ ލިޔުން",        icon: FilePlus },
    ],
  },
  {
    section: "ހޯމްޕޭޖް",
    items: [
      { href: "/admin/homepage", label: "ލޭއައުޓް", icon: LayoutTemplate },
    ],
  },
  {
    section: "ވީޑިއޯ",
    items: [
      { href: "/admin/videos", label: "ވީޑިއޯތައް", icon: Video },
      { href: "/admin/series", label: "ސީރީސް",     icon: Clapperboard },
    ],
  },
  {
    section: "ޕޮޑްކާސްޓް",
    items: [
      { href: "/admin/podcast", label: "ޕޮޑްކާސްޓް", icon: Mic },
    ],
  },
  {
    section: "ކޮމިއުނިޓީ",
    items: [
      { href: "/admin/comments",     label: "ކޮމެންޓް",       icon: MessageSquare },
      { href: "/admin/subscribers",  label: "ސަބްސްކްރައިބަރ", icon: Mail },
    ],
  },
  {
    section: "ތިލަ",
    items: [
      { href: "/admin/authors",  label: "ލިޔުންތެރިން", icon: Users },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin:  "ތިލަ",
  editor: "އެޑިޓަރ",
  author: "ލިޔުންތެރިޔާ",
  reader: "ކިޔުންތެރިޔާ",
};

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin":               "ޑޭޝްބޯޑް",
  "/admin/articles":      "ލިޔުންތައް",
  "/admin/articles/new":  "އާ ލިޔުން",
  "/admin/homepage":      "ހޯމްޕޭޖް",
  "/admin/videos":        "ވީޑިއޯ",
  "/admin/series":        "ސީރީސް",
  "/admin/podcast":       "ޕޮޑްކާސްޓް",
  "/admin/comments":      "ކޮމެންޓް",
  "/admin/subscribers":   "ސަބްސްކްރައިބަރ",
  "/admin/authors":       "ލިޔުންތެރިން",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile || !["author","editor","admin"].includes(profile.role)) {
        router.push("/"); return;
      }
      setUser(profile);
      setLoading(false);
    };
    init();
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

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

  const breadcrumb = BREADCRUMB_MAP[pathname] || "ތިލަ";

  return (
    <div className="h-screen flex overflow-hidden bg-muted/30">

      {/* ── SIDEBAR ── */}
      <aside className={`
        ${sidebarOpen ? "w-56" : "w-0 overflow-hidden"}
        flex-shrink-0 bg-background border-l border-border
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-foreground hover:opacity-70 transition-opacity">
            މެރިހާނާ
          </Link>
          <Badge variant="secondary" className="font-body text-[10px]">ތިލަ</Badge>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map((section, si) => (
            <div key={section.section} className={si > 0 ? "mt-4" : ""}>
              <p className="px-3 mb-1 font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                {section.section}
              </p>
              {section.items.map((item) => {
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

        <Separator />

        {/* User */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="font-body text-xs bg-muted-foreground/20">
                    {user?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs font-semibold text-foreground truncate">
                    {user?.full_name || "ނަމެއްނެތް"}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    {ROLE_LABELS[user?.role || "reader"]}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-body">
              <DropdownMenuItem onClick={signOut} className="text-destructive gap-2">
                <LogOut size={13} />
                ލޮގްއައުޓް
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-12 flex-shrink-0 bg-background border-b border-border flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8">
              <Menu size={15} />
            </Button>
            <div className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
              <span>ތިލަ</span>
              <ChevronRight size={13} />
              <span className="text-foreground font-semibold">{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark} className="h-8 w-8">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
            <Link href="/admin/articles/new">
              <Button size="sm" className="font-body text-xs gap-1.5 h-8">
                <FilePlus size={13} />
                އާ ލިޔުން
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// Local Badge import for logo area
function Badge({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground ${className}`}>
      {children}
    </span>
  );
}
