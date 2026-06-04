"use client";
// src/app/admin/page.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const COUNTRY_FLAGS: Record<string, string> = {
  MV: "🇲🇻", SA: "🇸🇦", AE: "🇦🇪", GB: "🇬🇧", US: "🇺🇸",
  IN: "🇮🇳", AU: "🇦🇺", SG: "🇸🇬", QA: "🇶🇦", KW: "🇰🇼",
  PK: "🇵🇰", MY: "🇲🇾", LK: "🇱🇰", DE: "🇩🇪", FR: "🇫🇷",
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function MetricCard({ label, value, sub, subColor }: {
  label: string; value: string | number; sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="text-[11px] text-muted-foreground mb-1.5 font-body" style={{ direction: "rtl", fontFamily: "MVTypewriter, serif" }}>
        {label}
      </p>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {sub && (
        <p className="text-[11px] mt-1 font-body" style={{ color: subColor ?? "var(--muted-foreground)", fontFamily: "MVTypewriter, serif" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = createClient();

  const [viewStats, setViewStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, drafts: 0, comments: 0, subscribers: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        viewsRes,
        { data: arts },
        { count: totalArts },
        { count: drafts },
        { count: comments },
        { count: subscribers },
        { count: videos },
      ] = await Promise.all([
        fetch("/api/views").then(r => r.json()),
        supabase.from("articles").select("id, title, status, published_at, category:categories!category_id(name)").order("created_at", { ascending: false }).limit(8),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscribers").select("*", { count: "exact", head: true }),
        supabase.from("reels").select("*", { count: "exact", head: true }),
      ]);

      setViewStats(viewsRes);
      setArticles(arts ?? []);
      setCounts({
        total: totalArts ?? 0,
        drafts: drafts ?? 0,
        comments: comments ?? 0,
        subscribers: subscribers ?? 0,
        videos: videos ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const totalViews = viewStats?.total ?? 0;
  const maxCountry = viewStats?.topCountries?.[0]?.count ?? 1;
  const totalDevices = (viewStats?.deviceCounts?.mobile ?? 0) + (viewStats?.deviceCounts?.desktop ?? 0) + (viewStats?.deviceCounts?.tablet ?? 0);
  const mobilePct = totalDevices > 0 ? Math.round(((viewStats?.deviceCounts?.mobile ?? 0) / totalDevices) * 100) : 0;
  const desktopPct = totalDevices > 0 ? Math.round(((viewStats?.deviceCounts?.desktop ?? 0) / totalDevices) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-body text-sm" style={{ fontFamily: "MVTypewriter, serif" }}>
        ލޯޑްވަނީ...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            ޑޭޝްބޯޑް
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
      </div>

      {/* Views metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="ޖުމްލަ ވިއު" value={fmt(totalViews)} />
        <MetricCard label="މިއަދު" value={fmt(viewStats?.today ?? 0)} />
        <MetricCard label="މިހަފްތާ" value={fmt(viewStats?.week ?? 0)} />
        <MetricCard label="މި މަހު" value={fmt(viewStats?.month ?? 0)} />
      </div>

      {/* Content metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="ލިޔުންތައް"
          value={counts.total}
          sub={`${counts.drafts} ޑްރާފްޓް`}
        />
        <MetricCard label="ސަބްސްކްރައިބަރ" value={counts.subscribers} />
        <MetricCard
          label="ކޮމެންޓް"
          value={counts.comments}
          sub={counts.comments > 0 ? "ރިވިއު ކުރޭ" : undefined}
          subColor={counts.comments > 0 ? "#854F0B" : undefined}
        />
        <MetricCard label="ވީޑިއޯ" value={counts.videos} />
      </div>

      {/* Country + Top articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country breakdown */}
        <div className="border border-border rounded-xl p-5 bg-background">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4" style={{ fontFamily: "MVTypewriter, serif" }}>
            ގައުމުތަކުން ބެލި ގޮތް
          </p>
          {viewStats?.topCountries?.length > 0 ? (
            <div className="space-y-3">
              {viewStats.topCountries.map((c: any) => (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{COUNTRY_FLAGS[c.code] ?? "🌐"}</span>
                  <span className="text-xs text-muted-foreground w-6">{c.code}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${Math.round((c.count / maxCountry) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{fmt(c.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ތަފްސީލެއް ނެތް</p>
          )}

          {/* Device split */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3" style={{ fontFamily: "MVTypewriter, serif" }}>
              ޑިވައިސް
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right" style={{ fontFamily: "MVTypewriter, serif" }}>މޮބައިލް</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${mobilePct}%`, backgroundColor: "#378ADD" }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{mobilePct}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 text-right" style={{ fontFamily: "MVTypewriter, serif" }}>ޑެސްކްޓޮޕް</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${desktopPct}%`, backgroundColor: "#7F77DD" }} />
                </div>
                <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{desktopPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top articles */}
        <div className="border border-border rounded-xl p-5 bg-background">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4" style={{ fontFamily: "MVTypewriter, serif" }}>
            އެންމެ ގިނައިން ބެލި ލިޔުންތައް
          </p>
          {viewStats?.topArticles?.length > 0 ? (
            <div className="space-y-0">
              {viewStats.topArticles.map((a: any, i: number) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <span className="text-xs font-semibold text-muted-foreground w-5">{i + 1}</span>
                  <p className="flex-1 text-sm text-foreground line-clamp-2 leading-snug" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                    {a.title}
                  </p>
                  <span className="text-xs text-muted-foreground tabular-nums flex-none">{fmt(a.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ތަފްސީލެއް ނެތް</p>
          )}
        </div>
      </div>

      {/* Recent articles */}
      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "MVTypewriter, serif" }}>
            ފަހުގެ ލިޔުންތައް
          </p>
          <Link href="/admin/articles" className="text-xs text-muted-foreground hover:text-foreground transition-colors" style={{ fontFamily: "MVTypewriter, serif" }}>
            ހުރިހާ ލިޔުން ←
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-right">
              <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ސުރުޚީ</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground hidden md:table-cell" style={{ fontFamily: "MVTypewriter, serif" }}>ކެޓަގަރީ</th>
              <th className="px-5 py-2.5 text-[11px] font-medium text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ހާލަތު</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/admin/articles/${a.id}`} className="hover:opacity-70 transition-opacity">
                    <p className="text-sm text-foreground line-clamp-1" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                      {a.title}
                    </p>
                  </Link>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {a.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>
                      {a.category.name}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    a.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`} style={{ fontFamily: "MVTypewriter, serif" }}>
                    {a.status === "published" ? "ލައިވް" : "ޑްރާފްޓް"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
