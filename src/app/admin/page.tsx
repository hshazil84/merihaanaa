import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DashboardStats } from "@/types";

async function getStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();

  const [
    { count: total_articles },
    { count: published_articles },
    { count: draft_articles },
    { count: total_subscribers },
    { count: pending_comments },
    { count: total_videos },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("videos").select("*", { count: "exact", head: true }),
  ]);

  return {
    total_articles: total_articles || 0,
    published_articles: published_articles || 0,
    draft_articles: draft_articles || 0,
    total_subscribers: total_subscribers || 0,
    pending_comments: pending_comments || 0,
    total_videos: total_videos || 0,
  };
}

async function getRecentArticles() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, status, published_at, homepage_placement, featured_image")
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

export default async function AdminDashboard() {
  const [stats, recentArticles] = await Promise.all([
    getStats(),
    getRecentArticles(),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-black dark:text-white mb-1">
            ޑޭޝްބޯޑް
          </h1>
          <p className="font-body text-sm text-neutral-400">
            {new Date().toLocaleDateString("dv-MV", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="font-body text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl hover:opacity-85 transition-opacity"
        >
          + އާ ލިޔުން
        </Link>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="ޖުމްލަ ލިޔުން"
          value={stats.total_articles}
          sub={`${stats.published_articles} ލައިވް`}
          subColor="text-green-600"
        />
        <StatCard
          label="ޑްރާފްޓް"
          value={stats.draft_articles}
          sub="ތައްޔާރުވަނީ"
          subColor="text-neutral-400"
        />
        <StatCard
          label="ސަބްސްކްރައިބަރ"
          value={stats.total_subscribers}
          sub="ނިއުސްލެޓަރ"
          subColor="text-neutral-400"
        />
        <StatCard
          label="ވީޑިއޯ"
          value={stats.total_videos}
          sub="ކްލައުޑްފްލެއަރ ސްޓްރީމް"
          subColor="text-neutral-400"
        />
        <StatCard
          label="ކޮމެންޓް"
          value={stats.pending_comments}
          sub="ތިލަ ބެލުން ބޭނުން"
          subColor={stats.pending_comments > 0 ? "text-amber-600" : "text-neutral-400"}
          href="/admin/comments"
          alert={stats.pending_comments > 0}
        />
        <StatCard
          label="ހޯމްޕޭޖް"
          value="ލައިވް"
          isText
          sub="ލޭއައުޓް ބަލާ"
          subColor="text-neutral-400"
          href="/admin/homepage"
        />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { href: "/admin/articles/new", label: "ލިޔުން ލިޔާ", icon: "✎" },
          { href: "/admin/homepage", label: "ހޯމްޕޭޖް", icon: "⊡" },
          { href: "/admin/videos", label: "ވީޑިއޯ", icon: "▶" },
          { href: "/admin/comments", label: "ކޮމެންޓް", icon: "💬" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl p-4 flex items-center gap-3 hover:border-black dark:hover:border-white transition-colors group"
          >
            <span className="text-lg">{action.icon}</span>
            <span className="font-body text-sm font-bold text-neutral-600 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── RECENT ARTICLES ── */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="font-body text-base font-bold text-black dark:text-white">
            ފަހުގެ ލިޔުންތައް
          </h2>
          <Link
            href="/admin/articles"
            className="font-body text-sm text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ހުރިހާ ←
          </Link>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="text-right px-6 py-3 font-body text-2xs font-bold text-neutral-400 uppercase tracking-wider">
                ލިޔުން
              </th>
              <th className="text-right px-4 py-3 font-body text-2xs font-bold text-neutral-400 uppercase tracking-wider">
                ހޯމްޕޭޖް ތަން
              </th>
              <th className="text-right px-4 py-3 font-body text-2xs font-bold text-neutral-400 uppercase tracking-wider">
                ހާލަތު
              </th>
              <th className="text-left px-6 py-3 font-body text-2xs font-bold text-neutral-400 uppercase tracking-wider">
                ޢަމަލު
              </th>
            </tr>
          </thead>
          <tbody>
            {recentArticles.map((article, i) => (
              <tr
                key={article.id}
                className={`
                  border-b border-neutral-50 dark:border-neutral-800
                  hover:bg-neutral-50 dark:hover:bg-neutral-800
                  transition-colors
                  ${i === recentArticles.length - 1 ? "border-b-0" : ""}
                `}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {article.featured_image ? (
                      <img
                        src={article.featured_image}
                        alt=""
                        className="w-12 h-9 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-9 bg-neutral-100 dark:bg-neutral-800 rounded flex-shrink-0" />
                    )}
                    <span className="font-body text-sm font-bold text-black dark:text-white line-clamp-1">
                      {article.title}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <PlacementBadge placement={article.homepage_placement} />
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={article.status} />
                </td>
                <td className="px-6 py-4 text-left">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="font-body text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    އެޑިޓް
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── SUB COMPONENTS ────────────────────────────────────────

function StatCard({
  label, value, sub, subColor, href, alert, isText,
}: {
  label: string;
  value: number | string;
  sub: string;
  subColor: string;
  href?: string;
  alert?: boolean;
  isText?: boolean;
}) {
  const content = (
    <div
      className={`
        bg-white dark:bg-neutral-900
        border rounded-2xl p-5
        ${alert
          ? "border-amber-200 dark:border-amber-900"
          : "border-neutral-100 dark:border-neutral-800"
        }
        ${href ? "hover:border-black dark:hover:border-white transition-colors cursor-pointer" : ""}
      `}
    >
      <div className="font-body text-xs text-neutral-400 mb-3">{label}</div>
      <div
        className={`
          mb-1
          ${isText
            ? "font-body text-lg font-bold text-black dark:text-white"
            : "font-body text-3xl font-bold text-black dark:text-white tabular-nums"
          }
        `}
      >
        {value}
      </div>
      <div className={`font-body text-xs ${subColor}`}>{sub}</div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function PlacementBadge({ placement }: { placement: string | null }) {
  if (!placement) {
    return (
      <span className="font-body text-xs text-neutral-300 dark:text-neutral-700">
        —
      </span>
    );
  }

  const MAP: Record<string, { label: string; className: string }> = {
    hero:          { label: "ހީރޯ",        className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    editors_choice:{ label: "އެޑިޓަރ",     className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    review:        { label: "ރިވިއު",       className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
    reel:          { label: "ރީލް",         className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  };

  const badge = MAP[placement];
  if (!badge) return null;

  return (
    <span className={`font-body text-xs font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { label: string; className: string }> = {
    published: { label: "ލައިވް",    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
    draft:     { label: "ޑްރާފްޓް", className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" },
    scheduled: { label: "ތިލަ",      className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  };

  const badge = MAP[status];
  if (!badge) return null;

  return (
    <span className={`font-body text-xs font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
      {badge.label}
    </span>
  );
}
