"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Trash2, ExternalLink } from "lucide-react";

interface Comment {
  id: string;
  body: string;
  is_approved: boolean | null;
  created_at: string;
  article_id: string | null;
  articles: { id: string; title: string; slug: string } | null;
}

type CommentFilter = "all" | "pending" | "approved" | "rejected";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function CommentsClient({ comments: initial }: { comments: Comment[] }) {
  const supabase = createClient();
  const [filter, setFilter] = useState<CommentFilter>("pending");
  const [comments, setComments] = useState(initial);

  const filtered = comments.filter((c) => {
    if (filter === "pending")  return c.is_approved === null;
    if (filter === "approved") return c.is_approved === true;
    if (filter === "rejected") return c.is_approved === false;
    return true;
  });

  const counts = {
    all:      comments.length,
    pending:  comments.filter((c) => c.is_approved === null).length,
    approved: comments.filter((c) => c.is_approved === true).length,
    rejected: comments.filter((c) => c.is_approved === false).length,
  };

  const update = async (id: string, is_approved: boolean | null) => {
    await supabase.from("comments").update({ is_approved }).eq("id", id);
    setComments((prev) =>
      prev.map((c) => c.id === id ? { ...c, is_approved } : c)
    );
  };

  const remove = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const FILTERS: { value: CommentFilter; label: string }[] = [
    { value: "pending",  label: "ޕެންޑިން" },
    { value: "approved", label: "އެޕްރޫވްޑް" },
    { value: "rejected", label: "ރިޖެކްޓެޑް" },
    { value: "all",      label: "ހުރިހާ" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-body text-xl font-bold text-foreground">ކޮމެންޓް</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            <span className="text-foreground font-semibold tabular-nums">{counts.pending}</span> ޕެންޑިން
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
              filter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className={`tabular-nums text-[10px] ${
              filter === f.value ? "text-muted-foreground" : "text-muted-foreground/50"
            }`}>
              {counts[f.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Comments list */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="font-body text-sm text-muted-foreground">ކޮމެންޓެއް ނެތް</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <div key={comment.id}
              className={`bg-background rounded-xl border border-border transition-all ${
                comment.is_approved === true ? "opacity-60" :
                comment.is_approved === false ? "opacity-40" : ""
              }`}
            >
              <div className="p-4">

                {/* Meta row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="font-body text-xs text-muted-foreground">?</span>
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`font-body text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    comment.is_approved === null
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : comment.is_approved
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {comment.is_approved === null ? "ޕެންޑިން" : comment.is_approved ? "އެޕްރޫވްޑް" : "ރިޖެކްޓެޑް"}
                  </span>
                </div>

                {/* Article link */}
                {comment.articles && (
                  
                    href={`/${comment.articles.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mb-2 group w-fit"
                  >
                    <p className="font-body text-[10px] text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1">
                      {comment.articles.title}
                    </p>
                    <ExternalLink size={9} className="text-muted-foreground flex-shrink-0" />
                  </a>
                )}

                {/* Comment body */}
                <p className="font-body text-sm text-foreground leading-relaxed">
                  {comment.body}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-4 pb-3">
                {comment.is_approved !== true && (
                  <button
                    type="button"
                    onClick={() => update(comment.id, true)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 font-body text-xs font-semibold transition-colors"
                  >
                    <Check size={12} /> އެޕްރޫވް
                  </button>
                )}
                {comment.is_approved !== false && (
                  <button
                    type="button"
                    onClick={() => update(comment.id, false)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 font-body text-xs font-semibold transition-colors"
                  >
                    <X size={12} /> ރިޖެކްޓް
                  </button>
                )}
                {comment.is_approved !== null && (
                  <button
                    type="button"
                    onClick={() => update(comment.id, null)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg hover:bg-muted text-muted-foreground font-body text-xs transition-colors"
                  >
                    ޕެންޑިންއަށް
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => remove(comment.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
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
