"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Search } from "lucide-react";

type Props = {
  onInsert: (images: string[], ratio: string) => void;
  onClose: () => void;
};

type MediaItem = {
  id: string;
  url: string;
  filename: string | null;
};

export default function CarouselModal({ onInsert, onClose }: Props) {
  const supabase = createClient();
  const [ratio, setRatio]       = useState<"4:5" | "1:1">("4:5");
  const [items, setItems]       = useState<MediaItem[]>([]);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("media")
        .select("id, url, filename")
        .order("created_at", { ascending: false })
        .limit(100);
      if (search.trim()) {
        query = query.ilike("filename", "%" + search.trim() + "%");
      }
      const { data } = await query;
      setItems(data ?? []);
      setLoading(false);
    }
    load();
  }, [search]);

  function toggleImage(url: string) {
    setSelected((prev) => {
      if (prev.includes(url)) return prev.filter((u) => u !== url);
      if (prev.length >= 5) return prev;
      return [...prev, url];
    });
  }

  function handleInsert() {
    if (selected.length === 0) return;
    onInsert(selected, ratio);
    onClose();
  }

  const aspectClass = ratio === "4:5" ? "aspect-[4/5]" : "aspect-square";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-2xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" dir="rtl">
          <h3 className="font-body text-sm font-semibold text-foreground">ކެރޯސަލް</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Ratio + search */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3" dir="rtl">
          <span className="font-body text-xs text-muted-foreground">ސައިޒް:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRatio("4:5")}
              className={"px-3 py-1.5 rounded-lg text-xs font-body transition-colors border " + (ratio === "4:5" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted")}
            >
              4:5
            </button>
            <button
              type="button"
              onClick={() => setRatio("1:1")}
              className={"px-3 py-1.5 rounded-lg text-xs font-body transition-colors border " + (ratio === "1:1" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted")}
            >
              1:1
            </button>
          </div>
          <span className="font-body text-xs text-muted-foreground">
            {selected.length} / 5 ހޮވިފައި
          </span>
          <div className="relative mr-auto">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ހޯދާ..."
              dir="rtl"
              className="font-body text-xs pr-7 pl-3 py-1.5 rounded-lg border border-border bg-muted/40 outline-none focus:border-foreground transition-colors w-40"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-12 font-body text-xs text-muted-foreground">ލޯޑުވަނީ...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 font-body text-xs text-muted-foreground">ފޮޓޯ ނެތް</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => {
                const isSelected = selected.includes(item.url);
                const order = selected.indexOf(item.url);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleImage(item.url)}
                    className={"relative overflow-hidden rounded-lg border-2 transition-all w-full " + aspectClass + " " + (isSelected ? "border-foreground" : "border-transparent hover:border-border")}
                  >
                    <img src={item.url} alt={item.filename ?? ""} className="w-full h-full object-cover" loading="lazy" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white text-gray-900 flex items-center justify-center text-xs font-bold">
                          {order + 1}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <button onClick={onClose} className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            ކެންސަލް
          </button>
          <button
            onClick={handleInsert}
            disabled={selected.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background font-body text-xs font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={13} />
            އިންސާޓް
          </button>
        </div>
      </div>
    </div>
  );
}
