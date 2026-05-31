"use client";
// app/admin/media/page.tsx

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Upload, Trash2, Copy, Check, X, Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  filename: string | null;
  size_bytes: number | null;
  created_at: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminMediaPage() {
  const supabase = createClient();
  const [items, setItems]           = useState<MediaItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);
  const [page, setPage]             = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const PAGE_SIZE = 48;

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;
    let query = supabase
      .from("media")
      .select("id, url, filename, size_bytes, created_at")
      .order("created_at", { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.ilike("filename", `%${search.trim()}%`);
    }

    const { data } = await query;
    const results = data ?? [];
    setHasMore(results.length === PAGE_SIZE);
    if (reset) {
      setItems(results);
      setPage(0);
    } else {
      setItems((prev) => [...prev, ...results]);
    }
    setLoading(false);
  }, [page, search, supabase]);

  useEffect(() => { load(true); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "media");
        fd.append("saveMedia", "true");
        await fetch("/api/upload-image", { method: "POST", body: fd });
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }
    setUploading(false);
    load(true);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`"${item.filename}" ފޮހެލަންތޯ؟`)) return;
    setDeleting(item.id);
    await supabase.from("media").delete().eq("id", item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (selected === item.id) setSelected(null);
    setDeleting(null);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedItem = items.find((i) => i.id === selected);

  return (
    <div className="flex h-full overflow-hidden" dir="rtl">

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div>
            <h1 className="font-body text-lg font-semibold text-foreground">މީޑިއާ</h1>
            <p className="font-body text-xs text-muted-foreground">{items.length} ފޮޓޯ</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ހޯދާ..."
                dir="rtl"
                className="font-body text-xs pr-8 pl-3 py-2 rounded-xl border border-border bg-muted/40 outline-none focus:border-foreground transition-colors w-48"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "ލޯޑްވަނީ..." : "އަޕްލޯޑް"}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-y-auto p-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
        >
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <p className="font-body text-sm text-muted-foreground">ފޮޓޯތަކެއް ނެތް</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-body text-xs text-muted-foreground underline hover:text-foreground transition-colors"
              >
                ފޮޓޯ އަޕްލޯޑް ކޮށްލާ
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(selected === item.id ? null : item.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selected === item.id
                        ? "border-foreground"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.filename ?? ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selected === item.id && (
                      <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <Check className="w-3 h-3 text-background" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={() => { setPage((p) => p + 1); load(); }}
                    disabled={loading}
                    className="font-body text-xs px-5 py-2 rounded-full border border-border hover:border-foreground transition-colors disabled:opacity-40"
                  >
                    {loading ? "ލޯޑްވަނީ..." : "އިތުރަށް ބަލާ"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedItem && (
        <div className="w-64 flex-shrink-0 border-r border-border bg-background flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-sans text-xs font-semibold text-muted-foreground">ތަފްސީލް</p>
            <button type="button" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              <img src={selectedItem.url} alt={selectedItem.filename ?? ""} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-sans text-[10px] text-muted-foreground mb-0.5">ފައިލް ނަން</p>
                <p className="font-body text-xs text-foreground break-all">{selectedItem.filename ?? "—"}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] text-muted-foreground mb-0.5">ސައިޒް</p>
                <p className="font-body text-xs text-foreground">{formatSize(selectedItem.size_bytes)}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] text-muted-foreground mb-0.5">ތާރީހް</p>
                <p className="font-body text-xs text-foreground">{formatDate(selectedItem.created_at)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCopy(selectedItem.url, selectedItem.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors font-body text-xs text-foreground"
              >
                {copied === selectedItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === selectedItem.id ? "ކޮޕީ ވެއްޖެ" : "URL ކޮޕީ"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedItem)}
                disabled={deleting === selectedItem.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors font-body text-xs disabled:opacity-40"
              >
                {deleting === selectedItem.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                ފޮހެލާ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
