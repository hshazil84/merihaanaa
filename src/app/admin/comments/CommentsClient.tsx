"use client";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EyeOff, Eye, Trash2, ExternalLink, Lock, Unlock, ArrowRight, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  body: string;
  is_approved: boolean | null;
  created_at: string;
  article_id: string | null;
  parent_id: string | null;
  author_name: string | null;
}
interface Article {
  id: string;
  title: string;
  slug: string;
  category_slug: string | null;
  comments_locked: boolean;
}

// Comments publish immediately. "visible" = is_approved true; "hidden" = removed by a moderator.
type CommentFilter = "visible" | "hidden" | "all";
type View = "articles" | "all";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function articleHref(a: Article) {
  return a.category_slug ? `/${a.category_slug}/${a.slug}` : `/${a.slug}`;
}

const PAGE_SIZE = 20;
const THREAD_PAGE_SIZE = 10;

function Pager({ page, total, size, onChange }: { page: number; total: number; size: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  // compact page list: 1 … current-1 current current+1 … last
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }

  const btn = "h-8 min-w-8 px-2.5 rounded-lg font-body text-xs font-semibold transition-colors";
  return (
    <div className="flex items-center justify-between gap-3 mt-5 flex-wrap" dir="ltr">
      <p className="font-body text-[11px] text-muted-foreground tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}
          className={`${btn} bg-muted text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed`}>
          Prev
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1 font-body text-xs text-muted-foreground">…</span>
          ) : (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`${btn} tabular-nums ${n === page ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/70"}`}>
              {n}
            </button>
          )
        )}
        <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}
          className={`${btn} bg-muted text-foreground hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed`}>
          Next
        </button>
      </div>
    </div>
  );
}

function slicePage<T>(list: T[], page: number, size: number): T[] {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const p = Math.min(Math.max(page, 1), pages);
  return list.slice((p - 1) * size, p * size);
}

export default function CommentsClient({
  comments: initialComments,
  articles: initialArticles,
}: {
  comments: Comment[];
  articles: Article[];
}) {
  const supabase = createClient();
  const [view, setView] = useState<View>("articles");
  const [filter, setFilter] = useState<CommentFilter>("visible");
  const [comments, setComments] = useState(initialComments);
  const [articles, setArticles] = useState(initialArticles);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const articleById = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const isVisible = (c: Comment) => c.is_approved === true;

  // ── actions ──────────────────────────────────────────────
  const setVisible = async (id: string, val: boolean) => {
    const { error } = await supabase.from("comments").update({ is_approved: val }).eq("id", id);
    if (!error) setComments((prev) => prev.map((c) => (c.id === id ? { ...c, is_approved: val } : c)));
  };

  const remove = async (id: string) => {
    const replyCount = comments.filter((c) => c.parent_id === id).length;
    if (replyCount > 0 && !window.confirm(`This comment has ${replyCount} repl${replyCount === 1 ? "y" : "ies"}. Deleting it deletes them too. Continue?`)) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
  };

  const toggleLock = async (a: Article) => {
    setBusy(a.id);
    const next = !a.comments_locked;
    const { error } = await supabase.from("articles").update({ comments_locked: next }).eq("id", a.id);
    if (!error) setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, comments_locked: next } : x)));
    setBusy(null);
  };

  // ── shared comment card ──────────────────────────────────
  const CommentCard = ({ comment, isReply = false, showArticle = false }: { comment: Comment; isReply?: boolean; showArticle?: boolean }) => {
    const art = comment.article_id ? articleById.get(comment.article_id) : null;
    return (
      <div className={`bg-background rounded-xl border border-border transition-all ${isVisible(comment) ? "" : "opacity-50"}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-body text-xs text-muted-foreground">{(comment.author_name || "?").charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-body text-xs font-semibold text-foreground">{comment.author_name || "Unknown"}</p>
                <p className="font-body text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {(isReply || comment.parent_id) && (
                <span className="font-body text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-muted text-muted-foreground">Reply</span>
              )}
              <span className={`font-body text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isVisible(comment) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {isVisible(comment) ? "ފެންނަ" : "ފޮރުވާފައި"}
              </span>
            </div>
          </div>
          {showArticle && art && (
            <a href={articleHref(art)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mb-2 group w-fit">
              <p className="font-body text-[10px] text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{art.title}</p>
              <ExternalLink size={9} className="text-muted-foreground flex-shrink-0" />
            </a>
          )}
          <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
        </div>
        <div className="flex items-center gap-1 px-4 pb-3">
          {isVisible(comment) ? (
            <button type="button" onClick={() => setVisible(comment.id, false)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500/10 text-red-700 hover:bg-red-500/20 font-body text-xs font-semibold transition-colors">
              <EyeOff size={12} /> Hide
            </button>
          ) : (
            <button type="button" onClick={() => setVisible(comment.id, true)} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-green-500/10 text-green-700 hover:bg-green-500/20 font-body text-xs font-semibold transition-colors">
              <Eye size={12} /> Restore
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={() => remove(comment.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  };

  const LockButton = ({ a, big = false }: { a: Article; big?: boolean }) => (
    <button
      type="button"
      disabled={busy === a.id}
      onClick={() => toggleLock(a)}
      className={`flex items-center gap-1.5 rounded-lg font-body font-semibold transition-colors disabled:opacity-50 ${big ? "h-8 px-4 text-xs" : "h-7 px-3 text-xs"} ${a.comments_locked ? "bg-amber-500/15 text-amber-800 hover:bg-amber-500/25" : "bg-muted text-foreground hover:bg-muted/70"}`}
    >
      {a.comments_locked ? <><Lock size={12} /> Locked · Unlock</> : <><Unlock size={12} /> Lock comments</>}
    </button>
  );

  // ── views ────────────────────────────────────────────────
  const totalVisible = comments.filter(isVisible).length;
  const totalHidden = comments.length - totalVisible;
  const lockedCount = articles.filter((a) => a.comments_locked).length;

  const header = (
    <div className="mb-6">
      <h1 className="font-body text-xl font-bold text-foreground">Comments</h1>
      <p className="font-body text-sm text-muted-foreground mt-0.5">
        <span className="font-semibold tabular-nums">{totalVisible}</span> visible ·{" "}
        <span className="font-semibold tabular-nums">{totalHidden}</span> hidden ·{" "}
        <span className="font-semibold tabular-nums">{lockedCount}</span> locked articles
      </p>
    </div>
  );

  const tabs = (
    <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit mb-6">
      {([["articles", "By article"], ["all", "All comments"]] as [View, string][]).map(([v, label]) => (
        <button key={v} type="button" onClick={() => { setView(v); setArticleId(null); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {label}
        </button>
      ))}
    </div>
  );

  // Thread view for one article
  if (view === "articles" && articleId) {
    const a = articleById.get(articleId);
    const list = comments.filter((c) => c.article_id === articleId);
    const ids = new Set(list.map((c) => c.id));
    const tops = list.filter((c) => !c.parent_id || !ids.has(c.parent_id));
    const repliesOf = (id: string) =>
      list.filter((c) => c.parent_id === id).sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());

    return (
      <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">
        {header}
        {tabs}
        <button type="button" onClick={() => { setArticleId(null); setPage(1); }} className="flex items-center gap-1.5 mb-4 font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight size={13} /> All articles
        </button>
        {a && (
          <div className="flex items-center justify-between gap-3 mb-5 p-4 bg-background rounded-xl border border-border">
            <div className="min-w-0">
              <a href={articleHref(a)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 group w-fit max-w-full">
                <p className="font-body text-sm font-semibold text-foreground truncate">{a.title}</p>
                <ExternalLink size={11} className="text-muted-foreground flex-shrink-0" />
              </a>
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                {list.length} comment{list.length === 1 ? "" : "s"}
                {a.comments_locked && " · locked: no new comments, replies or reactions"}
              </p>
            </div>
            <LockButton a={a} big />
          </div>
        )}
        {tops.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="font-body text-sm text-muted-foreground">No comments on this article</p>
          </div>
        ) : (
          <div className="space-y-4">
            {slicePage(tops, page, THREAD_PAGE_SIZE).map((c) => (
              <div key={c.id}>
                <CommentCard comment={c} />
                {repliesOf(c.id).length > 0 && (
                  <div className="mt-2 space-y-2 me-6 pe-3 border-e-2 border-border">
                    {repliesOf(c.id).map((r) => (
                      <CommentCard key={r.id} comment={r} isReply />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Pager page={Math.min(page, Math.max(1, Math.ceil(tops.length / THREAD_PAGE_SIZE)))} total={tops.length} size={THREAD_PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>
    );
  }

  // Article list
  if (view === "articles") {
    const counts = new Map<string, number>();
    comments.forEach((c) => c.article_id && counts.set(c.article_id, (counts.get(c.article_id) ?? 0) + 1));
    const q = search.trim().toLowerCase();
    const rows = articles
      .filter((a) => !q || a.title.toLowerCase().includes(q))
      .sort((x, y) => (counts.get(y.id) ?? 0) - (counts.get(x.id) ?? 0));

    return (
      <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">
        {header}
        {tabs}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search articles…"
          className="w-full h-9 px-3 mb-4 rounded-lg border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="font-body text-sm text-muted-foreground">No articles</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slicePage(rows, page, PAGE_SIZE).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border">
                <button type="button" onClick={() => { setArticleId(a.id); setPage(1); }} className="flex-1 min-w-0 text-right">
                  <p className="font-body text-sm font-semibold text-foreground truncate">{a.title}</p>
                  <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MessageSquare size={10} /> {counts.get(a.id) ?? 0}
                    {a.comments_locked && <span className="flex items-center gap-1 text-amber-700 ms-2"><Lock size={10} /> Locked</span>}
                  </p>
                </button>
                <LockButton a={a} />
                <button type="button" onClick={() => { setArticleId(a.id); setPage(1); }} className="h-7 px-3 rounded-lg bg-muted hover:bg-muted/70 font-body text-xs font-semibold text-foreground transition-colors">
                  Manage
                </button>
              </div>
            ))}
            <Pager page={Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)))} total={rows.length} size={PAGE_SIZE} onChange={setPage} />
          </div>
        )}
      </div>
    );
  }

  // All comments (flat)
  const filtered = comments.filter((c) => {
    if (filter === "visible") return isVisible(c);
    if (filter === "hidden") return !isVisible(c);
    return true;
  });
  const counts = { all: comments.length, visible: totalVisible, hidden: totalHidden };
  const FILTERS: { value: CommentFilter; label: string }[] = [
    { value: "visible", label: "ފެންނަ" },
    { value: "hidden",  label: "ފޮރުވާފައި" },
    { value: "all",     label: "ހުރިހާ" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">
      {header}
      {tabs}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit mb-6">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => { setFilter(f.value); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${filter === f.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {f.label}
            <span className="tabular-nums text-[10px] text-muted-foreground/50">{counts[f.value]}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="font-body text-sm text-muted-foreground">No comments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slicePage(filtered, page, PAGE_SIZE).map((c) => (
            <CommentCard key={c.id} comment={c} showArticle />
          ))}
          <Pager page={Math.min(page, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)))} total={filtered.length} size={PAGE_SIZE} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
