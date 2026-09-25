"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

type BioArticle = {
  id: string;
  title: string;
  slug: string;
  bio_order: number | null;
  cover_url: string | null;
  cover_portrait_url: string | null;
  featured_image: string | null;
  category: { slug: string } | null;
};

const MAX_BIO_TILES = 9;

function parseArticleUrl(raw: string): { category: string; slug: string } | null {
  let path = raw.trim();
  if (!path) return null;
  try {
    if (path.startsWith("http")) path = new URL(path).pathname;
  } catch {
    return null;
  }
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { category: parts[0], slug: parts[1] };
}

export default function AdminLinkInBioPage() {
  const supabase = createClient();
  const [items, setItems] = useState<BioArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, slug, bio_order, cover_url, cover_portrait_url, featured_image, category:categories!category_id(slug)"
      )
      .eq("bio_featured", true)
      .order("bio_order", { ascending: true, nullsFirst: false });
    if (error) toast.error("ލޯޑް ނުވި");
    setItems((data as unknown as BioArticle[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addByUrl = async () => {
    const parsed = parseArticleUrl(urlInput);
    if (!parsed) { toast.error("ލިންކް ރަނގަޅެއް ނޫން"); return; }
    if (items.length >= MAX_BIO_TILES) {
      toast.error(`މިހާރު ${MAX_BIO_TILES} ލިޔުން އެބަހުރި — ފުރަތަމަ އެކަތި ނަގާ`);
      return;
    }

    setAdding(true);
    const { data: found, error: findErr } = await supabase
      .from("articles")
      .select("id, bio_featured")
      .eq("slug", parsed.slug)
      .maybeSingle();

    if (findErr || !found) {
      setAdding(false);
      toast.error("މި ލިޔުން ފެންނާކަށް ނެތް");
      return;
    }
    if (found.bio_featured) {
      setAdding(false);
      toast.error("މިހާރުވެސް ލިސްޓްގައި އެބައޮތް");
      return;
    }

    const nextOrder = items.reduce((max, i) => Math.max(max, i.bio_order ?? 0), 0) + 1;
    const { error: updateErr } = await supabase
      .from("articles")
      .update({ bio_featured: true, bio_order: nextOrder })
      .eq("id", found.id);

    setAdding(false);
    if (updateErr) { toast.error("އިތުރު ނުކުރެވުނު"); return; }
    toast.success("އިތުރުކުރެވިއްޖެ");
    setUrlInput("");
    load();
  };

  const removeArticle = async (id: string) => {
    const { error } = await supabase
      .from("articles")
      .update({ bio_featured: false, bio_order: null })
      .eq("id", id);
    if (error) { toast.error("ނުނެގުން"); return; }
    toast.success("ނަގައިފިން");
    load();
  };

  const moveArticle = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const a = items[index];
    const b = items[targetIndex];
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("articles").update({ bio_order: b.bio_order }).eq("id", a.id),
      supabase.from("articles").update({ bio_order: a.bio_order }).eq("id", b.id),
    ]);
    if (e1 || e2) { toast.error("ތަރުތީބު ބަދަލެއް ނުކުރެވުނު"); return; }
    load();
  };

  const input = "w-full h-9 px-3 rounded-lg border border-border bg-background font-body text-sm";
  const lbl = "font-body text-xs text-muted-foreground mb-1 block";
  const card = "rounded-2xl border border-border bg-background";

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-body text-lg font-bold">ލިންކް އިން ބަޔޯ</h1>
        <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-body">
          {items.length}/{MAX_BIO_TILES} ލިޔުން
        </span>
      </div>

      <div className={card + " bg-muted/30 p-4 mb-6"}>
        <label className={lbl}>ލިޔުމުގެ ލިންކް ޕޭސްޓްކުރޭ</label>
        <div className="flex gap-2">
          <input
            className={input}
            dir="ltr"
            placeholder="https://www.merihaanaa.com/film/mq2adwajxp1"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addByUrl()}
          />
          <button
            onClick={addByUrl}
            disabled={adding}
            className="h-9 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "އިތުރުކުރަނީ..." : "އިތުރުކުރޭ"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="font-body text-sm text-muted-foreground">ލޯޑްވަނީ...</p>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">ލިޔުމެއް އިތުރުކޮށްފައި ނެތް</p>
      ) : (
        <div className={card + " overflow-hidden"}>
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="font-body text-xs text-muted-foreground">
                <th className="text-right p-3 font-normal">ތަރުތީބު</th>
                <th className="text-right p-3 font-normal"></th>
                <th className="text-right p-3 font-normal">ސުރުޚީ</th>
                <th className="text-right p-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const image = item.cover_portrait_url || item.cover_url || item.featured_image;
                return (
                  <tr key={item.id} className="border-t border-border font-body text-sm">
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveArticle(index, -1)}
                          disabled={index === 0}
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <span className="text-xs text-center">{index + 1}</span>
                        <button
                          onClick={() => moveArticle(index, 1)}
                          disabled={index === items.length - 1}
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      {image ? (
                        <img src={image} alt="" className="w-14 h-14 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-muted" />
                      )}
                    </td>
                    <td className="p-3">
                      <span className="line-clamp-2">{item.title}</span>
                      <span className="block text-xs text-muted-foreground" dir="ltr">
                        /{item.category?.slug ?? "?"}/{item.slug}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => removeArticle(item.id)} className="text-xs text-destructive">
                        މިލިންކް ނަގާ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
