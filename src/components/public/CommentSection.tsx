"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
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
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-gray-500"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ReactionBar({
  reactions,
  userId,
  onToggle,
  readOnly,
}: {
  reactions: Reaction[];
  userId: string | null;
  onToggle: (emoji: string) => void;
  readOnly: boolean;
}) {
  const mine = userId ? reactions.find((r) => r.user_id === userId)?.emoji : null;
  const shown = readOnly ? EMOJIS.filter((e) => reactions.some((r) => r.emoji === e)) : EMOJIS;
  return (
    <div className="flex items-center flex-wrap" style={{ gap: 2 }}>
      {shown.map((emoji) => {
        const count = reactions.filter((r) => r.emoji === emoji).length;
        const active = mine === emoji;
        const used = count > 0;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            disabled={readOnly}
            aria-pressed={active}
            className={"inline-flex items-center rounded-full transition-colors " + (readOnly ? "cursor-default" : "hover:bg-black/5")}
            style={{
              gap: 3,
              height: 24,
              padding: used ? "0 7px" : "0 4px",
              backgroundColor: active ? "rgb(232,230,223)" : "transparent",
              boxShadow: active ? "inset 0 0 0 1px rgb(26,26,26)" : used ? "inset 0 0 0 1px rgb(224,221,214)" : "none",
              opacity: used || active ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>{emoji}</span>
            {used && (
              <span style={{ fontSize: 11, lineHeight: 1, color: "rgb(100,98,92)" }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ReplyBox({
  prefix,
  submitting,
  error,
  onSubmit,
  onCancel,
}: {
  prefix: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (text: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");

  async function send() {
    const t = text.trim();
    if (!t || submitting) return;
    const ok = await onSubmit(prefix + t);
    if (ok) setText("");
  }

  return (
    <div className="mt-3">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
        placeholder="ރިޕްލައި ލިޔޭ..."
        rows={2}
        dir="rtl"
        lang="dv"
        spellCheck={false}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={send}
          disabled={submitting || !text.trim()}
          className="px-3 py-1.5 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "ފޮނުވަނީ..." : "ފޮނުވާ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          ބަންދުކުރޭ
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  isReply,
  canDelete,
  onDelete,
  reactions,
  userId,
  onToggleReaction,
  onReplyClick,
  replyOpen,
  replyBox,
  locked,
}: {
  comment: Comment;
  isReply: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  reactions: Reaction[];
  userId: string | null;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onReplyClick: () => void;
  replyOpen: boolean;
  replyBox: React.ReactNode;
  locked: boolean;
}) {
  const profile = comment.user_profiles;
  const name = profile?.full_name ?? "ނަމެއް ނެތް";
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <Avatar path={profile?.avatar ?? null} name={name} size={isReply ? 26 : 32} />
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
        <div className="flex items-center flex-wrap mt-1.5" style={{ gap: 6 }}>
          <ReactionBar
            reactions={reactions}
            userId={userId}
            onToggle={(emoji) => onToggleReaction(comment.id, emoji)}
            readOnly={locked}
          />
          {!locked && (
            <button
              type="button"
              onClick={onReplyClick}
              className="text-xs text-gray-400 hover:text-gray-900 transition-colors px-1"
              style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif' }}
            >
              ރިޕްލައި
            </button>
          )}
        </div>
        {replyOpen && !locked && replyBox}
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
  const [locked, setLocked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // reply state: which comment's reply box is open
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Fresh lock state (not cached with the page)
        const { data: lockRow, error: lockErr } = await supabase
          .from("articles")
          .select("comments_locked")
          .eq("id", articleId)
          .maybeSingle();
        if (lockErr) console.error("[comments] lock query failed:", lockErr.message);
        if (!cancelled) setLocked(!!lockRow?.comments_locked);

        const { data: commentData, error: commentErr } = await supabase
          .from("comments")
          .select("id, body, created_at, user_id, parent_id, user_profiles(full_name, avatar)")
          .eq("article_id", articleId)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });

        if (commentErr) {
          console.error("[comments] load failed:", commentErr.message, commentErr);
          if (!cancelled) setLoadError(commentErr.message);
        }

        if (!cancelled && commentData) {
          setComments(commentData as unknown as Comment[]);

          const ids = commentData.map((c: { id: string }) => c.id);
          if (ids.length > 0) {
            const { data: reactionData, error: reactionErr } = await supabase
              .from("comment_reactions")
              .select("comment_id, user_id, emoji")
              .in("comment_id", ids);
            if (reactionErr) console.error("[comments] reactions failed:", reactionErr.message);
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
      } catch (e) {
        console.error("[comments] init crashed:", e);
        if (!cancelled) setLoadError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [articleId]);

  // Returns an error message, or null on success
  async function postComment(text: string, parentId: string | null): Promise<string | null> {
    if (!user) return "ލޮގިން ވޭ";
    if (locked) return "މި ލިޔުމުގެ ކޮމެންޓް ބަންދުކޮށްފައި";

    if (Date.now() - lastPostAt < COOLDOWN_MS) {
      return "ކޮމެންޓްތައް ފޮނުވަނީ ވަރަށް އަވަހަށް. ވަރަކަށް މަޑުކޮށްލާ.";
    }

    const { data, error: insertError } = await supabase
      .from("comments")
      .insert({
        article_id: articleId,
        user_id: user.id,
        body: text,
        parent_id: parentId,
        is_approved: true,
      })
      .select("id, body, created_at, user_id, parent_id")
      .single();

    if (insertError || !data) {
      return "ކޮމެންޓް ފޮނުވޭކަށް ނުޖެހުނު. އަލުން މަސައްކަތް ކޮށްލާ.";
    }

    setComments((prev) => [
      {
        ...(data as Omit<Comment, "user_profiles">),
        user_profiles: { full_name: user.full_name, avatar: user.avatar },
      },
      ...prev,
    ]);
    setLastPostAt(Date.now());
    return null;
  }

  async function handleSubmit() {
    const text = body.trim();
    if (!text || !user || submitting) return;
    setSubmitting(true);
    setError(null);
    const err = await postComment(text, null);
    if (err) setError(err);
    else setBody("");
    setSubmitting(false);
  }

  async function handleReplySubmit(topId: string, text: string): Promise<boolean> {
    if (replySubmitting) return false;
    setReplySubmitting(true);
    setReplyError(null);
    const err = await postComment(text, topId);
    setReplySubmitting(false);
    if (err) {
      setReplyError(err);
      return false;
    }
    setReplyingTo(null);
    return true;
  }

  function openReply(commentId: string) {
    if (locked) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setReplyError(null);
    setReplyingTo((cur) => (cur === commentId ? null : commentId));
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
    if (!deleteError) {
      // deleting a comment also deletes its replies (cascade)
      setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
      setReactions((prev) => prev.filter((r) => r.comment_id !== id));
    }
  }

  async function handleToggleReaction(commentId: string, emoji: string) {
    if (locked) return;
    if (!user) {
      window.location.href = "/login";
      return;
    }
    const previous = reactions;
    const existing = reactions.find((r) => r.comment_id === commentId && r.user_id === user.id);

    if (existing && existing.emoji === emoji) {
      setReactions((prev) => prev.filter((r) => !(r.comment_id === commentId && r.user_id === user.id)));
      const { error: err } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      if (err) setReactions(previous);
    } else if (existing) {
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
      setReactions((prev) => [...prev, { comment_id: commentId, user_id: user.id, emoji }]);
      const { error: err } = await supabase
        .from("comment_reactions")
        .insert({ comment_id: commentId, user_id: user.id, emoji });
      if (err) setReactions(previous);
    }
  }

  if (loading) return null;

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  function renderItem(c: Comment, topId: string, isReply: boolean) {
    const name = c.user_profiles?.full_name ?? "";
    return (
      <CommentItem
        key={c.id}
        comment={c}
        isReply={isReply}
        canDelete={!!user && c.user_id === user.id}
        onDelete={handleDelete}
        reactions={reactions.filter((r) => r.comment_id === c.id)}
        userId={user?.id ?? null}
        onToggleReaction={handleToggleReaction}
        onReplyClick={() => openReply(c.id)}
        locked={locked}
        replyOpen={replyingTo === c.id}
        replyBox={
          <ReplyBox
            prefix={isReply && name ? `@${name} ` : ""}
            submitting={replySubmitting}
            error={replyError}
            onSubmit={(text) => handleReplySubmit(topId, text)}
            onCancel={() => setReplyingTo(null)}
          />
        }
      />
    );
  }

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

      {locked ? (
        <div
          className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
          style={{ fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif' }}
        >
          🔒 މި ލިޔުމުގެ ކޮމެންޓް ބަންދުކޮށްފައި. އާ ކޮމެންޓް ނުކުރެވޭނެ.
        </div>
      ) : user ? (
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

      {loadError && (
        <p className="text-xs text-red-500 mb-4" dir="ltr">
          Comments failed to load: {loadError}
        </p>
      )}

      {topLevel.length === 0 ? (
        locked ? null : (
          <p className="text-sm text-gray-400 text-center py-6">
            އަދި ކޮމެންޓެއް ނެތް. ފުރަތަމަ ކޮމެންޓް ކޮށްލާ!
          </p>
        )
      ) : (
        <div className="space-y-6">
          {topLevel.map((c) => {
            const replies = repliesOf(c.id);
            return (
              <div key={c.id}>
                {renderItem(c, c.id, false)}
                {replies.length > 0 && (
                  <div
                    className="mt-4 space-y-4"
                    style={{
                      marginInlineStart: 16,
                      paddingInlineStart: 12,
                      borderInlineStart: "2px solid rgb(224,221,214)",
                    }}
                  >
                    {replies.map((r) => renderItem(r, c.id, true))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
