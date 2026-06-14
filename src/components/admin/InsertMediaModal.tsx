"use client";
// components/admin/InsertMediaModal.tsx

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  processImage, ASPECT_RATIOS, type AspectRatioKey,
  ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB,
} from "@/lib/imageUtils";
import { fetchVideoMeta } from "@/lib/videoUtils";
import { detectSocialProvider, SOCIAL_CONFIG } from "@/lib/socialUtils";
import type { OGPreviewResult } from "@/app/api/og-preview/route";
import {
  ImageIcon, Video, Share2, UploadCloud,
  Loader2, AlertCircle, X, AlignCenter,
  AlignLeft, AlignRight, ExternalLink,
  Library, Check, Search,
} from "lucide-react";

type Tab = "image" | "video" | "social";
type ImageSubTab = "upload" | "library";

export interface MediaBlockAttrs {
  type: "image" | "video" | "social";
  src?: string;
  alt?: string;
  caption?: string;
  aspectRatio?: string;
  videoId?: string;
  videoProvider?: "vimeo" | "youtube";
  videoThumbnail?: string | null;
  socialProvider?: "twitter" | "instagram" | "tiktok";
  socialUrl?: string;
  socialHtml?: string | null;
  socialThumb?: string;
  socialAuthor?: string;
  socialText?: string;
  size?: "full" | "half" | "small";
  align?: "center" | "left" | "right";
}

interface Props {
  open: boolean;
  onClose: () => void;
  onInsert: (attrs: MediaBlockAttrs) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "image",  label: "ފޮޓޯ",  icon: <ImageIcon size={14} /> },
  { id: "video",  label: "ވީޑިއޯ", icon: <Video size={14} /> },
  { id: "social", label: "ސޯޝަލް", icon: <Share2 size={14} /> },
];

export default function InsertMediaModal({ open, onClose, onInsert }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("image");
  const [size, setSize]   = useState<"full" | "half" | "small">("full");
  const [align, setAlign] = useState<"center" | "left" | "right">("center");

  if (!open) return null;

  const handleInsert = (attrs: Omit<MediaBlockAttrs, "size" | "align">) => {
    onInsert({ ...attrs, size, align });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-body text-sm font-semibold">މީޑިއާ އިންސާޓް ކޮށްލާ</h2>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-5 pt-4">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${activeTab === tab.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">
          {activeTab === "image"  && <ImageTab  onInsert={handleInsert} />}
          {activeTab === "video"  && <VideoTab  onInsert={handleInsert} />}
          {activeTab === "social" && <SocialTab onInsert={handleInsert} />}
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border flex items-center gap-6">
          <div className="space-y-1.5">
            <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ސައިޒު</p>
            <div className="flex gap-1">
              {(["full", "half", "small"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSize(s)}
                  className={`px-2.5 py-1 rounded-md font-body text-xs transition-all ${size === s ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                  {s === "full" ? "ފުރިހަމަ" : s === "half" ? "މެދު" : "ކުޑަ"}
                </button>
              ))}
            </div>
          </div>
          {size !== "full" && (
            <div className="space-y-1.5">
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ތަރުތީބު</p>
              <div className="flex gap-1">
                {([{ v: "right" as const, Icon: AlignRight }, { v: "center" as const, Icon: AlignCenter }, { v: "left" as const, Icon: AlignLeft }]).map(({ v, Icon }) => (
                  <button key={v} type="button" onClick={() => setAlign(v)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${align === v ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"}`}>
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Tab (with Upload + Library sub-tabs) ────────────

function ImageTab({ onInsert }: { onInsert: (attrs: Omit<MediaBlockAttrs, "size" | "align">) => void }) {
  const [subTab, setSubTab] = useState<ImageSubTab>("upload");

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
        <button type="button" onClick={() => setSubTab("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${subTab === "upload" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <UploadCloud size={13} /> އަޕްލޯޑް
        </button>
        <button type="button" onClick={() => setSubTab("library")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${subTab === "library" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Library size={13} /> ލައިބްރަރީ
        </button>
      </div>

      {subTab === "upload"  && <UploadSubTab  onInsert={onInsert} />}
      {subTab === "library" && <LibrarySubTab onInsert={onInsert} />}
    </div>
  );
}

// ── Upload sub-tab ────────────────────────────────────────

function UploadSubTab({ onInsert }: { onInsert: (attrs: Omit<MediaBlockAttrs, "size" | "align">) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("16:9");
  const [alt, setAlt]         = useState("");
  const [caption, setCaption] = useState("");

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) { setError("JPG · PNG · WebP · HEIC ބޭނުންކުރޭ"); return; }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { setError(`ފޮޓޯ ${MAX_IMAGE_SIZE_MB}MB ކުޑަ ވާން ޖެހޭ`); return; }
    setUploading(true); setProgress("ތައްޔާރު ކުރަނީ...");
    try {
      const ratio = ASPECT_RATIOS[aspectRatio];
      const blob = await processImage(file, { targetW: ratio.w, targetH: ratio.h });
      setProgress("ލޯޑް ކުރަނީ...");
      const formData = new FormData();
      formData.append("file", new File([blob], `body-${Date.now()}.webp`, { type: "image/webp" }));
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Upload failed");
      setPreview(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ފޮޓޯ ލޯޑް ނުވި");
    } finally { setUploading(false); setProgress(null); }
  }, [aspectRatio]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(ASPECT_RATIOS) as [AspectRatioKey, typeof ASPECT_RATIOS[AspectRatioKey]][]).map(([key, val]) => (
          <button key={key} type="button" onClick={() => { setAspectRatio(key); setPreview(null); }}
            className={`px-2.5 py-1 rounded-lg font-body text-xs transition-all ${aspectRatio === key ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"}`}>
            {val.label}
          </button>
        ))}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {preview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: aspectRatio.replace(":", "/") }}>
          <img src={preview} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => setPreview(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`w-full h-36 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${dragging ? "border-foreground bg-muted/40" : "border-border bg-muted/20 hover:border-foreground hover:bg-muted/30"}`}
        >
          {uploading
            ? <><Loader2 size={22} className="animate-spin text-muted-foreground" /><p className="font-body text-xs text-muted-foreground">{progress}</p></>
            : <><UploadCloud size={22} className="text-muted-foreground" /><p className="font-body text-xs text-muted-foreground">{dragging ? "ދޫކޮށްލާ" : "ފޮޓޯ ލޯޑްކޮށްލާ"}</p></>
          }
        </div>
      )}

      <div className="space-y-2">
        <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text..." dir="auto"
          className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
        <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="ކެޕްޝަން (އިހްތިޔާރީ)..." dir="rtl"
          className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
      </div>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <button type="button" onClick={() => preview && onInsert({ type: "image", src: preview, alt, caption, aspectRatio })}
        disabled={!preview} className="w-full py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity">
        ފޮޓޯ އިންސާޓް ކޮށްލާ
      </button>
    </div>
  );
}

// ── Library sub-tab ───────────────────────────────────────

interface MediaItem {
  id: string;
  url: string;
  filename: string | null;
}

function LibrarySubTab({ onInsert }: { onInsert: (attrs: Omit<MediaBlockAttrs, "size" | "align">) => void }) {
  const supabase = createClient();
  const [items, setItems]       = useState<MediaItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [alt, setAlt]           = useState("");
  const [caption, setCaption]   = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("media")
        .select("id, url, filename")
        .order("created_at", { ascending: false })
        .limit(48);
      if (search.trim()) query = query.ilike("filename", `%${search.trim()}%`);
      const { data } = await query;
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ހޯދާ..."
          dir="rtl"
          className="w-full font-body text-xs pr-8 pl-3 py-2 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground transition-colors"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="font-body text-xs text-muted-foreground">ފޮޓޯތަކެއް ނެތް</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(selected?.id === item.id ? null : item)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected?.id === item.id ? "border-foreground" : "border-transparent hover:border-border"}`}
            >
              <img src={item.url} alt={item.filename ?? ""} className="w-full h-full object-cover" loading="lazy" />
              {selected?.id === item.id && (
                <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                    <Check className="w-3 h-3 text-background" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected detail */}
      {selected && (
        <div className="space-y-2 pt-1 border-t border-border">
          <div className="flex items-center gap-3">
            <img src={selected.url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <p className="font-body text-xs text-muted-foreground truncate flex-1">{selected.filename ?? selected.url}</p>
          </div>
          <input type="text" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text..." dir="auto"
            className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="ކެޕްޝަން (އިހްތިޔާރީ)..." dir="rtl"
            className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
        </div>
      )}

      <button type="button"
        onClick={() => selected && onInsert({ type: "image", src: selected.url, alt, caption })}
        disabled={!selected}
        className="w-full py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity">
        ފޮޓޯ އިންސާޓް ކޮށްލާ
      </button>
    </div>
  );
}

// ── Video Tab ─────────────────────────────────────────────

function VideoTab({ onInsert }: { onInsert: (attrs: Omit<MediaBlockAttrs, "size" | "align">) => void }) {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [meta, setMeta]       = useState<Awaited<ReturnType<typeof fetchVideoMeta>> | null>(null);
  const [caption, setCaption] = useState("");

  const handleFetch = async () => {
    if (!url.trim()) return;
    setError(null); setLoading(true);
    try { setMeta(await fetchVideoMeta(url.trim())); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "ލިންކް ރަނގަޅެއް ނޫން"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setMeta(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetch(); } }}
          placeholder="Vimeo · YouTube ލިންކް..." dir="ltr"
          className="flex-1 font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
        <FetchBtn onClick={handleFetch} loading={loading} disabled={!url.trim()} />
      </div>
      {meta && (
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="relative" style={{ aspectRatio: "16/9" }}>
            {meta.thumbnailUrl
              ? <img src={meta.thumbnailUrl} alt={meta.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-muted flex items-center justify-center"><Video size={32} className="text-muted-foreground" /></div>
            }
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-lg ml-0.5">▶</span>
              </div>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm">
              <span className="font-body text-[10px] text-white/80 uppercase">{meta.provider}</span>
            </div>
          </div>
          <div className="p-3">
            <p className="font-body text-xs font-semibold line-clamp-1">{meta.title}</p>
            {meta.authorName && <p className="font-body text-[10px] text-muted-foreground mt-0.5">{meta.authorName}</p>}
          </div>
        </div>
      )}
      <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)}
        placeholder="ކެޕްޝަން (އިހްތިޔާރީ)..." dir="rtl"
        className="w-full font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <button type="button"
        onClick={() => meta && onInsert({ type: "video", videoId: meta.videoId, videoProvider: meta.provider, videoThumbnail: meta.thumbnailUrl, caption })}
        disabled={!meta} className="w-full py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity">
        ވީޑިއޯ އިންސާޓް ކޮށްލާ
      </button>
    </div>
  );
}

// ── Social Tab ────────────────────────────────────────────

function SocialTab({ onInsert }: { onInsert: (attrs: Omit<MediaBlockAttrs, "size" | "align">) => void }) {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [preview, setPreview] = useState<OGPreviewResult | null>(null);

  const detectedProvider = url.trim() ? detectSocialProvider(url.trim()) : null;

  const handleFetch = async () => {
    if (!url.trim() || !detectedProvider) return;
    setError(null); setLoading(true);
    try {
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ލިންކް ލިބޭ ގޮތް ނުވި");
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ލިންކް ރަނގަޅެއް ނޫން");
    } finally { setLoading(false); }
  };

  const handleInsert = () => {
    if (!preview || !detectedProvider) return;
    onInsert({
      type: "social",
      socialProvider: detectedProvider,
      socialUrl: url.trim(),
      socialHtml: null,
      socialThumb: preview.thumbnailUrl ?? undefined,
      socialAuthor: preview.authorHandle ?? undefined,
      socialText: preview.text ?? undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["twitter", "instagram", "tiktok"] as const).map((p) => {
          const cfg = SOCIAL_CONFIG[p];
          const isDetected = detectedProvider === p;
          return (
            <span key={p} className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-body text-xs transition-all border ${isDetected ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
              {cfg.icon} {cfg.label}
            </span>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input type="text" value={url} onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFetch(); } }}
          placeholder="ޕޯސްޓް ލިންކް ޖަހާ..." dir="ltr"
          className="flex-1 font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors" />
        <FetchBtn onClick={handleFetch} loading={loading} disabled={!url.trim() || !detectedProvider} />
      </div>
      {preview && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="block rounded-xl border border-border overflow-hidden hover:border-foreground transition-colors group/card no-underline">
          {preview.thumbnailUrl && <img src={preview.thumbnailUrl} alt="" className="w-full h-44 object-cover" />}
          <div className="p-3 space-y-2 bg-background">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {detectedProvider && <span className="text-base leading-none">{SOCIAL_CONFIG[detectedProvider].icon}</span>}
                <div>
                  {preview.authorHandle && <p className="font-body text-xs font-semibold text-foreground">{preview.authorHandle}</p>}
                  {detectedProvider === "instagram" && !preview.authorHandle && (
                    <p className="font-body text-xs text-muted-foreground">Instagram ޕޯސްޓް</p>
                  )}
                </div>
              </div>
              <ExternalLink size={13} className="text-muted-foreground opacity-0 group-hover/card:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            {preview.text && <p className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-3" dir="auto">{preview.text}</p>}
            {detectedProvider === "instagram" && (
              <p className="font-body text-[10px] text-muted-foreground/60 italic">ލިޔުމުގައި ދައްކާނީ ފުރިހަމަ ޕޯސްޓް</p>
            )}
            <p className="font-body text-[10px] text-muted-foreground/50 truncate">{url}</p>
          </div>
        </a>
      )}
      {error && <ErrorMsg>{error}</ErrorMsg>}
      <button type="button" onClick={handleInsert} disabled={!preview}
        className="w-full py-2.5 rounded-xl bg-foreground text-background font-body text-sm font-semibold disabled:opacity-30 hover:opacity-80 transition-opacity">
        ޕޯސްޓް އިންސާޓް ކޮށްލާ
      </button>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────

function FetchBtn({ onClick, loading, disabled }: { onClick: () => void; loading: boolean; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className="px-4 py-2 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 transition-opacity hover:opacity-80">
      {loading && <Loader2 size={12} className="animate-spin" />}
      {loading ? "ލޯޑް..." : "ލިންކް"}
    </button>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
      <AlertCircle size={13} className="text-destructive flex-shrink-0 mt-0.5" />
      <p className="font-body text-xs text-destructive">{children}</p>
    </div>
  );
}
