"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EyeOff, Eye, Trash2, ExternalLink } from "lucide-react";
interface Comment {
  id: string;
  body: string;
  is_approved: boolean | null;
  created_at: string;
  article_id: string | null;
  author_name: string | null;
  articles: { id: string; title: string; slug: string; category_slug: string | null } | null;
}
// Comments publish immediately. "visible" = is_approved true; "hidden" = removed by a moderator.
type CommentFilter = "visible" | "hidden" | "all";
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export default function CommentsClient({ comments: initial }: { comments: Comment[] }) {
  const supabase = createClient();
  const [filter, setFilter] = useState<CommentFilter>("visible");
  const [comments, setComments] = useState(initial);
  const isVisible = (c: Comment) => c.is_approved === true;
  const filtered = comments.filter((c) => {
    if (filter === "visible") return isVisible(c);
    if (filter === "hidden") return !isVisible(c);
    return true;
  });
  const counts = {
    all: comments.length,
    visible: comments.filter(isVisible).length,
    hidden: comments.filter((c) => !isVisible(c)).length,
  };
  const setVisible = async (id: string, val: boolean) => {
    const { error } = await supabase.from("comments").update({ is_approved: val }).eq("id", id);
    if (!error) setComments((prev) => prev.map((c) => (c.id === id ? { ...c, is_approved: val } : c)));
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) setComments((prev) => prev.filter((c) => c.id !== id));
  };
  const FILTERS: { value: CommentFilter; label: string }[] = [
    { value: "visible", label: "ފެންނަ" },
    { value: "hidden",  label: "ފޮރުވާފައި" },
    { value: "all",     label: "ހުރިހާ" },
  ];
  return (
    <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">
      <div className="mb-6">
        <h1 className="font-body text-xl font-bold text-foreground">Comments</h1>
        <p className="font-body text-sm text-muted-foreground mt-0.5">
          <span className="font-semibold tabular-nums">{counts.visible}</span> visible ·{" "}
          <span className="font-semibold tabular-nums">{counts.hidden}</span> hidden
        </p>
      </div>
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit mb-6">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => setFilter(f.value)}
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
          {filtered.map((comment) => (
            <div key={comment.id} className={`bg-background rounded-xl border border-border transition-all ${isVisible(comment) ? "" : "opacity-50"}`}>
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
                  <span className={`font-body text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isVisible(comment) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isVisible(comment) ? "ފެންނަ" : "ފޮރުވާފައި"}
                  </span>
                </div>
                {comment.articles && (
                  <a
                    href={comment.articles.category_slug ? `/${comment.articles.category_slug}/${comment.articles.slug}` : `/${comment.articles.slug}`}
                    target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mb-2 group w-fit">
                    <p className="font-body text-[10px] text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">{comment.articles.title}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
