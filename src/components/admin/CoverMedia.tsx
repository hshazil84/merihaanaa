"use client";
// components/admin/CoverMedia.tsx

import { useRef, useState, useCallback } from "react";
import {
  processImage,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_MB,
} from "@/lib/imageUtils";
import { fetchVideoMeta, type VideoMeta } from "@/lib/videoUtils";
import {
  ImageIcon, UploadCloud, X, Loader2, AlertCircle, Video, Play,
} from "lucide-react";

export type CoverMediaType = "image" | "video";

export interface CoverMediaValue {
  type: CoverMediaType;
  imageUrl?: string;
  videoMeta?: VideoMeta;
}

interface Props {
  value: CoverMediaValue | null;
  onChange: (value: CoverMediaValue | null) => void;
}

export default function CoverMedia({ value, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<CoverMediaType>(value?.type ?? "image");
  const handleClear = () => onChange(null);

  return (
    <div className="w-full space-y-3">
      {!value && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 w-fit">
          <TabBtn active={activeTab === "image"} onClick={() => setActiveTab("image")}>
            <ImageIcon size={12} /> ފޮޓޯ
          </TabBtn>
          <TabBtn active={activeTab === "video"} onClick={() => setActiveTab("video")}>
            <Video size={12} /> ވީޑިއޯ
          </TabBtn>
        </div>
      )}
      {value ? (
        <CoverPreview value={value} onClear={handleClear} />
      ) : activeTab === "image" ? (
        <ImageUploader onChange={onChange} />
      ) : (
        <VideoEmbedInput onChange={onChange} />
      )}
    </div>
  );
}

function CoverPreview({ value, onClear }: { value: CoverMediaValue; onClear: () => void }) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden group bg-black" style={{ aspectRatio: "16/9" }}>
      {value.type === "image" && value.imageUrl ? (
        <img src={value.imageUrl} alt="ކަވަރ" className="w-full h-full object-cover" />
      ) : value.type === "video" && value.videoMeta ? (
        <div className="relative w-full h-full">
          {value.videoMeta.thumbnailUrl && (
            <img src={value.videoMeta.thumbnailUrl} alt={value.videoMeta.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play size={24} className="text-white fill-white ml-1" />
            </div>
            <p className="font-body text-xs text-white/80 px-4 text-center line-clamp-1">{value.videoMeta.title}</p>
            <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm font-body text-[10px] text-white/60 uppercase tracking-wider">
              {value.videoMeta.provider === "vimeo" ? "Vimeo" : "YouTube"}
            </span>
          </div>
        </div>
      ) : null}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        <button type="button" onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/80 backdrop-blur-sm text-white font-body text-sm hover:bg-red-500 transition-colors">
          <X size={15} /> ބަދަލުކޮށްލާ
        </button>
      </div>
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
        <span className="font-body text-[10px] text-white/80">
          {value.type === "image" ? "Cloudflare Images" : value.videoMeta?.provider === "vimeo" ? "Vimeo" : "YouTube"}
        </span>
      </div>
    </div>
  );
}

// ── Image uploader — uploads via /api/upload-image → Cloudflare Images ──

function ImageUploader({ onChange }: { onChange: (v: CoverMediaValue) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) {
      setError("ފޮޓޯ ފޯމެޓް ރަނގަޅު ނޫން. JPG · PNG · WebP · HEIC ބޭނުންކުރޭ");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`ފޮޓޯ ${MAX_IMAGE_SIZE_MB}MB އަށް ވުރެ ކުޑަ ވާން ޖެހޭ`);
      return;
    }

    setUploading(true);
    setProgress("ފޮޓޯ ތައްޔާރު ކުރަނީ...");

    try {
      // Process image to WebP 1600×900
      const blob = await processImage(file, { targetW: 1600, targetH: 900 });
      setProgress("ކްލাউޑަށް ލޯޑް ކުރަނީ...");

      // Upload via server-side API route → Cloudflare Images
      const formData = new FormData();
      formData.append("file", new File([blob], `cover-${Date.now()}.webp`, { type: "image/webp" }));

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Upload failed");

      onChange({ type: "image", imageUrl: data.url });
    } catch (err: unknown) {
      setError(`ފޮޓޯ ލޯޑް ނުވި: ${err instanceof Error ? err.message : "އަލުން ލޯޑްކޮށްލާ"}`);
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`w-full rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 select-none
          ${dragging ? "border-foreground bg-muted/40 scale-[1.01]" : "border-border bg-muted/20 hover:border-foreground hover:bg-muted/30"}
          ${uploading ? "pointer-events-none" : ""}`}
        style={{ aspectRatio: "16/9", maxHeight: "260px" }}
      >
        {uploading ? (
          <>
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">{progress}</p>
          </>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {dragging ? <UploadCloud size={22} /> : <ImageIcon size={22} />}
            </div>
            <div className="text-center space-y-1">
              <p className="font-body text-sm font-semibold text-foreground">
                {dragging ? "ދޫކޮށްލާ" : "ކަވަރ ފޮޓޯ ލޯޑްކޮށްލާ"}
              </p>
              <p className="font-body text-xs text-muted-foreground">ކްލިކް ކުރޭ ނުވަތަ ދަމާ ގެންނާ</p>
              <p className="font-body text-[10px] text-muted-foreground/60">JPG · PNG · WebP · HEIC · max {MAX_IMAGE_SIZE_MB}MB</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-muted border border-border">
              <p className="font-body text-[10px] text-muted-foreground">
                ކޮންމެ ފޮޓޯއެއް ވެސް 1600×900 WebP އަށް ބަދަލުކުރެވޭ
              </p>
            </div>
          </>
        )}
      </div>
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </div>
  );
}

function VideoEmbedInput({ onChange }: { onChange: (v: CoverMediaValue) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmbed = async () => {
    if (!url.trim()) return;
    setError(null); setLoading(true);
    try {
      const meta = await fetchVideoMeta(url.trim());
      onChange({ type: "video", videoMeta: meta });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ވީޑިއޯ ލިންކް ރަނގަޅެއް ނޫން");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-4 p-8"
      style={{ aspectRatio: "16/9", maxHeight: "260px" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
        <Video size={22} />
      </div>
      <div className="w-full max-w-sm space-y-2">
        <p className="font-body text-sm font-semibold text-foreground text-center">ވީޑިއޯ ލިންކް ޖަހާ</p>
        <p className="font-body text-[10px] text-muted-foreground text-center">Vimeo · YouTube</p>
        <div className="flex gap-2" dir="rtl">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmbed()}
            placeholder="https://vimeo.com/... ނުވަތަ youtube.com/..."
            dir="ltr"
            className="flex-1 font-body text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:border-foreground transition-colors text-left" />
          <button type="button" onClick={handleEmbed} disabled={loading || !url.trim()}
            className="px-4 py-2 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-40 transition-opacity flex items-center gap-1.5">
            {loading ? <Loader2 size={12} className="animate-spin" /> : null}
            {loading ? "ލޯޑްވަނީ..." : "އެންބެޑް"}
          </button>
        </div>
      </div>
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-body text-xs font-semibold transition-all
        ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
      <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
      <p className="font-body text-xs text-destructive">{children}</p>
    </div>
  );
}
