"use client";
// components/public/CommentSection.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
}

interface Props {
  articleId: string;
}

export default function CommentSection({ articleId }: Props) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase
        .from("comments")
        .select("id, body, created_at, user_id")
        .eq("article_id", articleId)
        .eq("is_approved", true)
        .order("created_at", { ascending: true });

      setComments(data ?? []);
      setLoading(false);
    };
    init();
  }, [articleId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      body: body.trim(),
      is_approved: false,
    });

    setSubmitting(false);
    if (!error) {
      setBody("");
      setSubmitted(true);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 border-t border-black/10" dir="rtl">

      <h2
        className="mb-8"
        style={{
          fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
          fontWeight: 400,
          fontSize: "20px",
          color: "rgb(26,26,26)",
          lineHeight: 2,
        }}>
        ކޮމެންޓް
      </h2>

      {/* Comments list */}
      {loading ? (
        <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2 }}>
          ލޯޑްވަނީ...
        </p>
      ) : comments.length > 0 ? (
        <div className="space-y-6 mb-10">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "rgb(210,207,200)" }}>
                <span style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(100,98,92)" }}>
                  ك
                </span>
              </div>
              <div className="flex-1">
                <p
                  style={{
                    fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                    fontSize: "14px",
                    color: "rgb(26,26,26)",
                    lineHeight: 2,
                  }}>
                  {comment.body}
                </p>
                <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160,158,152)", lineHeight: 2 }}>
                  {new Date(comment.created_at).toLocaleDateString("dv-MV", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(160,158,152)", lineHeight: 2 }}>
          އަދި ކޮމެންޓެއް ނެތް. ފުރަތަމަ ކޮމެންޓް ލިޔޭ!
        </p>
      )}

      {/* Comment form */}
      {submitted ? (
        <div
          className="p-4 rounded-xl border"
          style={{ backgroundColor: "rgb(240,239,233)", borderColor: "rgb(210,207,200)" }}>
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
            ތިޔަ ކޮމެންޓް ލިބިއްޖެ. ރިވިއު ކުރުމަށްފަހު ޝާއިއުކުރެވޭނެ.
          </p>
        </div>
      ) : user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="ކޮމެންޓް ލިޔޭ..."
            rows={3}
            dir="rtl"
            className="w-full p-3 rounded-xl border outline-none resize-none transition-colors focus:border-black/30"
            style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontSize: "14px",
              color: "rgb(26,26,26)",
              lineHeight: 2,
              backgroundColor: "rgb(240,239,233)",
              borderColor: "rgb(210,207,200)",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-5 py-2 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
              fontSize: "12px",
              fontWeight: 700,
              backgroundColor: "rgb(26,26,26)",
              color: "rgb(249,248,245)",
            }}>
            {submitting ? "ފޮނުވަނީ..." : "ފޮނުވާ"}
          </button>
        </form>
      ) : (
        <div
          className="p-4 rounded-xl border text-center"
          style={{ backgroundColor: "rgb(240,239,233)", borderColor: "rgb(210,207,200)" }}>
          <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgb(100,98,92)", lineHeight: 2 }}>
            ކޮމެންޓް ކުރުމަށް{" "}
            <a href="/login" style={{ color: "rgb(26,26,26)", fontWeight: 700 }}>
              ލޮގިން ކުރޭ
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
