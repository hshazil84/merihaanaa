"use client";
// src/app/admin/originals/[id]/page.tsx

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as tus from "tus-js-client";

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

function slugify(text: string) {
  const suffix = Math.random().toString(36).slice(2, 6);
  const latin = text.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  if (latin.length >= 3) return `${latin}-${suffix}`;
  const wordCount = text.trim().split(/\s+/).length;
  return `original-${wordCount}w-${suffix}`;
}

export default function OriginalsEditPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("documentary");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [qualityCap, setQualityCap] = useState("auto");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [streamId, setStreamId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [eta, setEta] = useState("");
  const uploadStartRef = useRef<number>(0);
  const tusUploadRef = useRef<tus.Upload | null>(null);

  const [thumbUploading, setThumbUploading] = useState(false);
  const [grabbingThumb, setGrabbingThumb] = useState(false);

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

  async function handleVideoFile(file: File) {
    if (!file) return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    uploadStartRef.current = Date.now();

    // Step 1: get streamId from our API (response also has Location header with CF upload URL)
    const initRes = await fetch("/api/originals/stream-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, maxDurationSeconds: 2400 }),
    });

    if (!initRes.ok) {
      setUploadStatus("error");
      setUploadError("Upload URL ލިބޭގޮތެއް ނުވި");
      return;
    }

    const initJson = await initRes.json();
    setStreamId(initJson.streamId);

    // Step 2: tus uses endpoint pointing to our route; our route returns 201 + Location
    // tus reads Location header and uploads directly to Cloudflare from there
    const upload = new tus.Upload(file, {
      endpoint: "/api/originals/stream-upload",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 50 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      storeFingerprintForResuming: false,
      metadata: {
        filename: file.name,
        filetype: file.type || "video/mp4",
      },

      onProgress(bytesUploaded, bytesTotal) {
        const pct = Math.round((bytesUploaded / bytesTotal) * 100);
        setUploadProgress(pct);
        const elapsed = (Date.now() - uploadStartRef.current) / 1000;
        const rate = bytesUploaded / elapsed;
        const remaining = (bytesTotal - bytesUploaded) / rate;
        if (remaining > 0 && remaining < 86400) {
          const m = Math.floor(remaining / 60);
          const s = Math.floor(remaining % 60);
          setEta(m > 0 ? `${m} މިނެޓް ${s} ސިކުންތު` : `${s} ސިކުންތު`);
        }
      },
      onSuccess() {
        setUploadStatus("done");
        setUploadProgress(100);
        setEta("");
      },
      onError(err) {
        setUploadStatus("error");
        setUploadError(err.message);
      },
    });

    tusUploadRef.current = upload;
    upload.start();
  }

  function handleAbort() {
    tusUploadRef.current?.abort();
    setUploadStatus("idle");
    setUploadProgress(null);
    setEta("");
  }

  async function handleGrabThumbnail() {
    if (!streamId) return;
    setGrabbingThumb(true);
    const res = await fetch("/api/originals/grab-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      title,
      slug: slug || slugify(title),
      description,
      type,
      episode_number: episodeNumber ? parseInt(episodeNumber) : null,
      quality_cap: qualityCap,
      status: publish ? "published" : status,
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
      if (json.data?.id) router.replace(`/admin/originals/${json.data.id}`);
    } else {
      await fetch("/api/originals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, ...payload }),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400" style={{ fontFamily: "MVTypewriter, serif" }}>
        ލޯޑްވަނީ...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
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
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ނަން</label>
          <input type="text" value={title}
            onChange={e => { setTitle(e.target.value); if (isNew && e.target.value.trim().length > 3) setSlug(slugify(e.target.value)); }}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވިޑިއޯގެ ނަން" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Slug</label>
          <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm font-mono"
            placeholder="video-slug" />
        </div>

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

        {type === "episode" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>އެޕިސޯޑް ނަންބަރ</label>
            <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)}
              className="w-32 px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              placeholder="1" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ތަފްސީލް</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
            style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }} placeholder="ވިޑިއޯގެ ތަފްސީލް" />
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ވިޑިއޯ</label>

          {streamId && uploadStatus !== "uploading" && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-green-50 border border-green-200">
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

          {uploadStatus === "uploading" && (
            <div className="mb-3 p-4 rounded-lg border border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600" style={{ fontFamily: "MVTypewriter, serif" }}>
                  އަޕްލޯޑްވަނީ... {uploadProgress}%
                </span>
                <button onClick={handleAbort} className="text-xs text-red-500 hover:text-red-700" style={{ fontFamily: "MVTypewriter, serif" }}>
                  ހުއްޓާލޭ
                </button>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-900 rounded-full transition-all duration-300" style={{ width: `${uploadProgress ?? 0}%` }} />
              </div>
              {eta && <p className="text-xs text-neutral-400 mt-1.5" style={{ fontFamily: "MVTypewriter, serif" }}>ގާތްގަނޑަކަށް {eta} ތެރޭ ނިމޭނެ</p>}
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center justify-between">
              <span>{uploadError}</span>
              <button onClick={() => setUploadStatus("idle")} className="ml-3 underline text-xs flex-none" style={{ fontFamily: "MVTypewriter, serif" }}>
                އަލުން ތަކުރާރު
              </button>
            </div>
          )}

          {uploadStatus !== "uploading" && !streamId && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-200 rounded-xl cursor-pointer hover:border-neutral-400 transition-colors bg-neutral-50">
              <svg className="w-8 h-8 text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-neutral-500" style={{ fontFamily: "MVTypewriter, serif" }}>ވިޑިއޯ ލިސްޓް ކުރޭ</span>
              <span className="text-xs text-neutral-400 mt-1">MP4, MOV, MKV</span>
              <input type="file" accept="video/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />
            </label>
          )}

          <div className="mt-3">
            <label className="block text-xs text-neutral-400 mb-1">ނުވަތަ Cloudflare Stream ID ޖައްސާ</label>
            <input type="text" value={streamId} onChange={e => setStreamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-xs font-mono"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5" style={{ fontFamily: "MVTypewriter, serif", direction: "rtl" }}>ވަގުތު (ސިކުންތު)</label>
          <div className="flex items-center gap-3">
            <input type="number" value={durationSeconds} onChange={e => setDurationSeconds(e.target.value)}
              className="w-40 px-3 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              placeholder="900" />
            {durationSeconds && (
              <span className="text-sm text-neutral-400">
                = {Math.floor(parseInt(durationSeconds) / 60)} min {parseInt(durationSeconds) % 60} sec
              </span>
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
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontFamily: "MVTypewriter, serif" }}>ފޮޓޯ އިހްތިޔާރު</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])} />
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
