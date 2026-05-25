"use client";
// src/app/admin/videos/page.tsx
// Reels manager — Cloudflare Stream upload + management

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Upload, Play, Trash2, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";

interface Category { id: string; name: string; }
interface Reel {
  id: string;
  title: string;
  slug: string;
  stream_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category_id: string | null;
  status: "draft" | "published";
  homepage_featured: boolean;
  published_at: string | null;
  category?: { name: string } | null;
}

type UploadState = "idle" | "requesting" | "uploading" | "processing" | "ready" | "error";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 80) + "-" + Date.now().toString(36).slice(-4);
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReelsAdminPage() {
  const supabase = createClient();
  const [reels, setReels] = useState<Reel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [homepageFeatured, setHomepageFeatured] = useState(false);

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamVideoId, setStreamVideoId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load data
  useEffect(() => {
    const load = async () => {
      const [{ data: reelsData }, { data: catsData }] = await Promise.all([
        supabase
          .from("reels")
          .select("*, category:categories!category_id(name)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name").order("name"),
      ]);
      setReels(reelsData ?? []);
      setCategories(catsData ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Poll Cloudflare Stream until video is ready
  const pollVideoStatus = useCallback((videoId: string) => {
    setUploadState("processing");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/stream/upload?id=${videoId}`);
        const data = await res.json();
        if (data.status === "ready" || data.readyToStream) {
          clearInterval(pollRef.current!);
          setThumbnailUrl(data.thumbnail ?? "");
          setDurationSeconds(data.duration ?? null);
          setUploadState("ready");
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setUploadState("error");
          setError("ވީޑިއޯ ޕްރޮސެސް ނުވި");
        }
      } catch {
        clearInterval(pollRef.current!);
        setUploadState("error");
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Handle file selection / drop
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("ވީޑިއޯ ފައިލެއް އިހްތިޔާރުކޮށްލާ");
      return;
    }

    setError(null);
    setUploadState("requesting");
    setUploadProgress(0);

    try {
      // 1. Get direct upload URL from our API
      const res = await fetch("/api/stream/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxDurationSeconds: 3600 }),
      });
      const { uploadUrl, videoId, error: apiError } = await res.json();
      if (apiError || !uploadUrl) throw new Error(apiError ?? "Upload URL ނުލިބުނު");

      setStreamVideoId(videoId);
      setUploadState("uploading");

      // 2. Upload directly to Cloudflare Stream via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed: " + xhr.status));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", uploadUrl);
        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });

      // 3. Poll until ready
      pollVideoStatus(videoId);

    } catch (err: any) {
      setUploadState("error");
      setError("އަޕްލޯޑް ނުވި: " + err.message);
    }
  }, [pollVideoStatus]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const resetForm = () => {
    setTitle("");
    setCategoryId("");
    setHomepageFeatured(false);
    setUploadState("idle");
    setUploadProgress(0);
    setStreamVideoId("");
    setThumbnailUrl("");
    setDurationSeconds(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { setError("ސުރުހީ ލިޔެލާ"); return; }
    if (!streamVideoId) { setError("ވީޑިއޯ އަޕްލޯޑްކޮށްލާ"); return; }
    if (uploadState !== "ready") { setError("ވީޑިއޯ ޕްރޮސެސްވަންދެން މަޑުކޮށްލާ"); return; }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug: createSlug(title),
      stream_video_id: streamVideoId,
      thumbnail_url: thumbnailUrl || null,
      duration_seconds: durationSeconds,
      category_id: categoryId || null,
      homepage_featured: homepageFeatured,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    };

    const { data, error: err } = await supabase
      .from("reels")
      .insert(payload)
      .select("*, category:categories!category_id(name)")
      .single();

    setSaving(false);
    if (err) { setError("ސޭވް ނުވި: " + err.message); return; }

    setReels((prev) => [data, ...prev]);
    resetForm();
    setFormOpen(false);
  };

  const handleTogglePublish = async (reel: Reel) => {
    const newStatus = reel.status === "published" ? "draft" : "published";
    const { error: err } = await supabase
      .from("reels")
      .update({
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null,
      })
      .eq("id", reel.id);
    if (!err) {
      setReels((prev) =>
        prev.map((r) => r.id === reel.id ? { ...r, status: newStatus } : r)
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ތިޔަ ރީލް ޑިލީޓްކުރާނަންތަ؟")) return;
    await supabase.from("reels").delete().eq("id", id);
    setReels((prev) => prev.filter((r) => r.id !== id));
  };

  // Upload zone content
  const renderUploadZone = () => {
    if (uploadState === "idle") {
      return (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-foreground bg-muted" : "border-border hover:border-foreground/40"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={28} className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-body text-sm text-foreground font-semibold mb-1">
            ވީޑިއޯ ފައިލް ދަމާ ގެންނާ ނުވަތަ ކްލިކްކޮށްލާ
          </p>
          <p className="font-body text-xs text-muted-foreground">
            MP4, MOV, WebM · އެންމެ ބޮޑުވެގެން 10GB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      );
    }

    if (uploadState === "requesting") {
      return (
        <div className="border border-border rounded-xl p-8 text-center">
          <Loader2 size={24} className="mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="font-body text-sm text-muted-foreground">އަޕްލޯޑް URL ހޯދަނީ...</p>
        </div>
      );
    }

    if (uploadState === "uploading") {
      return (
        <div className="border border-border rounded-xl p-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-sm text-foreground font-semibold">އަޕްލޯޑްވަނީ...</p>
            <p className="font-body text-sm text-muted-foreground" dir="ltr">{uploadProgress}%</p>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-foreground h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      );
    }

    if (uploadState === "processing") {
      return (
        <div className="border border-border rounded-xl p-8 text-center">
          <Loader2 size={24} className="mx-auto mb-2 text-muted-foreground animate-spin" />
          <p className="font-body text-sm text-foreground font-semibold mb-1">ޕްރޮސެސްވަނީ...</p>
          <p className="font-body text-xs text-muted-foreground">ކުޑަ ވަގުތެއް ނަގާ، މަޑުކޮށްލާ</p>
        </div>
      );
    }

    if (uploadState === "ready") {
      return (
        <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-xl p-4 flex items-center gap-4">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="" className="w-16 aspect-[9/16] object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-500" />
              <p className="font-body text-sm text-green-700 dark:text-green-400 font-semibold">
                ވީޑިއޯ ތައްޔާރު!
              </p>
            </div>
            {durationSeconds && (
              <p className="font-body text-xs text-muted-foreground" dir="ltr">
                ⏱ {formatDuration(durationSeconds)}
              </p>
            )}
            <p className="font-body text-[11px] text-muted-foreground mt-0.5" dir="ltr">
              ID: {streamVideoId}
            </p>
          </div>
          <button type="button" onClick={resetForm}
            className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
      );
    }

    if (uploadState === "error") {
      return (
        <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 flex items-center justify-between">
          <p className="font-body text-sm text-destructive">{error}</p>
          <button type="button" onClick={resetForm}
            className="font-body text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
            އަލުން ކުރޭ
          </button>
        </div>
      );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-foreground">ރީލްސް</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            {reels.length} ވީޑިއޯ
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => { setFormOpen(true); resetForm(); }}
            className="flex items-center gap-2 font-body text-sm font-semibold px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity"
          >
            <Plus size={15} />
            އާ ރީލް
          </button>
        )}
      </div>

      {/* Add form */}
      {formOpen && (
        <div className="border border-border rounded-xl bg-background p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg text-foreground">އާ ރީލް</h2>
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1.5 block">ސުރުހީ</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ވީޑިއޯ ސުރުހީ..."
                className="w-full font-body text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-foreground transition-colors"
              />
            </div>

            {/* Upload zone */}
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1.5 block">ވީޑިއޯ</label>
              {renderUploadZone()}
            </div>

            {/* Category + homepage featured */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="font-body text-xs text-muted-foreground mb-1.5 block">ކެޓަގަރީ</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full font-body text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground outline-none focus:border-foreground transition-colors"
                >
                  <option value="">ކެޓަގަރީ ނެތް</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={homepageFeatured}
                  onChange={(e) => setHomepageFeatured(e.target.checked)}
                  className="rounded" />
                <span className="font-body text-sm text-foreground">ހޯމްޕޭޖްގައި ދައްކާ</span>
              </label>
            </div>

            {/* Error */}
            {error && uploadState !== "error" && (
              <p className="font-body text-sm text-destructive">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => handleSave(true)} disabled={saving || uploadState !== "ready"}
                className="font-body text-sm font-semibold px-5 py-2 rounded-lg bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40">
                {saving ? "..." : "ޝާއިއުކުރޭ"}
              </button>
              <button type="button" onClick={() => handleSave(false)} disabled={saving || uploadState !== "ready"}
                className="font-body text-sm px-5 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40">
                ޑްރާފްޓް
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reels grid */}
      {loading ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">ލޯޑްވަނީ...</p>
      ) : reels.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Play size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-body text-sm text-muted-foreground">ރީލެއް ނެތް. އާ ރީލެއް އިތުރުކޮށްލާ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {reels.map((reel) => (
            <div key={reel.id} className="group relative">
              <div className="aspect-[9/16] rounded-xl overflow-hidden bg-muted relative">
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={24} className="text-muted-foreground" />
                  </div>
                )}

                {reel.duration_seconds && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white font-body text-[10px] px-1.5 py-0.5 rounded" dir="ltr">
                    {formatDuration(reel.duration_seconds)}
                  </div>
                )}

                <div className={`absolute top-2 right-2 font-body text-[10px] px-2 py-0.5 rounded-full ${
                  reel.status === "published" ? "bg-green-500/90 text-white" : "bg-black/60 text-white"
                }`}>
                  {reel.status === "published" ? "ޝާއިއު" : "ޑްރާފްޓް"}
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => handleTogglePublish(reel)}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    {reel.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button type="button" onClick={() => handleDelete(reel.id)}
                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-white/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-2 px-0.5">
                <p className="font-body text-sm text-foreground line-clamp-2 leading-snug">{reel.title}</p>
                {reel.category && (
                  <p className="font-body text-[11px] text-muted-foreground mt-0.5">{reel.category.name}</p>
                )}
                {reel.homepage_featured && (
                  <span className="inline-block font-body text-[10px] text-green-600 mt-0.5">✦ ހޯމްޕޭޖް</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
