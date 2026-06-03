"use client";
// src/app/admin/originals/page.tsx

import { useEffect, useState } from "react";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  documentary: "ޑޮކިއުމެންޓްރީ",
  profile: "ޕްރޮފައިލް",
  episode: "އެޕިސޯޑް",
  segment: "ސެގްމެންޓް",
  interview: "އިންޓަވިއު",
  short: "ޝޯޓް",
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function OriginalsAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/originals");
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" ޑިލީޓްކުރަށްވަނީ؟`)) return;
    setDeleting(id);
    await fetch(`/api/originals?id=${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: "MVTypewriter, serif", fontSize: "22px", fontWeight: 700 }}>
          އޮރިޖިނަލްސް
        </h1>
        <Link
          href="/admin/originals/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-700 transition-colors"
          style={{ fontFamily: "MVTypewriter, serif" }}
        >
          + އާ ވިޑިއޯ
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>
          ލޯޑްވަނީ...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>
          ވިޑިއޯ ނެތް
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ތަމްބްނެއިލް</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ނަން</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-500 hidden md:table-cell" style={{ fontFamily: "MVTypewriter, serif" }}>ބާވަތް</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-500 hidden md:table-cell" style={{ fontFamily: "MVTypewriter, serif" }}>ވަގުތު</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ހާލަތު</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-20 aspect-video rounded overflow-hidden bg-neutral-100">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 line-clamp-2" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                      {item.title}
                    </p>
                    {item.series && (
                      <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                        {item.series.title}{item.episode_number ? ` · އެޕ ${item.episode_number}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-600" style={{ fontFamily: "MVTypewriter, serif" }}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-500 tabular-nums">
                    {formatDuration(item.duration_seconds)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      item.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`} style={{ fontFamily: "MVTypewriter, serif" }}>
                      {item.status === "published" ? "ޝާއިއު" : "ޑްރާފްޓް"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/originals/${item.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors text-neutral-700"
                      >
                        އެޑިޓް
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deleting === item.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-600 disabled:opacity-50"
                      >
                        {deleting === item.id ? "..." : "ޑިލީޓް"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
