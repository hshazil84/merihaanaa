"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus, X, Archive, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Article {
  id: string; title: string; slug: string; status: string;
  category_id: string | null; published_at: string | null;
  scheduled_at: string | null; created_at: string;
  author: { id: string; full_name: string } | null;
  category: { name: string; slug: string } | null;
}
interface Category { id: string; name: string; slug: string; }

const PJ = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

// ── Column definitions ───────────────────────────────────────────────────────
const PORTFOLIO_COLS = [
  { id: "3mo",  label: "3 Months",  accent: "#8b5cf6", bg: "#f5f3ff", border: "#ede9fe", dot: "#7c3aed" },
  { id: "1mo",  label: "1 Month",   accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", dot: "#0284c7" },
  { id: "week", label: "This Week", accent: "#f59e0b", bg: "#fffbeb", border: "#fde68a", dot: "#d97706" },
];
const ACTIVE_COLS = [
  { id: "idea",  label: "To Do",    accent: "#64748b", bg: "#f8fafc", border: "#e2e8f0", dot: "#475569" },
  { id: "draft", label: "Writing",  accent: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", dot: "#059669" },
  { id: "review",label: "Review",   accent: "#f97316", bg: "#fff7ed", border: "#fed7aa", dot: "#ea580c" },
];
const DONE_COLS = [
  { id: "published", label: "Published", accent: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" },
];

const ALL_COLS = [...PORTFOLIO_COLS, ...ACTIVE_COLS, ...DONE_COLS];

function statusToCol(status: string): string {
  if (status === "published") return "published";
  if (status === "scheduled") return "week";
  if (status === "draft") return "draft";
  if (status === "idea") return "idea";
  return "idea";
}

function colToStatus(colId: string): string {
  const map: Record<string, string> = {
    "3mo": "idea", "1mo": "idea", "week": "scheduled",
    "idea": "idea", "draft": "draft", "review": "draft",
    "published": "published",
  };
  return map[colId] ?? "draft";
}

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") + "-" + Math.random().toString(36).slice(2,5);
}
function formatShort(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ── Inline add input ─────────────────────────────────────────────────────────
function InlineAdd({ colId, categories, onAdd }: {
  colId: string; categories: Category[];
  onAdd: (a: Article) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const status = colToStatus(colId);
    const { data, error } = await supabase.from("articles")
      .insert({ title: title.trim(), slug: slugify(title), status, content_type: "article", category_id: catId || null, body: {} })
      .select("id").single();
    if (error || !data) { toast.error("Failed"); setSaving(false); return; }
    const cat = categories.find((c) => c.id === catId) ?? null;
    onAdd({ id: data.id, title: title.trim(), slug: slugify(title), status, category_id: catId||null, published_at: null, scheduled_at: null, created_at: new Date().toISOString(), author: null, category: cat ? { name: cat.name, slug: cat.slug } : null });
    setTitle(""); setOpen(false); setSaving(false);
    toast.success("Added");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all text-xs mt-1"
        style={{ fontFamily: PJ }}>
        <Plus size={12} /> Add card
      </button>
    );
  }

  return (
    <div className="mt-1 p-2 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2">
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Card title..." className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md outline-none focus:border-blue-400"
        style={{ fontFamily: PJ }} />
      <select value={catId} onChange={(e) => setCatId(e.target.value)}
        className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-md outline-none focus:border-blue-400 bg-white"
        style={{ fontFamily: PJ }}>
        <option value="">No category</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="flex gap-1.5">
        <button onClick={save} disabled={saving || !title.trim()}
          className="flex-1 py-1 text-xs font-semibold bg-gray-900 text-white rounded-md hover:opacity-80 disabled:opacity-40"
          style={{ fontFamily: PJ }}>
          {saving ? "..." : "Add"}
        </button>
        <button onClick={() => setOpen(false)} className="w-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ article, onArchive, onDelete }: {
  article: Article;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const date = formatShort(article.scheduled_at ?? article.published_at);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("articleId", article.id); e.dataTransfer.effectAllowed = "move"; }}
      className="group relative bg-white rounded-lg border border-gray-100 p-2.5 cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-md transition-all select-none"
    >
      {/* Actions */}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onArchive(article.id)} title="Archive"
          className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-orange-400 hover:bg-orange-50 transition-all">
          <Archive size={10} />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-0.5">
            <button onClick={() => onDelete(article.id)}
              className="text-[9px] px-1.5 py-0.5 bg-red-500 text-white rounded font-semibold" style={{ fontFamily: PJ }}>
              Delete
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-[9px] px-1 text-gray-400 hover:text-gray-600" style={{ fontFamily: PJ }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} title="Delete"
            className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all">
            <Trash2 size={10} />
          </button>
        )}
      </div>

      {/* Edit link */}
      <Link href={"/admin/articles/" + article.id}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded text-gray-200 hover:text-blue-400 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
        onClick={(e) => e.stopPropagation()}>
        <ExternalLink size={10} />
      </Link>

      <p className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2 mt-0.5 mb-2 pr-4" dir="rtl"
        style={{ fontFamily: PJ }}>
        {article.title}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {article.category && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium" style={{ fontFamily: PJ }}>
            {article.category.name}
          </span>
        )}
        {date && (
          <span className="text-[9px] text-gray-400" style={{ fontFamily: PJ }}>{date}</span>
        )}
        {article.author && (
          <span className="text-[9px] text-gray-400 mr-auto" style={{ fontFamily: PJ }}>{article.author.full_name}</span>
        )}
      </div>
    </div>
  );
}

// ── Column ───────────────────────────────────────────────────────────────────
function KanbanColumn({ col, articles, categories, onDrop, onArchive, onDelete, onAdd }: {
  col: typeof ALL_COLS[0];
  articles: Article[];
  categories: Category[];
  onDrop: (articleId: string, colId: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (a: Article) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("articleId"); if (id) onDrop(id, col.id); setIsOver(false); }}
      className="flex flex-col min-w-0 rounded-xl transition-all"
      style={{
        background: isOver ? col.bg : "transparent",
        border: "1px solid " + (isOver ? col.border : "transparent"),
        padding: "6px",
      }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.dot }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: col.accent, fontFamily: PJ }}>
            {col.label}
          </span>
        </div>
        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: col.bg, color: col.accent, border: "1px solid " + col.border, fontFamily: PJ }}>
          {articles.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-1.5 overflow-y-auto min-h-[60px]">
        {articles.map((a) => (
          <KanbanCard key={a.id} article={a} onArchive={onArchive} onDelete={onDelete} />
        ))}
        {articles.length === 0 && (
          <div className="h-12 flex items-center justify-center rounded-lg border border-dashed border-gray-200">
            <span className="text-[10px] text-gray-300" style={{ fontFamily: PJ }}>Drop here</span>
          </div>
        )}
      </div>

      {/* Add */}
      <InlineAdd colId={col.id} categories={categories} onAdd={onAdd} />
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ articles }: { articles: Article[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate()+1); }
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() });
  const byDate: Record<string, Article[]> = {};
  for (const a of articles) {
    const dt = a.scheduled_at ?? a.published_at;
    if (!dt) continue;
    const key = dt.slice(0,10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  }
  const todayKey = now.toISOString().slice(0,10);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-700" style={{ fontFamily: PJ }}>
          {new Date(year, month).toLocaleDateString("en", { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => month === 0 ? (setYear(y=>y-1),setMonth(11)) : setMonth(m=>m-1)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"><ChevronLeft size={12}/></button>
          <button onClick={() => month === 11 ? (setYear(y=>y+1),setMonth(0)) : setMonth(m=>m+1)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"><ChevronRight size={12}/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} className="text-[9px] font-bold text-gray-300 text-center" style={{ fontFamily: PJ }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_,i) => <div key={"b"+i} />)}
        {days.map((day) => {
          const key = day.toISOString().slice(0,10);
          const items = byDate[key] ?? [];
          const isToday = key === todayKey;
          const hasItems = items.length > 0;
          return (
            <div key={key} className={"relative flex flex-col items-center justify-center rounded-md aspect-square cursor-default transition-all " + (isToday ? "bg-blue-500" : hasItems ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50")}>
              <span className={"text-[10px] font-semibold " + (isToday ? "text-white" : "text-gray-600")} style={{ fontFamily: PJ }}>{day.getDate()}</span>
              {hasItems && !isToday && (
                <div className="flex gap-0.5 mt-0.5">
                  {items.slice(0,3).map((a,i) => <div key={i} className="w-1 h-1 rounded-full" style={{ background: a.status === "published" ? "#22c55e" : "#3b82f6" }} />)}
                </div>
              )}
              {hasItems && isToday && <div className="w-1 h-1 rounded-full bg-white mt-0.5" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-[9px] text-gray-400" style={{ fontFamily: PJ }}>Scheduled</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[9px] text-gray-400" style={{ fontFamily: PJ }}>Published</span></div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProductionClient({ articles: initial, categories }: {
  articles: Article[]; categories: Category[];
}) {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>(initial);
  const [colMap, setColMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const a of initial) m[a.id] = statusToCol(a.status);
    return m;
  });
  const [filter, setFilter] = useState("");

  const filtered = articles.filter((a) =>
    a.status !== "archived" && (!filter || a.title.toLowerCase().includes(filter.toLowerCase()) || a.category?.name.toLowerCase().includes(filter.toLowerCase()))
  );

  function getColArticles(colId: string) {
    return filtered.filter((a) => (colMap[a.id] ?? statusToCol(a.status)) === colId);
  }

  async function handleDrop(articleId: string, colId: string) {
    const prev = colMap[articleId];
    if (prev === colId) return;
    setColMap((m) => ({ ...m, [articleId]: colId }));
    const newStatus = colToStatus(colId);
    const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", articleId);
    if (error) { setColMap((m) => ({ ...m, [articleId]: prev })); toast.error("Failed to move"); }
  }

  async function handleArchive(id: string) {
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, status: "archived" } : a));
    await supabase.from("articles").update({ status: "archived" }).eq("id", id);
    toast.success("Archived");
  }

  async function handleDelete(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Deleted");
  }

  function handleAdd(article: Article) {
    setArticles((prev) => [article, ...prev]);
    setColMap((m) => ({ ...m, [article.id]: statusToCol(article.status) }));
  }

  const counts = {
    total: filtered.length,
    scheduled: filtered.filter((a) => a.status === "scheduled").length,
    published: filtered.filter((a) => a.status === "published").length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: PJ }}>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <h1 className="text-sm font-bold text-gray-800" style={{ fontFamily: PJ }}>Production</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span><span className="font-bold text-gray-700">{counts.total}</span> active</span>
            <span><span className="font-bold text-blue-500">{counts.scheduled}</span> scheduled</span>
            <span><span className="font-bold text-green-500">{counts.published}</span> published</span>
          </div>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..."
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-40 outline-none focus:border-blue-400 bg-gray-50" style={{ fontFamily: PJ }} />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">

        {/* Portfolio section */}
        <div className="flex flex-col flex-shrink-0" style={{ width: "520px" }}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300" style={{ fontFamily: PJ }}>Portfolio</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex gap-2 flex-1 overflow-hidden">
            {PORTFOLIO_COLS.map((col) => (
              <div key={col.id} className="flex-1">
                <KanbanColumn col={col} articles={getColArticles(col.id)} categories={categories}
                  onDrop={handleDrop} onArchive={handleArchive} onDelete={handleDelete} onAdd={handleAdd} />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-6">
          <div className="w-px flex-1 bg-gray-100" />
        </div>

        {/* Active section */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300" style={{ fontFamily: PJ }}>Active</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex gap-2 flex-1 overflow-hidden">
            {ACTIVE_COLS.map((col) => (
              <div key={col.id} className="flex-1">
                <KanbanColumn col={col} articles={getColArticles(col.id)} categories={categories}
                  onDrop={handleDrop} onArchive={handleArchive} onDelete={handleDelete} onAdd={handleAdd} />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-6">
          <div className="w-px flex-1 bg-gray-100" />
        </div>

        {/* Done + Calendar */}
        <div className="flex flex-col flex-shrink-0 gap-3" style={{ width: "200px" }}>
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300" style={{ fontFamily: PJ }}>Done</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          {DONE_COLS.map((col) => (
            <KanbanColumn key={col.id} col={col} articles={getColArticles(col.id)} categories={categories}
              onDrop={handleDrop} onArchive={handleArchive} onDelete={handleDelete} onAdd={handleAdd} />
          ))}
          <MiniCalendar articles={filtered} />
        </div>

      </div>
    </div>
  );
}
