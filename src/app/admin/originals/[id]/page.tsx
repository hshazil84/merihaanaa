"use client";
// src/app/admin/originals/[id]/page.tsx

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPES = [
  { value: "documentary", label: "ޑޮކިއުމެންޓްރީ" },
  { value: "profile",     label: "ޕްރޮފައިލް" },
  { value: "episode",     label: "އެޕިސޯޑް" },
  { value: "segment",     label: "ސެގްމެންޓް" },
  { value: "interview",   label: "އިންޓަވިއު" },
  { value: "short",       label: "ޝޯޓް" },
];

const QUALITY_OPTIONS = [
  { value: "auto",  label: "Auto (Recommended)" },
  { value: "720p",  label: "720p max" },
  { value: "1080p", label: "1080p max" },
];

type UploadState = "idle" | "requesting" | "uploading" | "processing" | "ready" | "error";

function slugify(text: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  const latin = text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  if (latin.length >= 3) return `${latin}-${suffix}`;
  const wordCount = text.trim().split(/\s+/).length;
  return `original-${wordCount}w-${suffix}`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface SeriesItem { id: string; title: string; }

export default function OriginalsEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("documentary");
  const [seriesId, setSeriesId] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [qualityCap, setQualityCap] = useState("auto");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [streamId, setStreamId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");

  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [eta, setEta] = useState("");
  const uploadStartRef = useRef<number>(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [thumbUploading, setThumbUploading] = useState(false);
  const [grabbingThumb, setGrabbingThumb] = useState(false);

  // Load series list
  useEffect(() => {
    supabase.from("series").select("id, title").eq("is_active", true).order("title")
      .then(({ data }) => setSeriesList(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch("/api/originals")
      .then(r => r.json())
      .then(json => {
        const item = (json.data ?? []).find((d: any) => d.id === params.id);
        if (!item) { setLoading(false); return; }
        setTitle(item.title ?? "");
        setSlug(item.slug ?? "");
        setDescription(item.description ?? "");
        setType(item.type ?? "documentary");
        setSeriesId(item.series_id ?? "");
        setSeasonNumber(item.season_number?.toString() ?? "");
        setEpisodeNumber(item.episode_number?.toString() ?? "");
        setQualityCap(item.quality_cap ?? "auto");
        setStatus(item.status ?? "draft");
        setStreamId(item.cloudflare_stream_id ?? "");
        setThumbnailUrl(item.thumbnail_url ?? "");
        setDurationSeconds(item.duration_seconds?.toString() ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  function pollVideoStatus(videoId: string) {
    setUploadState("processing");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/stream/upload?id=${videoId}`);
        const data = await res.json();
        if (data.status === "ready" || data.readyToStream) {
          clearInterval(pollRef.current!);
          setThumbnailUrl(data.thumbnail ?? "");
          if (data.duration) setDurationSeconds(String(Math.round(data.duration)));
          setUploadState("ready");
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setUploadState("error");
          setUploadError("ވީޑިއޯ ޕްރޮސެސް ނުވި");
        }
      } catch {
        clearInterval(pollRef.current!);
        setUploadState("error");
        setUploadError("ޕޮލިން އެރާ");
      }
    }, 3000);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) { setUploadError("ވީޑިއޯ ފައިލެއް"); return; }
    setUploadError(""); setUploadState("requesting"); setUploadProgress(0);
    uploadStartRef.current = Date.now();
    try {
      const res = await fetch("/api/stream/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxDurationSeconds: 2400 }),
      });
      const { uploadUrl, videoId, error: apiError } = await res.json();
      if (apiError || !uploadUrl) throw new Error(apiError ?? "Upload URL ނުލިބުނު");
      setStreamId(videoId);
      setUploadState("uploading");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
            const elapsed = (Date.now() - uploadStartRef.current) / 1000;
            const rate = e.loaded / elapsed;
            const remaining = (e.total - e.loaded) / rate;
            if (remaining > 0 && remaining < 86400) {
              const m = Math.floor(remaining / 60);
              const s = Math.floor(remaining % 60);
              setEta(m > 0 ? `${m} މިނެޓް ${s} ސިކުންތު` : `${s} ސިކުންތު`);
            }
          }
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed: " + xhr.status));
        xhr.onerror = () => reject(new Error("ނެޓްވޯކް އެރާ"));
        xhr.open("POST", uploadUrl);
        const formData = new FormData();
        formData.append("file", file);
        xhr.send(formData);
      });

      pollVideoStatus(videoId);
    } catch (err: any) {
      setUploadState("error");
      setUploadError("އަޕްލޯޑް ނުވި: " + err.message);
    }
  }

  function handleAbort() {
    xhrRef.current?.abort();
    if (pollRef.current) clearInterval(pollRef.current);
    setUploadState("idle"); setUploadProgress(0); setEta("");
  }

  async function handleGrabThumbnail() {
    if (!streamId) return;
    setGrabbingThumb(true);
    const res = await fetch("/api/originals/grab-thumbnail", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId }),
    });
    const json = await res.json();
    if (json.url) setThumbnailUrl(json.url);
    setGrabbingThumb(false);
  }

  async function handleThumbnailFile(file: File) {
    setThumbUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-image", { method: "POST", body: formData });
    const json = await res.json();
    if (json.url) setThumbnailUrl(json.url);
    setThumbUploading(false);
  }

  async function handleSave(publish = false) {
    setSaving(true);
    const payload = {
      title, slug: slug || slugify(title), description, type,
      series_id: seriesId || null,
      season_number: seasonNumber ? parseInt(seasonNumber) : null,
      episode_number: episodeNumber ? parseInt(episodeNumber) : null,
      quality_cap: qualityCap,
      status: publish ? "published" : status,
      cloudflare_stream_id: streamId || null,
      thumbnail_url: thumbnailUrl || null,
      duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
    };

    if (isNew) {
      const res = await fetch("/api/originals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.data?.id) router.replace(`/admin/originals/${json.data.id}`);
    } else {
      await fetch("/api/originals", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, ...payload }),
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>ލޯޑްވަނީ...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/originals")} className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontFamily: "MVTypewriter, serif", fontSize: "20px", fontWeight: 700 }}>
            {isNew ? "އާ ވިޑިއޯ" : "ވިޑިއޯ އެޑިޓް"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            style={{ fontFamily: "MVTypewriter, serif" }}>
            {saved ? "✓ ސޭވްވެއްޖެ" : "ސޭވް"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || status === "published"}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50"
            style={{ fontFamily: "MVTypewriter, serif" }}>
            {status === "published" ? "✓ ޝާއިއުވެއްޖެ" : "ޝާއިއުކުރޭ"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ނަން</label>
          <input type="text" value={title}
            onChange={e => { setTitle(e.target.value); if (isNew && e.target.value.trim().length > 3) setSlug(slugify(e.target.value)); }}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވިޑިއޯގެ ނަން" />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Slug</label>
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm font-mono"
            placeholder="video-slug" />
        </div>

        {/* Type + Quality */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ބާވަތް</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Quality cap</label>
            <select value={qualityCap} onChange={e => setQualityCap(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white">
              {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </div>
        </div>

        {/* Series */}
        <div className="border border-neutral-200 rounded-xl p-4 space-y-4 bg-neutral-50">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "MVTypewriter, serif" }}>ސީރީސް</p>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ސީރީސް</label>
            <select value={seriesId} onChange={e => setSeriesId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
              <option value="">ސީރީސް ނެތް</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          {seriesId && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ސީޒަން</label>
                <input type="number" value={seasonNumber} onChange={e => setSeasonNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                  placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>އެޕިސޯޑް</label>
                <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                  placeholder="1" />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ތަފްސީލް</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވިޑިއޯގެ ތަފްސީލް" />
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ވިޑިއޯ</label>

          {uploadState === "idle" && !streamId && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors bg-neutral-50">
              <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ވިޑިއޯ ލިސްޓް ކުރޭ</span>
              <span className="text-xs text-neutral-400 mt-1">MP4, MOV, MKV</span>
              <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          )}

          {uploadState === "requesting" && (
            <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50 text-center">
              <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑް URL ހޯދަނީ...</p>
            </div>
          )}

          {uploadState === "uploading" && (
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600" style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑްވަނީ... {uploadProgress}%</span>
                <button onClick={handleAbort} className="text-xs text-red-500 hover:text-red-700" style={{ fontFamily: "MVTypewriter, serif" }}>ހުއްޓާލޭ</button>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              {eta && <p className="text-xs text-neutral-400 mt-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>ގާތްގަނޑަކަށް {eta} ތެރޭ ނިމޭނެ</p>}
            </div>
          )}

          {uploadState === "processing" && (
            <div className="p-6 rounded-xl border border-neutral-200 bg-neutral-50 text-center">
              <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-neutral-600 font-medium" style={{ fontFamily: "MVTypewriter, serif" }}>ޕްރޮސެސްވަނީ...</p>
              <p className="text-xs text-neutral-400 mt-1" style={{ fontFamily: "MVTypewriter, serif" }}>ކުޑަ ވަގުތެއް ނަގާ</p>
            </div>
          )}

          {uploadState === "ready" && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50">
              {thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-16 aspect-video object-cover rounded-lg flex-none" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <svg className="w-4 h-4 text-green-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700 font-medium" style={{ fontFamily: "MVTypewriter, serif" }}>ވީޑިއޯ ތައްޔާރު!</span>
                </div>
                {durationSeconds && <p className="text-xs text-neutral-500">{formatDuration(parseInt(durationSeconds))}</p>}
                <p className="text-[10px] text-neutral-400 font-mono truncate">{streamId}</p>
              </div>
              <button onClick={handleAbort} className="text-neutral-400 hover:text-neutral-600 flex-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {uploadState === "error" && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50">
              <span className="text-sm text-red-600">{uploadError}</span>
              <button onClick={() => setUploadState("idle")} className="text-xs text-red-500 underline ml-3 flex-none" style={{ fontFamily: "MVTypewriter, serif" }}>
                އަލުން ތަކުރާރު
              </button>
            </div>
          )}

          {uploadState === "idle" && streamId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <svg className="w-4 h-4 text-green-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 font-mono truncate">{streamId}</span>
              <button onClick={() => setStreamId("")} className="ml-auto text-green-500 hover:text-green-700 flex-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-3">
            <label className="block text-xs text-neutral-400 mb-1">ނުވަތަ Cloudflare Stream ID ޖައްސާ</label>
            <input type="text" value={streamId} onChange={e => setStreamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs font-mono"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ވަގުތު (ސިކުންތު)</label>
          <div className="flex items-center gap-3">
            <input type="number" value={durationSeconds} onChange={e => setDurationSeconds(e.target.value)}
              className="w-40 px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              placeholder="900" />
            {durationSeconds && (
              <span className="text-sm text-neutral-400" dir="ltr">= {Math.floor(parseInt(durationSeconds) / 60)} min {parseInt(durationSeconds) % 60} sec</span>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ތަމްބްނެއިލް</label>
          {thumbnailUrl && (
            <div className="relative w-48 aspect-video rounded-lg overflow-hidden mb-3 bg-neutral-100">
              <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
              <button onClick={() => setThumbnailUrl("")}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors text-sm text-neutral-700">
              {thumbUploading ? (
                <span style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑްވަނީ...</span>
              ) : (
                <span style={{ fontFamily: "MVTypewriter, serif" }}>ފޮޓޯ އިހްތިޔާރު</span>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])} />
            </label>
            {streamId && (
              <button onClick={handleGrabThumbnail} disabled={grabbingThumb}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm text-neutral-700 disabled:opacity-50"
                style={{ fontFamily: "MVTypewriter, serif" }}>
                {grabbingThumb ? "ނަގަނީ..." : "Stream އިން ނަގާ"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
