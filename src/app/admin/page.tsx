"use client";
// src/app/admin/page.tsx

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Eye, FileText, Mail, MessageSquare, Video, RefreshCw,
  BookOpen, Globe, Smartphone, Share2,
} from "lucide-react";

function getFlagEmoji(code: string | null): string {
  if (!code || code.length !== 2) return "🌐";
  const points = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}

const countryNameFormatter = new Intl.DisplayNames(["en"], { type: "region" });

function getCountryName(code: string | null): string {
  if (!code) return "ނޭނގޭ"; // "unknown" — please check
  try {
    return countryNameFormatter.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

// NOTE: Dhivehi wording below — please check, not confident in the phrasing
const SOURCE_LABELS: Record<string, string> = {
  facebook: "ފޭސްބުކް",
  instagram: "އިންސްޓަގްރާމް",
  facebook_instagram: "މެޓާ (ފޭސްބުކް/އިންސްޓަގްރާމް)",
  direct: "ސީދާ",
  other: "އެހެނިހެން",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#C13584",
  facebook_instagram: "#8B5CF6",
  direct: "#9CA3AF",
  other: "#D1D5DB",
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

function calcTrend(current: number, previous: number): { pct: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) {
    if (current === 0) return { pct: 0, direction: "flat" };
    return { pct: 100, direction: "up" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { pct, direction: "up" };
  if (pct < 0) return { pct: Math.abs(pct), direction: "down" };
  return { pct: 0, direction: "flat" };
}

function MetricCard({ label, value, icon: Icon, trend, sub, subColor }: {
  label: string; value: string | number; icon?: any;
  trend?: { pct: number; direction: "up" | "down" | "flat" };
  sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] text-muted-foreground font-body" style={{ direction: "rtl", fontFamily: "MVTypewriter, serif" }}>
          {label}
        </p>
        {Icon && <Icon size={13} className="text-muted-foreground/50 flex-none" />}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        {trend && trend.direction !== "flat" && (
          <span
            className={
              "text-[11px] font-medium tabular-nums " +
              (trend.direction === "up" ? "text-green-600" : "text-red-600")
            }
            dir="ltr"
          >
            {trend.direction === "up" ? "↑" : "↓"}{trend.pct}%
          </span>
        )}
      </div>
      {sub && (
        <p className="text-[11px] mt-1 font-body" style={{ color: subColor ?? "var(--muted-foreground)", fontFamily: "MVTypewriter, serif" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SourceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-sm" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
      <p className="text-xs text-foreground font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground">{fmt(item.value)} ވިއު</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest" style={{ fontFamily: "MVTypewriter, serif" }}>
      {children}
    </p>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={"animate-pulse bg-muted rounded-xl " + (className ?? "")} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-24" />)}
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}

export default function AdminDashboard() {
  const supabase = createClient();

  const [viewStats, setViewStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0, drafts: 0, comments: 0,
    subscribers: 0, subscribersToday: 0, subscribersYesterday: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [audienceTab, setAudienceTab] = useState<"country" | "device" | "source">("country");

  const load = async (background = false) => {
    if (background) setRefreshing(true);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);

    const [
      viewsRes,
      { data: arts },
      { count: totalArts },
      { count: drafts },
      { count: comments },
      { count: subscribers },
      { count: subscribersToday },
      { count: subscribersYesterday },
      { count: videos },
    ] = await Promise.all([
      fetch("/api/views").then(r => r.json()),
      supabase.from("articles").select("id, title, status, published_at, category:categories!category_id(name)").order("created_at", { ascending: false }).limit(8),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).gte("subscribed_at", todayMidnight.toISOString()),
      supabase.from("subscribers").select("*", { count: "exact", head: true }).gte("subscribed_at", yesterdayMidnight.toISOString()).lt("subscribed_at", todayMidnight.toISOString()),
      supabase.from("reels").select("*", { count: "exact", head: true }),
    ]);

    setViewStats(viewsRes);
    setArticles(arts ?? []);
    setCounts({
      total: totalArts ?? 0,
      drafts: drafts ?? 0,
      comments: comments ?? 0,
      subscribers: subscribers ?? 0,
      subscribersToday: subscribersToday ?? 0,
      subscribersYesterday: subscribersYesterday ?? 0,
      videos: videos ?? 0,
    });
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const poll = setInterval(() => load(true), 20000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = setInterval(() => {
      if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const totalViews = viewStats?.total ?? 0;
  const todayTrend = calcTrend(viewStats?.today ?? 0, viewStats?.yesterday ?? 0);
  const weekTrend = calcTrend(viewStats?.week ?? 0, viewStats?.prevWeek ?? 0);
  const monthTrend = calcTrend(viewStats?.month ?? 0, viewStats?.prevMonth ?? 0);
  const subscriberTrend = calcTrend(counts.subscribersToday, counts.subscribersYesterday);

  const maxCountry = viewStats?.topCountries?.[0]?.count ?? 1;
  const totalDevices = (viewStats?.deviceCounts?.mobile ?? 0) + (viewStats?.deviceCounts?.desktop ?? 0) + (viewStats?.deviceCounts?.tablet ?? 0);
  const mobilePct = totalDevices > 0 ? Math.round(((viewStats?.deviceCounts?.mobile ?? 0) / totalDevices) * 100) : 0;
  const desktopPct = totalDevices > 0 ? Math.round(((viewStats?.deviceCounts?.desktop ?? 0) / totalDevices) * 100) : 0;

  const sourceData = Object.entries(viewStats?.sourceCounts ?? {})
    .map(([key, value]) => ({
      key,
      name: SOURCE_LABELS[key] ?? key,
      value: value as number,
    }))
    .sort((a, b) => b.value - a.value);
  const totalSourceViews = sourceData.reduce((sum, s) => sum + s.value, 0);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            ޑޭޝްބޯޑް
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            {secondsAgo < 5 ? "އަދާހަމަ" : `${secondsAgo} ސިކުންތު ކުރިން`}
          </span>
          <button
            onClick={() => load(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Views metrics */}
      <div className="space-y-2">
        <SectionLabel>ބެލުންތައް</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="ޖުމްލަ ވިއު" value={fmt(totalViews)} icon={Eye} />
          <MetricCard label="މިއަދު" value={fmt(viewStats?.today ?? 0)} icon={Eye} trend={todayTrend} />
          <MetricCard label="މިހަފްތާ" value={fmt(viewStats?.week ?? 0)} icon={Eye} trend={weekTrend} />
          <MetricCard label="ފަހު 30 ދުވަސް" value={fmt(viewStats?.month ?? 0)} icon={Eye} trend={monthTrend} />
        </div>
      </div>

      {/* Audience + Top articles */}
      <div className="space-y-2">
        <SectionLabel>އޯޑިއަންސް</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Audience tabbed panel */}
          <div className="border border-border rounded-xl p-5 bg-background">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "MVTypewriter, serif" }}>
                އޯޑިއަންސް
              </p>
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                {[
                  { key: "country" as const, label: "ގައުމު", icon: Globe },
                  { key: "device" as const, label: "ޑިވައިސް", icon: Smartphone },
                  { key: "source" as const, label: "ޓްރެފިކް", icon: Share2 },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  const active = audienceTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setAudienceTab(tab.key)}
                      className={
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-colors " +
                        (active ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")
                      }
                      style={{ fontFamily: "MVTypewriter, serif" }}
                    >
                      <TabIcon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {audienceTab === "country" && (
              viewStats?.topCountries?.length > 0 ? (
                <div className="space-y-3">
                  {viewStats.topCountries.map((c: any) => (
                    <div key={c.code} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center flex-none">{getFlagEmoji(c.code)}</span>
                      <span className="text-xs text-muted-foreground flex-1 truncate" dir="ltr">
                        {getCountryName(c.code)}
                      </span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden flex-none">
                        <div
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${Math.round((c.count / maxCountry) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right flex-none">{fmt(c.count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ތަފްސީލެއް ނެތް</p>
              )
            )}

            {audienceTab === "device" && (
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
            )}

            {audienceTab === "source" && (
              sourceData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div style={{ width: 140, height: 140 }} className="flex-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={62}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {sourceData.map((entry) => (
                            <Cell key={entry.key} fill={SOURCE_COLORS[entry.key] ?? "#D1D5DB"} />
                          ))}
                        </Pie>
                        <Tooltip content={<SourceTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full space-y-2.5">
                    {sourceData.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ backgroundColor: SOURCE_COLORS[s.key] ?? "#D1D5DB" }} />
                          <span className="text-xs text-foreground truncate" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                            {s.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-none">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {totalSourceViews > 0 ? Math.round((s.value / totalSourceViews) * 100) : 0}%
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{fmt(s.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "MVTypewriter, serif" }}>ތަފްސީލެއް ނެތް</p>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content + Vaahaka metrics — merged into one row */}
      <div className="space-y-2">
        <SectionLabel>ކޮންޓެންޓް</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <MetricCard
            label="ލިޔުންތައް"
            value={counts.total}
            icon={FileText}
            sub={`${counts.drafts} ޑްރާފްޓް`}
          />
          <MetricCard
            label="ސަބްސްކްރައިބަރ"
            value={counts.subscribers}
            icon={Mail}
            trend={subscriberTrend}
          />
          <MetricCard
            label="ކޮމެންޓް"
            value={counts.comments}
            icon={MessageSquare}
            sub={counts.comments > 0 ? "ރިވިއު ކުރޭ" : undefined}
            subColor={counts.comments > 0 ? "#854F0B" : undefined}
          />
          <MetricCard label="ވީޑިއޯ" value={counts.videos} icon={Video} />
          <MetricCard label="ވާހަކަ - ޖުމްލަ" value={fmt(viewStats?.vaahakaStats?.total ?? 0)} icon={BookOpen} />
          <MetricCard label="ވާހަކަ - މިއަދު" value={fmt(viewStats?.vaahakaStats?.today ?? 0)} icon={BookOpen} />
          <MetricCard label="ވާހަކަ - މިހަފްތާ" value={fmt(viewStats?.vaahakaStats?.week ?? 0)} icon={BookOpen} />
          <MetricCard label="ވާހަކަ - މި މަހު" value={fmt(viewStats?.vaahakaStats?.month ?? 0)} icon={BookOpen} />
        </div>
      </div>

      {/* Vaahaka top stories */}
      <div className="border border-border rounded-xl p-5 bg-background">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4" style={{ fontFamily: "MVTypewriter, serif" }}>
          އެންމެ ގިނައިން ބެލި ވާހަކަ
        </p>
        {viewStats?.vaahakaStats?.topArticles?.length > 0 ? (
          <div className="space-y-0">
            {viewStats.vaahakaStats.topArticles.map((a: any, i: number) => (
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
