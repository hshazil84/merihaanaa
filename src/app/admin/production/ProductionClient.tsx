"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  LayoutGrid, Calendar, GanttChartSquare,
  ExternalLink, ChevronLeft, ChevronRight, Plus, X,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  category_id: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  author: { id: string; full_name: string } | null;
  category: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ViewType = "kanban" | "calendar" | "gantt";

const STAGES: { id: string; label: string; color: string; statuses: string[] }[] = [
  { id: "idea",      label: "Idea",      color: "#94a3b8", statuses: [] },
  { id: "draft",     label: "Draft",     color: "#f59e0b", statuses: ["draft"] },
  { id: "scheduled", label: "Scheduled", color: "#3b82f6", statuses: ["scheduled"] },
  { id: "published", label: "Published", color: "#22c55e", statuses: ["published"] },
];

function statusToStage(status: string): string {
  for (const s of STAGES) {
    if (s.statuses.includes(status)) return s.id;
  }
  return "draft";
}

function formatShort(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString("en", { month: "long", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
    + "-" + Math.random().toString(36).slice(2, 6);
}

// ── Add Item Modal ───────────────────────────────────────────────────────────
function AddItemModal({ categories, onClose, onAdd }: {
  categories: Category[];
  onClose: () => void;
  onAdd: (article: Article) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const toastId = toast.loading("Creating...");
    const slug = slugify(title.trim());

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title: title.trim(),
        slug,
        status: "idea",
        content_type: "article",
        category_id: categoryId || null,
        scheduled_at: scheduledAt || null,
        body: {},
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("INSERT ERROR:", JSON.stringify(error));
      toast.error("Failed to create", { id: toastId });
      setSaving(false);
      return;
    }

    const cat = categories.find((c) => c.id === categoryId) ?? null;
    const article: Article = {
      id: data.id,
      title: title.trim(),
      slug,
      status: "draft",
      category_id: categoryId || null,
      published_at: null,
      scheduled_at: scheduledAt || null,
      created_at: new Date().toISOString(),
      author: null,
      category: cat ? { name: cat.name, slug: cat.slug } : null,
    };

    toast.success("Created", { id: toastId });
    onAdd(article);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">New Production Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
            <input autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="Article title..."
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white transition-colors">
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Target publish date</label>
            <input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40">
            <Plus size={13} />
            Create Draft
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({ article, draggable, onDragStart }: {
  article: Article;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <div draggable={draggable} onDragStart={onDragStart}
      className="group bg-white border border-gray-100 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-sm transition-all select-none">
      <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-2" dir="rtl">
        {article.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {article.category && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {article.category.name}
            </span>
          )}
          {(article.scheduled_at || article.published_at) && (
            <span className="text-[10px] text-gray-400">
              {formatShort(article.scheduled_at ?? article.published_at)}
            </span>
          )}
        </div>
        <Link href={"/admin/articles/" + article.id}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700"
          onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}

// ── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ articles, onStageChange }: {
  articles: Article[];
  onStageChange: (id: string, status: string) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  function handleDrop(stageId: string) {
    if (!dragging) return;
    const statusMap: Record<string, string> = {
      draft: "draft", scheduled: "scheduled", published: "published", idea: "draft",
    };
    onStageChange(dragging, statusMap[stageId] ?? "draft");
    setDragging(null);
    setOverStage(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {STAGES.map((stage) => {
        const cards = articles.filter((a) => statusToStage(a.status) === stage.id);
        const isOver = overStage === stage.id;
        return (
          <div key={stage.id}
            onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
            onDragLeave={() => setOverStage(null)}
            onDrop={() => handleDrop(stage.id)}
            className="flex-shrink-0 w-64 flex flex-col rounded-xl transition-colors"
            style={{ background: isOver ? "#f1f5f9" : "#f8fafc", border: "1px solid " + (isOver ? "#cbd5e1" : "#e2e8f0") }}>
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
              </div>
              <span className="text-[10px] font-medium text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded-full">
                {cards.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {cards.map((a) => (
                <ArticleCard key={a.id} article={a} draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragging(a.id); }} />
              ))}
              {cards.length === 0 && (
                <div className="h-16 flex items-center justify-center text-[11px] text-gray-300">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ articles }: { articles: Article[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const days = getDaysInMonth(year, month);
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() });

  const byDate: Record<string, Article[]> = {};
  for (const a of articles) {
    const d = a.scheduled_at ?? a.published_at;
    if (!d) continue;
    const key = d.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  }

  function prev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const todayKey = now.toISOString().slice(0, 10);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">{formatMonth(new Date(year, month))}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
            className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            Today
          </button>
          <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-[10px] font-semibold text-gray-400 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {blanks.map((_, i) => <div key={"b" + i} />)}
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const items = byDate[key] ?? [];
          const isToday = key === todayKey;
          return (
            <div key={key} className={"rounded-lg p-1.5 min-h-[72px] border transition-colors " + (isToday ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200")}>
              <p className={"text-[11px] font-semibold mb-1 " + (isToday ? "text-blue-600" : "text-gray-500")}>{day.getDate()}</p>
              <div className="space-y-0.5">
                {items.slice(0, 2).map((a) => (
                  <Link key={a.id} href={"/admin/articles/" + a.id}
                    className="block text-[10px] leading-snug px-1 py-0.5 rounded truncate font-medium"
                    style={{ background: a.status === "published" ? "#dcfce7" : "#dbeafe", color: a.status === "published" ? "#15803d" : "#1d4ed8" }}
                    dir="rtl">
                    {a.title}
                  </Link>
                ))}
                {items.length > 2 && <p className="text-[9px] text-gray-400 px-1">{"+" + (items.length - 2) + " more"}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Gantt View ───────────────────────────────────────────────────────────────
function GanttView({ articles }: { articles: Article[] }) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const days = 90;
  const cols = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayOffset = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
  const withDates = articles.filter((a) => a.created_at && (a.scheduled_at ?? a.published_at));

  function dayOffset(d: string | null): number {
    if (!d) return 0;
    return Math.floor((new Date(d).getTime() - startDate.getTime()) / 86400000);
  }

  const colW = 28;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-gray-100 flex-shrink-0" style={{ marginLeft: "200px" }}>
        <div className="flex" style={{ width: days * colW + "px" }}>
          {cols.map((d, i) => (
            <div key={i} style={{ width: colW + "px", flexShrink: 0 }}
              className={"text-[9px] text-center border-l border-gray-100 py-1 " + (d.getDate() === 1 ? "font-bold text-gray-600" : "text-gray-300")}>
              {d.getDate() === 1 ? d.toLocaleDateString("en", { month: "short" }) : d.getDate() === 15 ? "15" : ""}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {withDates.map((article) => {
          const start = Math.max(0, dayOffset(article.created_at));
          const end = dayOffset(article.scheduled_at ?? article.published_at);
          const left = start * colW;
          const width = Math.max(colW, (end - start) * colW);
          const color = article.status === "published" ? "#22c55e" : article.status === "scheduled" ? "#3b82f6" : "#f59e0b";
          return (
            <div key={article.id} className="flex items-center border-b border-gray-50 hover:bg-gray-50 transition-colors" style={{ height: "40px" }}>
              <div className="flex-shrink-0 flex items-center gap-2 px-3 border-r border-gray-100" style={{ width: "200px" }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <Link href={"/admin/articles/" + article.id}
                  className="text-[11px] text-gray-700 font-medium truncate hover:text-gray-900 hover:underline" dir="rtl">
                  {article.title}
                </Link>
              </div>
              <div className="relative flex-1 overflow-hidden" style={{ height: "40px" }}>
                {todayOffset >= 0 && todayOffset < days && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-40 z-10"
                    style={{ left: todayOffset * colW + "px" }} />
                )}
                <div className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2"
                  style={{ left: left + "px", width: width + "px", height: "22px", background: color + "22", border: "1px solid " + color + "66" }}>
                  <span className="text-[9px] font-semibold truncate" style={{ color }}>
                    {article.category?.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {withDates.length === 0 && (
          <div className="flex items-center justify-center h-48 text-sm text-gray-300">No articles with dates</div>
        )}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProductionClient({ articles: initial, categories }: {
  articles: Article[];
  categories: Category[];
}) {
  const supabase = createClient();
  const [articles, setArticles] = useState<Article[]>(initial);
  const [view, setView] = useState<ViewType>("kanban");
  const [filter, setFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = articles.filter((a) =>
    !filter || a.title.toLowerCase().includes(filter.toLowerCase()) ||
    a.category?.name.toLowerCase().includes(filter.toLowerCase())
  );

  async function handleStageChange(id: string, newStatus: string) {
    const prev = articles.find((a) => a.id === id);
    if (!prev || prev.status === newStatus) return;
    setArticles((all) => all.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    const toastId = toast.loading("Moving...");
    const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to move", { id: toastId });
      setArticles((all) => all.map((a) => a.id === id ? prev : a));
    } else {
      toast.success("Moved to " + newStatus, { id: toastId });
    }
  }

  const counts = {
    total: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
    published: articles.filter((a) => a.status === "published").length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">

      {showAdd && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onAdd={(article) => setArticles((prev) => [article, ...prev])}
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold text-gray-800">Production</h1>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span><span className="font-semibold text-gray-700">{counts.total}</span> total</span>
              <span><span className="font-semibold text-yellow-500">{counts.draft}</span> drafts</span>
              <span><span className="font-semibold text-blue-500">{counts.scheduled}</span> scheduled</span>
              <span><span className="font-semibold text-green-500">{counts.published}</span> published</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-40 outline-none focus:border-gray-400 transition-colors bg-gray-50" />

            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {([
                { id: "kanban",   icon: LayoutGrid,      label: "Kanban" },
                { id: "calendar", icon: Calendar,         label: "Calendar" },
                { id: "gantt",    icon: GanttChartSquare, label: "Timeline" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setView(id)}
                  className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all " +
                    (view === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:opacity-80 transition-opacity">
              <Plus size={13} />
              New Item
            </button>
          </div>
        </div>
      </div>

      {/* View */}
      <div className="flex-1 overflow-hidden p-5">
        {view === "kanban" && <KanbanView articles={filtered} onStageChange={handleStageChange} />}
        {view === "calendar" && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 h-full overflow-auto">
            <CalendarView articles={filtered} />
          </div>
        )}
        {view === "gantt" && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 h-full overflow-auto">
            <GanttView articles={filtered} />
          </div>
        )}
      </div>
    </div>
  );
}
