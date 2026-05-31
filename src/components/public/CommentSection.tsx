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

type Props = {
  articleId: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function avatarUrl(path: string | null): string | null {
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

export default function CommentSection({ articleId }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<{ id: string; full_name: string; avatar: string | null } | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Fetch approved comments
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id, user_profiles(full_name, avatar)")
        .eq("article_id", articleId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (commentData) setComments(commentData as Comment[]);

      // Fetch current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("full_name, avatar")
          .eq("id", authUser.id)
          .single();
        if (profile) {
          setUser({ id: authUser.id, full_name: profile.full_name, avatar: profile.avatar });
        }
      }

      setLoading(false);
    }
    init();
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
    <section className="mt-12 border-t border-gray-100 dark:border-gray-800 pt-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        ކޮމެންޓް ({comments.length})
      </h2>

      {/* Comment form */}
      {user ? (
        <div className="mb-8">
          {submitted ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
              ތިބާގެ ކޮމެންޓް ލިބިއްޖެ. ރިވިއު ކުރުމަށްފަހު ޝާއިއުކުރެވޭނެ.
            </div>
          ) : (
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {avatarUrl(user.avatar) ? (
                  <img
                    src={avatarUrl(user.avatar)!}
                    alt={user.full_name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-500">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Input */}
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
        <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50
