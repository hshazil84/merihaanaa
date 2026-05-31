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

function getAvatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "ދެންމެ";
  if (diff < 3600) return `${Math.floor(diff / 60)} މިނިޓް`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ގަޑި`;
  return `${Math.floor(diff / 86400)} ދުވަސް`;
}

function Avatar({ path, name, size = 9 }: { path: string | null; name: string; size?: number }) {
  const url = getAvatarUrl(path);
  const cls = `w-${size} h-${size} rounded-full`;
  if (url) {
    return <img src={url} alt={name} className={`${cls} object-cover`} />;
  }
  return (
    <div className={`${cls} bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-500`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const profile = comment.user_profiles;
  const name = profile?.full_name ?? "ނަމެއް ނެތް";
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <Avatar path={profile?.avatar ?? null} name={name} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
          <span className="text-xs text-gray-400">{timeAgo(comment.created_at)} ކުރިން</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.body}</p>
      </div>
    </div>
  );
}

function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        އަދި ކޮމެންޓެއް ނެތް. ފުރަތަމަ ކޮމެންޓް ކޮށްލާ!
      </p>
    );
  }
  const items: React.ReactNode[] = [];
  for (let i = 0; i < comments.length; i++) {
    items.push(<CommentItem key={comments[i].id} comment={comments[i]} />);
  }
  return <div className="space-y-6">{items}</div>;
}

export default function CommentSection({ articleId }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    if (!body.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      body: body.trim(),
      is_approved: false,
    });
    if (!error) {
      setBody("");
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  if (loading) return null;

  return (
    <section className="mt-12 border-t border-black/10 pt-10">
      <h2 className="mb-6" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 400, fontSize: "22px", color: "rgb(26,26,26)", lineHeight: 2 }}>
        ކޮމެންޓް ({comments.length})
      </h2>

      {user ? (
        <div className="mb-8">
          {submitted ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
              ތިބާގެ ކޮމެންޓް ލިބިއްޖެ. ރިވިއު ކުރުމަށްފަހު ޝާއިއުކުރެވޭނެ.
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Avatar path={user.avatar} name={user.full_name} />
              </div>
              <div className="flex-1">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="ކޮމެންޓެއް ލިޔޭ..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                />
                <div className="flex justify-end mt-2">
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
          )}
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
          ކޮމެންޓް ކުރަން{" "}
          <a href="/login" className="text-gray-900 dark:text-white underline underline-offset-2">
            ލޮގިން ވޭ
          </a>
        </div>
      )}

      <CommentList comments={comments} />
    </section>
  );
}
