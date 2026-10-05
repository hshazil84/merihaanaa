"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  user_profiles: {
    full_name: string;
    avatar: string | null;
  } | null;
};

type UserProfile = {
  id: string;
  full_name: string;
  avatar: string | null;
};

type Reaction = { comment_id: string; user_id: string; emoji: string };

type Props = {
  articleId: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const MAX_LENGTH = 1000;
const COOLDOWN_MS = 10000;
const EMOJIS = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"];

function getAvatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "ދެންމެ";
  if (diff < 3600) return `${Math.floor(diff / 60)} މިނިޓް ކުރިން`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ގަޑި ކުރިން`;
  return `${Math.floor(diff / 86400)} ދުވަސް ކުރިން`;
}

function Avatar({ path, name, size = 32 }: { path: string | null; name: string; size?: number }) {
  const url = getAvatarUrl(path);
  const style = { width: size, height: size };
  if (url) {
    return <img src={url} alt={name} style={style} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-500"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ReactionBar({
  reactions,
  userId,
  onToggle,
}: {
  reactions: Reaction[];
  userId: string | null;
  onToggle: (emoji: string) => void;
}) {
  const mine = userId ? reactions.find((r) => r.user_id === userId)?.emoji : null;
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap" dir="ltr">
      {EMOJIS.map((emoji) => {
        const count = reactions.filter((r) => r.emoji === emoji).length;
        const active = mine === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            aria-pressed={active}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors"
            style={{
              border: active ? "1px solid rgb(26,26,26)" : "1px solid rgb(224,221,214)",
              backgroundColor: active ? "rgb(240,239,233)" : "transparent",
              opacity: count === 0 && !active ? 0.55 : 1,
            }}
          >
            <span style={{ fontSize: "14px", lineHeight: 1.4 }}>{emoji}</span>
            {count > 0 && <span style={{ color: "rgb(100,98,92)" }}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
  reactions,
  userId,
  onToggleReaction,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
  reactions: Reaction[];
  userId: string | null;
  onToggleReaction: (commentId: string, emoji: string) => void;
}) {
  const profile = comment.user_profiles;
  const name = profile?.full_name ?? "ނަމެއް ނެތް";
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <Avatar path={profile?.avatar ?? null} name={name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
          <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors ms-auto"
            >
              ފޮހެލާ
            </button>
          )}
        </div>
        <p
          dir="auto"
          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words"
        >
          {comment.body}
        </p>
        <ReactionBar
          reactions={reactions}
          userId={userId}
          onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
        />
      </div>
    </div>
  );
}

export default function CommentSection({ articleId }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPostAt, setLastPostAt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id, user_profiles(full_name, avatar)")
        .eq("article_id", articleId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!cancelled && commentData) {
        setComments(commentData as unknown as Comment[]);

        const ids = commentData.map((c: { id: string }) => c.id);
        if (ids.length > 0) {
          const { data: reactionData } = await supabase
            .from("comment_reactions")
            .select("comment_id, user_id, emoji")
            .in("comment_id", ids);
          if (!cancelled && reactionData) setReactions(reactionData as Reaction[]);
        }
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!cancelled && authData.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, avatar")
          .eq("id", authData.user.id)
          .single();
        if (profile) {
          setUser({ id: authData.user.id, full_name: profile.full_name, avatar: profile.avatar });
        }
      }

      if (!cancelled) setLoading(false);
    }

    init();
    return () => { cancelled = true; };
  }, [articleId]);

  async function handleSubmit() {
    const text = body.trim();
    if (!text || !user || submitting) return;

    if (Date.now() - lastPostAt < COOLDOWN_MS) {
      setError("ކޮމެންޓްތައް ފޮނުވަނީ ވަރަށް އަވަހަށް. ވަރަކަށް މަޑުކޮށްލާ.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        article_id: articleId,
        user_id: user.id,
        body: text,
        is_approved: true,
      })
      .select("id, body, created_at, user_id")
      .single();

    if (insertError || !data) {
      setError("ކޮމެންޓް ފޮނުވޭކަށް ނުޖެހުނު. އަލުން މަސައްކަތް ކޮށްލާ.");
    } else {
      setComments((prev) => [
        {
          ...data,
          user_profiles: { full_name: user.full_name, avatar: user.avatar },
        },
        ...prev,
      ]);
      setBody("");
      setLastPostAt(Date.now());
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
    if (!deleteError) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      setReactions((prev) => prev.filter((r) => r.comment_id !== id));
    }
  }

  async function handleToggleReaction(commentId: string, emoji: string) {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const previous = reactions;
    const existing = reactions.find((r) => r.comment_id === commentId && r.user_id === user.id);

    if (existing && existing.emoji === emoji) {
      // remove
      setReactions((prev) => prev.filter((r) => !(r.comment_id === commentId && r.user_id === user.id)));
      const { error: err } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (err) setReactions(previous);
    } else if (existing) {
      // switch
      setReactions((prev) =>
        prev.map((r) =>
          r.comment_id === commentId && r.user_id === user.id ? { ...r, emoji } : r
        )
      );
      const { error: err } = await supabase
        .from("comment_reactions")
        .update({ emoji })
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (err) setReactions(previous);
    } else {
      // add
      setReactions((prev) => [...prev, { comment_id: commentId, user_id: user.id, emoji }]);
      const { error: err } = await supabase
        .from("comment_reactions")
        .insert({ comment_id: commentId, user_id: user.id, emoji });
      if (err) setReactions(previous);
    }
  }

  if (loading) return null;

  return (
    <section className="pt-2" dir="rtl" lang="dv">
      <h2
        className="mb-4"
        style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 400,
          fontSize: "22px",
          color: "rgb(26,26,26)",
          lineHeight: 2,
        }}
      >
        ކޮމެންޓް ({comments.length})
      </h2>

      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Avatar path={user.avatar} name={user.full_name} />
            </div>
            <div className="flex-1">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
                placeholder="ކޮމެންޓެއް ލިޔޭ..."
                rows={2}
                dir="rtl"
                lang="dv"
                spellCheck={false}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {body.length}/{MAX_LENGTH}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !body.trim()}
                  className="px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "ފޮނުވަނީ..." : "ފޮނުވާ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
          ކޮމެންޓް ކުރަން{" "}
          <a href="/login" className="text-gray-900 dark:text-white underline underline-offset-2">
            ލޮގިން ވޭ
          </a>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          އަދި ކޮމެންޓެއް ނެތް. ފުރަތަމަ ކޮމެންޓް ކޮށްލާ!
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              canDelete={!!user && c.user_id === user.id}
              onDelete={handleDelete}
              reactions={reactions.filter((r) => r.comment_id === c.id)}
              userId={user?.id ?? null}
              onToggleReaction={handleToggleReaction}
            />
          ))}
        </div>
      )}
    </section>
  );
}
