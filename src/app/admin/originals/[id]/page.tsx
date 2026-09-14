"use client";
// src/app/admin/originals/[id]/page.tsx

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPES = [
  { value: "documentary", label: "ޑޮކިއުމެންޓްރީ" },
  { value: "profile",     label: "ޕްރޮފައިލް" },
  { value: "segment",     label: "ސެގްމެންޓް" },
  { value: "interview",   label: "އިންޓަވިއު" },
  { value: "short",       label: "ޝޯޓް" },
];

const QUALITY_OPTIONS = [
  { value: "auto",  label: "Auto (Recommended)" },
  { value: "720p",  label: "720p max" },
  { value: "1080p", label: "1080p max" },
];

// Cloudflare rejects single-POST direct uploads above 200MB with a 413.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

type UploadState = "idle" | "requesting" | "uploading" | "processing" | "ready" | "error";
type VideoKind = "single" | "episode";

function slugify(text: string) {
  const suffix = Math.random().toString(36).slice(2, 7);
  // Match Latin characters if present
  const latin = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (latin.length >= 3) return `${latin}-${suffix}`;
  
  // Safe timestamp-based slug for Thaana/non-Latin titles to avoid empty dashes
  return `vid-${Date.now().toString(36)}-${suffix}`;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatMB(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}

interface SeriesItem { id: string; title: string; }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "MVTypewriter, serif" }}>
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Create Series Modal ──────────────────────────────────────
function CreateSeriesModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (s: SeriesItem) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!title.trim()) { setError("ނަން ލިޔޭ"); return; }
    setSaving(true);
    const slug = slugify(title);
    const { data, error: err } = await supabase
      .from("series")
      .insert({ title: title.trim(), slug, description: description || null, is_active: true })
      .select("id, title")
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreate(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-neutral-900" style={{ fontFamily: "MVTypewriter, serif" }}>
            އާ ސީރީޒް
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>
              ސީރީޒްގެ ނަން
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
              placeholder="ސީރީޒްގެ ނަން..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>
              ތަފްސީލް (އިޚްތިޔާރީ)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
              style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}
              placeholder="ސީރީޒްގެ ތަފްސީލް..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" style={{ fontFamily: "MVTypewriter, serif" }}>{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              {saving ? "ސޭވްވަނީ..." : "ހަދާ"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              style={{ fontFamily: "MVTypewriter, serif" }}
            >
              ކެންސަލް
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OriginalsEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveWarning, setSaveWarning] = useState("");
  const [showSeriesModal, setShowSeriesModal] = useState(false);

  const [videoKind, setVideoKind] = useState<VideoKind>("single");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("documentary");
  const [qualityCap, setQualityCap] = useState("auto");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [scheduledAt, setScheduledAt] = useState("");

  const [seriesId, setSeriesId] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);

  const [streamId, setStreamId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [eta, setEta] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const uploadStartRef = useRef<number>(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [thumbUploading, setThumbUploading] = useState(false);
  const [grabbingThumb, setGrabbingThumb] = useState(false);

  const uploadInFlight =
    uploadState === "requesting" || uploadState === "uploading" || uploadState === "processing";

  async function loadSeries() {
    const { data } = await supabase.from("series").select("id, title").eq("is_active", true).order("title");
    setSeriesList(data ?? []);
  }

  useEffect(() => { loadSeries(); }, []);

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
        setQualityCap(item.quality_cap ?? "auto");
        setStatus(item.status ?? "draft");
        setStreamId(item.cloudflare_stream_id ?? "");
        setThumbnailUrl(item.thumbnail_url ?? "");
        setDurationSeconds(item.duration_seconds?.toString() ?? "");
        if (item.series_id) {
          setVideoKind("episode");
          setSeriesId(item.series_id ?? "");
          setSeasonNumber(item.season_number?.toString() ?? "");
          setEpisodeNumber(item.episode_number?.toString() ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id, isNew]);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  function pollVideoStatus(videoId: string) {
    setUploadState("processing");
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 200) {
        clearInterval(pollRef.current!);
        setUploadState("error");
        setUploadError("ވީޑިއޯ ޕްރޮސެސް ވުން ލަސްވެއްޖެ");
        return;
      }
      try {
        const res = await fetch(`/api/stream/upload?id=${videoId}`);
        const data = await res.json();
        if (!res.ok) return;
        if (data.status === "ready" || data.readyToStream) {
          clearInterval(pollRef.current!);
          setStreamId(videoId);
          if (data.thumbnail) setThumbnailUrl(data.thumbnail);
          if (data.duration) setDurationSeconds(String(Math.round(data.duration)));
          setUploadState("ready");
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setUploadState("error");
          setUploadError("ވީޑިއޯ ޕްރޮސެސް ނުވި");
        }
      } catch {
        // network polling retry
      }
    }, 3000);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) { setUploadError("ވީޑިއޯ ފައިލެއް ހޮވާ"); return; }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadState("error");
      setUploadError(
        `ފައިލް ބޮޑު (${formatMB(file.size)}MB). 200MB އަށް ވުރެ ބޮޑު ވީޑިއޯ Cloudflare ޑޭޝްބޯޑުން އަޕްލޯޑްކޮށް، Stream ID ތިރީގައި ޖަހާ`
      );
      return;
    }
    setUploadError(""); setUploadState("requesting"); setUploadProgress(0);
    uploadStartRef.current = Date.now();
    try {
      const res = await fetch("/api/stream/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxDurationSeconds: 2400 }),
      });
      const { uploadUrl, videoId, error: apiError } = await res.json();
      if (apiError || !uploadUrl) throw new Error(apiError ?? "Upload URL ނުލިބުނު");

      // Retain Stream ID immediately so saving drafts doesn't clear the relation
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
    setSaveWarning("");
    if (uploadInFlight && publish) {
      setSaveWarning("ވީޑިއޯ އަޕްލޯޑް ނިމެންދެން މަޑުކުރޭ");
      return;
    }
    if (publish && !streamId) {
      setSaveWarning("ޝާއިޢުކުރެވޭނީ ވީޑިއޯ ތައްޔާރުވުމުން");
      return;
    }

    setSaving(true);
    const payload = {
      title,
      slug: slug || slugify(title),
      description,
      type: videoKind === "episode" ? "episode" : type,
      series_id: videoKind === "episode" ? (seriesId || null) : null,
      season_number: videoKind === "episode" && seasonNumber ? parseInt(seasonNumber) : null,
      episode_number: videoKind === "episode" && episodeNumber ? parseInt(episodeNumber) : null,
      quality_cap: qualityCap,
      status: publish ? "published" : "draft",
      scheduled_at: scheduledAt || null,
      cloudflare_stream_id: streamId || null,
      thumbnail_url: thumbnailUrl || null,
      duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
    };

    if (isNew) {
      const res = await fetch("/api/originals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveWarning(json.error || "ސޭވްއެއް ނުވި");
        setSaving(false);
        return;
      }
      if (json.data?.id) router.replace(`/admin/originals/${json.data.id}`);
    } else {
      const res = await fetch("/api/originals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveWarning(json.error || "ސޭވްއެއް ނުވި");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    if (publish) setStatus("published");
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>ލޯޑްވަނީ...</div>;
  }

  return (
    <>
      {showSeriesModal && (
        <CreateSeriesModal
          onClose={() => setShowSeriesModal(false)}
          onCreate={(s) => {
            setSeriesList(prev => [...prev, s]);
            setSeriesId(s.id);
            setShowSeriesModal(false);
          }}
        />
      )}

      <div className="max-w-2xl mx-auto p-6 pb-32" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push("/admin/originals")} className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 style={{ fontFamily: "MVTypewriter, serif", fontSize: "20px", fontWeight: 700 }}>
            {isNew ? "އާ ވީޑިއޯ" : "ވީޑިއޯ އެޑިޓް"}
          </h1>
        </div>

        <div className="space-y-5">

          {/* Step 1 — Video kind */}
          <SectionCard title="1. ވީޑިއޯގެ ބާވަތް">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "single", label: "ވަކި ވީޑިއޯ", sub: "Single Video" },
                { value: "episode", label: "ސީރީޒް / އެޕިސޯޑް", sub: "Series Episode" },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setVideoKind(opt.value as VideoKind)}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-right ${
                    videoKind === opt.value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:border-neutral-400 text-neutral-700"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${
                    videoKind === opt.value ? "border-white" : "border-neutral-400"
                  }`}>
                    {videoKind === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <p className="text-sm font-bold" style={{ fontFamily: "MVTypewriter, serif" }}>{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${videoKind === opt.value ? "text-white/60" : "text-neutral-400"}`}>{opt.sub}</p>
                </button>
              ))}
            </div>

            {videoKind === "episode" && (
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>
                    ސީރީޒްގެ ނަން
                  </label>
                  <div className="flex items-center gap-2">
                    <select value={seriesId} onChange={e => setSeriesId(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
                      style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                      <option value="">ސީރީޒް ހޮވާ...</option>
                      {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowSeriesModal(true)}
                      className="flex-none px-3 py-2.5 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors whitespace-nowrap"
                      style={{ fontFamily: "MVTypewriter, serif" }}
                    >
                      + އާ ސީރީޒް
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="ސީޒަން ނަންބަރު">
                    <input type="number" value={seasonNumber} onChange={e => setSeasonNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      placeholder="1" dir="ltr" />
                  </Field>
                  <Field label="އެޕިސޯޑް ނަންބަރު">
                    <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      placeholder="1" dir="ltr" />
                  </Field>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Step 2 — Video file */}
          <SectionCard title="2. ވީޑިއޯ ފައިލް">
            {uploadState === "idle" && !streamId && (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="w-8 h-8 text-neutral-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-neutral-700 mb-1" style={{ fontFamily: "MVTypewriter, serif" }}>
                  ވީޑިއޯ ފައިލް ދަމާ ގެންނަވާ
                </p>
                <p className="text-xs text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>
                  ނުވަތަ ފައިލް ހޮވުމަށް ފިތާލާ · MP4, MOV, MKV · max 200MB
                </p>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            )}

            {uploadState === "requesting" && (
              <div className="p-8 text-center">
                <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑް URL ހޯދަނީ...</p>
              </div>
            )}

            {uploadState === "uploading" && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-neutral-700" style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑްވަނީ...</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 tabular-nums" dir="ltr">{uploadProgress}%</span>
                    <button onClick={handleAbort} className="text-xs text-red-500 hover:text-red-700" style={{ fontFamily: "MVTypewriter, serif" }}>ހުއްޓާލާ</button>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-900 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                {eta && <p className="text-xs text-neutral-400 mt-2" style={{ fontFamily: "MVTypewriter, serif" }}>ގާތްގަނޑަކަށް {eta} ތެރޭ ނިމޭނެ</p>}
              </div>
            )}

            {uploadState === "processing" && (
              <div className="p-8 text-center">
                <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-700" style={{ fontFamily: "MVTypewriter, serif" }}>ޕްރޮސެސްވަނީ...</p>
                <p className="text-xs text-neutral-400 mt-1" style={{ fontFamily: "MVTypewriter, serif" }}>ކުޑަ ވަގުތެއް ނަގާ</p>
              </div>
            )}

            {uploadState === "ready" && (
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                {thumbnailUrl && <img src={thumbnailUrl} alt="" className="w-20 aspect-video object-cover rounded-lg flex-none" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-green-500 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-semibold text-green-700" style={{ fontFamily: "MVTypewriter, serif" }}>ވީޑިއޯ ތައްޔާރު</span>
                  </div>
                  {durationSeconds && <p className="text-xs text-neutral-500 tabular-nums">{formatDuration(parseInt(durationSeconds))}</p>}
                  <p className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">{streamId}</p>
                </div>
                <button onClick={handleAbort} className="text-neutral-400 hover:text-neutral-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {uploadState === "error" && (
              <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex-1" style={{ fontFamily: "MVTypewriter, serif", lineHeight: 1.9 }}>{uploadError}</p>
                <button onClick={() => { setUploadState("idle"); setUploadError(""); }} className="text-xs text-red-500 underline flex-none" style={{ fontFamily: "MVTypewriter, serif" }}>
                  އަލުން ތަކުރާރު
                </button>
              </div>
            )}

            {uploadState === "idle" && streamId && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <svg className="w-4 h-4 text-green-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700 font-mono truncate flex-1">{streamId}</span>
                <button onClick={() => setStreamId("")} className="text-green-500 hover:text-green-700 flex-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <label className="block text-xs text-neutral-400 mb-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>
                ނުވަތަ Cloudflare Stream ID ލިޔޭ
              </label>
              <input type="text" value={streamId} onChange={e => setStreamId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs font-mono"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" dir="ltr" />
            </div>
          </SectionCard>

          {/* Step 3 — Details */}
          <SectionCard title="3. ތަފްސީލް">
            <div className="space-y-4">
              <Field label="ސުރުޚީ">
                <input type="text" value={title}
                  onChange={e => {
                    const val = e.target.value;
                    setTitle(val);
                    if (isNew && val.trim().length > 2) {
                      setSlug(slugify(val));
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                  style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވީޑިއޯގެ ސުރުޚީ" />
              </Field>
              <Field label="ތަފްސީލް">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
                  style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވީޑިއޯގެ ތަފްސީލް" />
              </Field>
              {videoKind === "single" && (
                <Field label="ބާވަތް">
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white"
                    style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Slug">
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm font-mono"
                  placeholder="video-slug" dir="ltr" />
              </Field>
            </div>
          </SectionCard>

          {/* Step 4 — Thumbnail */}
          <SectionCard title="4. ތަމްބްނެއިލް">
            {thumbnailUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-neutral-100">
                <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                <button onClick={() => setThumbnailUrl("")}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-xl bg-neutral-100 flex items-center justify-center mb-4 border border-dashed border-neutral-300">
                <p className="text-sm text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>ތަމްބްނެއިލް ނެތް</p>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors text-sm text-neutral-700">
                {thumbUploading ? (
                  <span style={{ fontFamily: "MVTypewriter, serif" }}>އަޕްލޯޑްވަނީ...</span>
                ) : (
                  <span style={{ fontFamily: "MVTypewriter, serif" }}>ފޮޓޯ ހޮވާ</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])} />
              </label>
              {streamId && (
                <button onClick={handleGrabThumbnail} disabled={grabbingThumb}
                  className="px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm text-neutral-700 disabled:opacity-50"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  {grabbingThumb ? "ނަގަނީ..." : "Stream އިން ނަގާ"}
                </button>
              )}
            </div>
          </SectionCard>

          {/* Step 5 — Settings */}
          <SectionCard title="5. ސެޓިންގްސް">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quality">
                  <select value={qualityCap} onChange={e => setQualityCap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm bg-white" dir="ltr">
                    {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </Field>
                <Field label="ވަގުތު (ސިކުންތު)">
                  <input type="number" value={durationSeconds} onChange={e => setDurationSeconds(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                    placeholder="900" dir="ltr" />
                  {durationSeconds && (
                    <p className="text-xs text-neutral-400 mt-1 tabular-nums" dir="ltr">
                      = {Math.floor(parseInt(durationSeconds) / 60)} min {parseInt(durationSeconds) % 60} sec
                    </p>
                  )}
                </Field>
              </div>
              <Field label="ތާރީޚު (އިޚްތިޔާރީ)">
                <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm" dir="ltr" />
              </Field>
            </div>
          </SectionCard>

        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-4 z-40">
          <div className="max-w-2xl mx-auto">
            {saveWarning && (
              <p className="text-xs text-amber-600 mb-2 text-center" style={{ fontFamily: "MVTypewriter, serif" }}>
                {saveWarning}
              </p>
            )}
            <div className="flex items-center justify-between">
              <button onClick={() => router.push("/admin/originals")}
                className="px-5 py-2.5 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
                style={{ fontFamily: "MVTypewriter, serif" }}>
                ކެންސަލް
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => handleSave(false)} disabled={saving}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  {saved ? "✓ ސޭވްވެއްޖެ" : "ޑްރާފްޓް ސޭވް"}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving || uploadInFlight || status === "published"}
                  className="px-5 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "MVTypewriter, serif" }}>
                  {status === "published" ? "ޝާއިޢުވެއްޖެ" : "ޝާއިޢުކުރޭ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
