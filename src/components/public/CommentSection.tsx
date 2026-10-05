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

type Props = {
  articleId: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const MAX_LENGTH = 1000;
const COOLDOWN_MS = 10000;

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

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const profile = comment.user_profiles;
  const name = profile?.full_name ?? "ނަމެއް ނެތް";
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <Avatar path={profile?.avatar ?? null} name={name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
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
      </div>
    </div>
  );
}

function CommentList({
  comments,
  userId,
  onDelete,
}: {
  comments: Comment[];
  userId: string | null;
  onDelete: (id: string) => void;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        އަދި ކޮމެންޓެއް ނެތް. ފުރަތަމަ ކޮމެންޓް ކޮށްލާ!
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          canDelete={!!userId && c.user_id === userId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default function CommentSection({ articleId }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
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
    }
  }

  if (loading) return null;

  return (
    <section className="pt-2" dir="rtl" lang="dv">
      <h2
        className="mb-3"
        style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 400,
          fontSize: "20px",
          color: "rgb(26,26,26)",
          lineHeight: 1.8,
        }}
      >
        ކޮމެންޓް ({comments.length})
      </h2>

      {user ? (
        <div className="mb-5">
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
                autoCapitalize="off"
                autoCorrect="off"
                style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {body.length}/{MAX_LENGTH}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !body.trim()}
                  className="px-4 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "ފޮނުވަނީ..." : "ފޮނުވާ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
          ކޮމެންޓް ކުރަން{" "}
          <a href="/login" className="text-gray-900 dark:text-white underline underline-offset-2">
            ލޮގިން ވޭ
          </a>
        </div>
      )}

      <CommentList comments={comments} userId={user?.id ?? null} onDelete={handleDelete} />
    </section>
  );
}
