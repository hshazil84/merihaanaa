"use client";
// src/app/admin/series/page.tsx

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
}

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
    + "-" + Math.random().toString(36).slice(2, 5);
}

export default function AdminSeriesPage() {
  const supabase = createClient();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("series")
      .select("*")
      .order("created_at", { ascending: false });
    setSeries(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setTitle(""); setSlug(""); setDescription(""); setThumbnailUrl(""); setIsActive(true); setEditingId(null);
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(s: Series) {
    setTitle(s.title); setSlug(s.slug); setDescription(s.description ?? "");
    setThumbnailUrl(s.thumbnail_url ?? ""); setIsActive(s.is_active); setEditingId(s.id);
    setFormOpen(true);
  }

  async function handleThumb(file: File) {
    setThumbUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: formData });
    const json = await res.json();
    if (json.url) setThumbnailUrl(json.url);
    setThumbUploading(false);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title,
      slug: slug || slugify(title),
      description: description || null,
      thumbnail_url: thumbnailUrl || null,
      is_active: isActive,
    };

    if (editingId) {
      await supabase.from("series").update(payload).eq("id", editingId);
    } else {
      await supabase.from("series").insert(payload);
    }

    await load();
    setSaving(false);
    setFormOpen(false);
    resetForm();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" ޑިލީޓްކުރަށްވަނީ؟`)) return;
    await supabase.from("series").delete().eq("id", id);
    setSeries(prev => prev.filter(s => s.id !== id));
  }

  async function handleToggle(s: Series) {
    await supabase.from("series").update({ is_active: !s.is_active }).eq("id", s.id);
    setSeries(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: "MVTypewriter, serif", fontSize: "22px", fontWeight: 700 }}>ސީރީސް</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-700 transition-colors"
          style={{ fontFamily: "MVTypewriter, serif" }}
        >
          + އާ ސީރީސް
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="border border-neutral-200 rounded-xl p-5 mb-6 bg-white">
          <h2 className="text-base font-semibold mb-4" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
            {editingId ? "ސީރީސް އެޑިޓް" : "އާ ސީރީސް"}
          </h2>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ނަން</label>
              <input type="text" value={title}
                onChange={e => { setTitle(e.target.value); if (!editingId) setSlug(slugify(e.target.value)); }}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
                placeholder="ސީރީސްގެ ނަން" />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Slug</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm font-mono"
                placeholder="series-slug" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ތަފްސީލް</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
                style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
                placeholder="ސީރީސްގެ ތަފްސީލް" />
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ތަމްބްނެއިލް</label>
              {thumbnailUrl && (
                <div className="relative w-40 aspect-video rounded-lg overflow-hidden mb-3 bg-neutral-100">
                  <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  <button onClick={() => setThumbnailUrl("")}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80">
                    ×
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors text-sm text-neutral-700 w-fit">
                {thumbUploading ? (
                  <span style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑްވަނީ...</span>
                ) : (
                  <span style={{ fontFamily: "MVTypewriter, serif" }}>ފޮޓޯ އިހްތިޔާރު</span>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleThumb(e.target.files[0])} />
              </label>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-neutral-700" style={{ fontFamily: "MVTypewriter, serif" }}>Active</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isActive ? "bg-neutral-900" : "bg-neutral-300"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isActive ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button onClick={handleSave} disabled={saving || !title.trim()}
                className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
                style={{ fontFamily: "MVTypewriter, serif" }}>
                {saving ? "ސޭވްވަނީ..." : "ސޭވް"}
              </button>
              <button onClick={() => { setFormOpen(false); resetForm(); }}
                className="px-5 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                style={{ fontFamily: "MVTypewriter, serif" }}>
                ކެންސަލް
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>ލޯޑްވަނީ...</div>
      ) : series.length === 0 ? (
        <div className="text-center py-16 text-neutral-400 border border-dashed border-neutral-200 rounded-xl" style={{ fontFamily: "MVTypewriter, serif" }}>
          ސީރީސް ނެތް
        </div>
      ) : (
        <div className="space-y-3">
          {series.map(s => (
            <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
              {/* Thumbnail */}
              <div className="w-20 aspect-video rounded-lg overflow-hidden bg-neutral-100 flex-none">
                {s.thumbnail_url ? (
                  <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-200" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0" dir="rtl">
                <p className="font-semibold text-neutral-900 text-sm" style={{ fontFamily: "MVTypewriter, serif" }}>{s.title}</p>
                {s.description && (
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1" style={{ fontFamily: "MVTypewriter, serif" }}>{s.description}</p>
                )}
                <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{s.slug}</p>
              </div>

              {/* Status */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-none ${s.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}
                style={{ fontFamily: "MVTypewriter, serif" }}>
                {s.is_active ? "އެކްޓިވް" : "ނިއްވާ"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-none">
                <button onClick={() => handleToggle(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  {s.is_active ? "ނިއްވާ" : "ޖައްސާ"}
                </button>
                <button onClick={() => openEdit(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-600"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  އެޑިޓް
                </button>
                <button onClick={() => handleDelete(s.id, s.title)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-red-600"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  ޑިލީޓް
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
