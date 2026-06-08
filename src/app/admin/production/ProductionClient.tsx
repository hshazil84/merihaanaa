"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  LayoutGrid, Calendar, GanttChartSquare, Plus, X, Check,
  ChevronLeft, ChevronRight, ExternalLink, ClipboardList,
  CalendarDays, Users, Clock, MapPin, Trash2, Pencil,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Article {
  id: string; title: string; slug: string; status: string;
  category_id: string | null; published_at: string | null;
  scheduled_at: string | null; created_at: string;
  author: { id: string; full_name: string } | null;
  category: { name: string; slug: string } | null;
}
interface Category { id: string; name: string; slug: string; }
interface TeamMember { id: string; full_name: string; role: string | null; phone: string | null; email: string | null; avatar: string | null; is_active: boolean; }
interface ScheduleItem { id: string; event_id: string; time: string | null; description: string; assignee_ids: string[]; sort_order: number; }
interface ProductionEvent {
  id: string; title: string; event_date: string; location: string | null;
  notes: string | null; article_ids: string[]; created_at: string;
  schedule_items?: ScheduleItem[];
}
interface Task {
  id: string; title: string; article_id: string | null; event_id: string | null;
  assignee_id: string | null; due_date: string | null; due_time: string | null;
  is_done: boolean; created_at: string;
}

type MainTab = "pipeline" | "schedule" | "tasks";
type PipelineView = "kanban" | "calendar" | "gantt";

const STAGES = [
  { id: "idea",      label: "Idea",      color: "#94a3b8", statuses: ["idea"] },
  { id: "draft",     label: "Draft",     color: "#f59e0b", statuses: ["draft"] },
  { id: "scheduled", label: "Scheduled", color: "#3b82f6", statuses: ["scheduled"] },
  { id: "published", label: "Published", color: "#22c55e", statuses: ["published"] },
];

function statusToStage(status: string) {
  return STAGES.find((s) => s.statuses.includes(status))?.id ?? "draft";
}
function formatShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}
function formatMonth(d: Date) {
  return d.toLocaleDateString("en", { month: "long", year: "numeric" });
}
function getDaysInMonth(year: number, month: number) {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}
function slugify(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ member, size = 24 }: { member: TeamMember; size?: number }) {
  const initials = member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (member.avatar) {
    return <img src={process.env.NEXT_PUBLIC_SUPABASE_URL + "/storage/v1/object/public/avatars/" + member.avatar}
      alt={member.full_name} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35, background: "#e2e8f0", color: "#64748b" }}
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

// ── Add Article Modal ─────────────────────────────────────────────────────────
function AddArticleModal({ categories, onClose, onAdd }: { categories: Category[]; onClose: () => void; onAdd: (a: Article) => void; }) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const id = toast.loading("Creating...");
    const { data, error } = await supabase.from("articles")
      .insert({ title: title.trim(), slug: slugify(title.trim()), status: "idea", content_type: "article", category_id: categoryId || null, scheduled_at: scheduledAt || null, body: {} })
      .select("id").single();
    if (error || !data) { toast.error("Failed", { id }); setSaving(false); return; }
    const cat = categories.find((c) => c.id === categoryId) ?? null;
    toast.success("Created", { id });
    onAdd({ id: data.id, title: title.trim(), slug: slugify(title), status: "idea", category_id: categoryId || null, published_at: null, scheduled_at: scheduledAt || null, created_at: new Date().toISOString(), author: null, category: cat ? { name: cat.name, slug: cat.slug } : null });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">New Item</h2>
          <button onClick={onClose}><X size={15} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Article title..." className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Target publish date</label>
            <input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-400">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:opacity-80 disabled:opacity-40">
            <Plus size={13} /> Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Modal ───────────────────────────────────────────────────────────────
function EventModal({ team, articles, event, onClose, onSave }: {
  team: TeamMember[]; articles: Article[]; event?: ProductionEvent | null;
  onClose: () => void; onSave: (e: ProductionEvent) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.event_date ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [scheduleItems, setScheduleItems] = useState<{ time: string; description: string; assignee_ids: string[] }[]>(
    event?.schedule_items?.map((s) => ({ time: s.time ?? "", description: s.description, assignee_ids: s.assignee_ids })) ?? [{ time: "", description: "", assignee_ids: [] }]
  );
  const [saving, setSaving] = useState(false);

  function addItem() { setScheduleItems((prev) => [...prev, { time: "", description: "", assignee_ids: [] }]); }
  function removeItem(i: number) { setScheduleItems((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: string, value: any) {
    setScheduleItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function toggleAssignee(itemIdx: number, memberId: string) {
    setScheduleItems((prev) => prev.map((item, idx) => {
      if (idx !== itemIdx) return item;
      const ids = item.assignee_ids.includes(memberId)
        ? item.assignee_ids.filter((id) => id !== memberId)
        : [...item.assignee_ids, memberId];
      return { ...item, assignee_ids: ids };
    }));
  }

  async function handleSave() {
    if (!title.trim() || !date) return;
    setSaving(true);
    const toastId = toast.loading("Saving...");
    let eventId = event?.id;
    if (event?.id) {
      const { error } = await supabase.from("production_events").update({ title: title.trim(), event_date: date, location: location || null, notes: notes || null }).eq("id", event.id);
      if (error) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      await supabase.from("production_schedule_items").delete().eq("event_id", event.id);
    } else {
      const { data, error } = await supabase.from("production_events")
        .insert({ title: title.trim(), event_date: date, location: location || null, notes: notes || null, article_ids: [] })
        .select("id").single();
      if (error || !data) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      eventId = data.id;
    }
    const items = scheduleItems.filter((s) => s.description.trim());
    if (items.length > 0) {
      await supabase.from("production_schedule_items").insert(
        items.map((s, i) => ({ event_id: eventId, time: s.time || null, description: s.description.trim(), assignee_ids: s.assignee_ids, sort_order: i }))
      );
    }
    toast.success("Saved", { id: toastId });
    onSave({ id: eventId!, title: title.trim(), event_date: date, location: location || null, notes: notes || null, article_ids: [], created_at: event?.created_at ?? new Date().toISOString(), schedule_items: items.map((s, i) => ({ id: "", event_id: eventId!, time: s.time || null, description: s.description, assignee_ids: s.assignee_ids, sort_order: i })) });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-gray-800">{event ? "Edit Event" : "New Shoot Event"}</h2>
          <button onClick={onClose}><X size={15} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Event title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cover Shoot — ރަސްގަތުލު" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Studio, Azu's place..." className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
            </div>
          </div>

          {/* Schedule items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Schedule</label>
              <button onClick={addItem} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <Plus size={11} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {scheduleItems.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={item.time} onChange={(e) => updateItem(i, "time", e.target.value)}
                      placeholder="7:45 PM" className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-24 flex-shrink-0" />
                    <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                      placeholder="Makeup & styling begins..." className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
                    <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {team.filter((m) => m.is_active).map((m) => (
                      <button key={m.id} onClick={() => toggleAssignee(i, m.id)}
                        className={"flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all " +
                          (item.assignee_ids.includes(m.id) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400")}>
                        {item.assignee_ids.includes(m.id) && <Check size={8} />}
                        {m.full_name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional notes..."
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 resize-none" />
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm text-gray-400">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !date}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:opacity-80 disabled:opacity-40">
            {event ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Modal ────────────────────────────────────────────────────────────────
function TaskModal({ team, articles, events, task, onClose, onSave }: {
  team: TeamMember[]; articles: Article[]; events: ProductionEvent[];
  task?: Task | null; onClose: () => void; onSave: (t: Task) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(task?.title ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [articleId, setArticleId] = useState(task?.article_id ?? "");
  const [eventId, setEventId] = useState(task?.event_id ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [dueTime, setDueTime] = useState(task?.due_time ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const toastId = toast.loading("Saving...");
    const payload = { title: title.trim(), assignee_id: assigneeId || null, article_id: articleId || null, event_id: eventId || null, due_date: dueDate || null, due_time: dueTime || null };
    if (task?.id) {
      const { error } = await supabase.from("production_tasks").update(payload).eq("id", task.id);
      if (error) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      toast.success("Saved", { id: toastId });
      onSave({ ...task, ...payload });
    } else {
      const { data, error } = await supabase.from("production_tasks").insert({ ...payload, is_done: false }).select("id").single();
      if (error || !data) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      toast.success("Created", { id: toastId });
      onSave({ id: data.id, ...payload, is_done: false, created_at: new Date().toISOString() });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">{task ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose}><X size={15} className="text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Task *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. Book interview with Aisha" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assign to</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
              <option value="">Unassigned</option>
              {team.filter((m) => m.is_active).map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due time</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Linked article</label>
            <select value={articleId} onChange={(e) => setArticleId(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
              <option value="">None</option>
              {articles.slice(0, 50).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Linked event</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white">
              <option value="">None</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-400">Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:opacity-80 disabled:opacity-40">
            {task ? "Save" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pipeline Tab ──────────────────────────────────────────────────────────────
function PipelineTab({ articles, categories, onArticlesChange }: { articles: Article[]; categories: Category[]; onArticlesChange: (a: Article[]) => void; }) {
  const supabase = createClient();
  const [pipelineView, setPipelineView] = useState<PipelineView>("kanban");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const filtered = articles.filter((a) => !filter || a.title.toLowerCase().includes(filter.toLowerCase()));

  async function handleStageChange(id: string, newStatus: string) {
    const prev = articles.find((a) => a.id === id);
    if (!prev || prev.status === newStatus) return;
    onArticlesChange(articles.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    const toastId = toast.loading("Moving...");
    const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Failed", { id: toastId }); onArticlesChange(articles); }
    else toast.success("Moved to " + newStatus, { id: toastId });
  }

  // Kanban
  function KanbanView() {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {STAGES.map((stage) => {
          const cards = filtered.filter((a) => statusToStage(a.status) === stage.id);
          const isOver = overStage === stage.id;
          return (
            <div key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
              onDragLeave={() => setOverStage(null)}
              onDrop={() => {
                if (!dragging) return;
                const statusMap: Record<string, string> = { idea: "idea", draft: "draft", scheduled: "scheduled", published: "published" };
                handleStageChange(dragging, statusMap[stage.id] ?? "draft");
                setDragging(null); setOverStage(null);
              }}
              className="flex-shrink-0 w-60 flex flex-col rounded-xl"
              style={{ background: isOver ? "#f1f5f9" : "#f8fafc", border: "1px solid " + (isOver ? "#cbd5e1" : "#e2e8f0") }}>
              <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                </div>
                <span className="text-[10px] text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded-full">{cards.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cards.map((a) => (
                  <div key={a.id} draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragging(a.id); }}
                    className="group bg-white border border-gray-100 rounded-lg p-3 cursor-grab hover:border-gray-300 hover:shadow-sm transition-all select-none">
                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 mb-2" dir="rtl">{a.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {a.category && <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{a.category.name}</span>}
                        {(a.scheduled_at || a.published_at) && <span className="text-[10px] text-gray-400">{formatShort(a.scheduled_at ?? a.published_at)}</span>}
                      </div>
                      <Link href={"/admin/articles/" + a.id} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && <div className="h-16 flex items-center justify-center text-[11px] text-gray-300">Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Calendar
  function CalView() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const days = getDaysInMonth(year, month);
    const blanks = Array.from({ length: new Date(year, month, 1).getDay() });
    const byDate: Record<string, Article[]> = {};
    for (const a of filtered) {
      const d = a.scheduled_at ?? a.published_at;
      if (!d) continue;
      const key = d.slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(a);
    }
    const todayKey = now.toISOString().slice(0, 10);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">{formatMonth(new Date(year, month))}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => month === 0 ? (setYear(y => y-1), setMonth(11)) : setMonth(m => m-1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={14} /></button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500">Today</button>
            <button onClick={() => month === 11 ? (setYear(y => y+1), setMonth(0)) : setMonth(m => m+1)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px mb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="text-[10px] font-semibold text-gray-400 text-center py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {blanks.map((_, i) => <div key={"b"+i} />)}
          {days.map((day) => {
            const key = day.toISOString().slice(0, 10);
            const items = byDate[key] ?? [];
            const isToday = key === todayKey;
            return (
              <div key={key} className={"rounded-lg p-1.5 min-h-[68px] border " + (isToday ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-white")}>
                <p className={"text-[11px] font-semibold mb-1 " + (isToday ? "text-blue-600" : "text-gray-400")}>{day.getDate()}</p>
                {items.slice(0, 2).map((a) => (
                  <Link key={a.id} href={"/admin/articles/" + a.id} className="block text-[10px] px-1 py-0.5 rounded truncate font-medium mb-0.5"
                    style={{ background: a.status === "published" ? "#dcfce7" : "#dbeafe", color: a.status === "published" ? "#15803d" : "#1d4ed8" }} dir="rtl">{a.title}</Link>
                ))}
                {items.length > 2 && <p className="text-[9px] text-gray-400 px-1">{"+" + (items.length-2) + " more"}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Gantt
  function GanttView() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const totalDays = 90;
    const cols = Array.from({ length: totalDays }, (_, i) => { const d = new Date(startDate); d.setDate(d.getDate()+i); return d; });
    const todayOff = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
    const withDates = filtered.filter((a) => a.created_at && (a.scheduled_at ?? a.published_at));
    function dayOff(d: string | null) { if (!d) return 0; return Math.floor((new Date(d).getTime() - startDate.getTime()) / 86400000); }
    const cW = 28;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex border-b border-gray-100 flex-shrink-0" style={{ marginLeft: "200px" }}>
          <div className="flex" style={{ width: totalDays*cW+"px" }}>
            {cols.map((d, i) => <div key={i} style={{ width: cW+"px", flexShrink: 0 }} className={"text-[9px] text-center border-l border-gray-100 py-1 " + (d.getDate()===1 ? "font-bold text-gray-600" : "text-gray-300")}>{d.getDate()===1 ? d.toLocaleDateString("en",{month:"short"}) : d.getDate()===15 ? "15" : ""}</div>)}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {withDates.map((a) => {
            const start = Math.max(0, dayOff(a.created_at));
            const end = dayOff(a.scheduled_at ?? a.published_at);
            const color = a.status === "published" ? "#22c55e" : a.status === "scheduled" ? "#3b82f6" : "#f59e0b";
            return (
              <div key={a.id} className="flex items-center border-b border-gray-50 hover:bg-gray-50" style={{ height: "38px" }}>
                <div className="flex-shrink-0 flex items-center gap-2 px-3 border-r border-gray-100" style={{ width: "200px" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <Link href={"/admin/articles/"+a.id} className="text-[11px] text-gray-700 truncate hover:underline" dir="rtl">{a.title}</Link>
                </div>
                <div className="relative flex-1 overflow-hidden" style={{ height: "38px" }}>
                  {todayOff >= 0 && todayOff < totalDays && <div className="absolute top-0 bottom-0 w-px bg-red-400 opacity-40 z-10" style={{ left: todayOff*cW+"px" }} />}
                  <div className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center px-2"
                    style={{ left: start*cW+"px", width: Math.max(cW,(end-start)*cW)+"px", height: "20px", background: color+"22", border: "1px solid "+color+"66" }}>
                    <span className="text-[9px] font-semibold truncate" style={{ color }}>{a.category?.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {withDates.length === 0 && <div className="flex items-center justify-center h-48 text-sm text-gray-300">No articles with dates</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {([{id:"kanban",icon:LayoutGrid,label:"Kanban"},{id:"calendar",icon:Calendar,label:"Calendar"},{id:"gantt",icon:GanttChartSquare,label:"Timeline"}] as const).map(({id,icon:Icon,label}) => (
            <button key={id} onClick={() => setPipelineView(id)} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all " + (pipelineView===id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-36 outline-none focus:border-gray-400 bg-gray-50" />
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:opacity-80">
            <Plus size={13} /> New Item
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {pipelineView === "kanban" && <KanbanView />}
        {pipelineView === "calendar" && <div className="bg-white rounded-xl border border-gray-100 p-5 h-full overflow-auto"><CalView /></div>}
        {pipelineView === "gantt" && <div className="bg-white rounded-xl border border-gray-100 p-5 h-full overflow-auto"><GanttView /></div>}
      </div>
      {showAdd && <AddArticleModal categories={categories} onClose={() => setShowAdd(false)} onAdd={(a) => onArticlesChange([a, ...articles])} />}
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ events: initial, team, articles }: { events: ProductionEvent[]; team: TeamMember[]; articles: Article[]; }) {
  const supabase = createClient();
  const [events, setEvents] = useState<ProductionEvent[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<ProductionEvent | null>(null);

  async function handleDelete(id: string) {
    const toastId = toast.loading("Deleting...");
    const { error } = await supabase.from("production_events").delete().eq("id", id);
    if (!error) { setEvents((prev) => prev.filter((e) => e.id !== id)); toast.success("Deleted", { id: toastId }); }
    else toast.error("Failed", { id: toastId });
  }

  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sorted.filter((e) => e.event_date >= today);
  const past = sorted.filter((e) => e.event_date < today).reverse();

  function EventCard({ event }: { event: ProductionEvent }) {
    const isPast = event.event_date < today;
    return (
      <div className={"bg-white border rounded-xl p-4 " + (isPast ? "opacity-60 border-gray-100" : "border-gray-200 shadow-sm")}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">{event.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays size={11} />
                {new Date(event.event_date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              {event.location && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={11} /> {event.location}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditEvent(event); setShowModal(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <Pencil size={12} />
            </button>
            <button onClick={() => handleDelete(event.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {event.schedule_items && event.schedule_items.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {event.schedule_items.sort((a, b) => a.sort_order - b.sort_order).map((item, i) => {
              const assignees = team.filter((m) => item.assignee_ids.includes(m.id));
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[10px] text-gray-400 font-mono w-14 flex-shrink-0 pt-0.5">{item.time ?? ""}</span>
                  <span className="text-[11px] text-gray-700 flex-1">{item.description}</span>
                  {assignees.length > 0 && (
                    <div className="flex -space-x-1">
                      {assignees.map((m) => <Avatar key={m.id} member={m} size={18} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {event.notes && <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-2 mt-2">{event.notes}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500">{upcoming.length} upcoming</span>
        <button onClick={() => { setEditEvent(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:opacity-80">
          <Plus size={13} /> New Event
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {upcoming.length === 0 && past.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <CalendarDays size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No events yet</p>
          </div>
        )}
        {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
        {past.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Past</p>
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </>
        )}
      </div>
      {showModal && (
        <EventModal team={team} articles={articles} event={editEvent}
          onClose={() => { setShowModal(false); setEditEvent(null); }}
          onSave={(e) => {
            if (editEvent) setEvents((prev) => prev.map((ev) => ev.id === e.id ? e : ev));
            else setEvents((prev) => [e, ...prev]);
          }} />
      )}
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ tasks: initial, team, articles, events }: { tasks: Task[]; team: TeamMember[]; articles: Article[]; events: ProductionEvent[]; }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");

  async function toggleDone(task: Task) {
    const next = !task.is_done;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_done: next } : t));
    await supabase.from("production_tasks").update({ is_done: next }).eq("id", task.id);
  }

  async function deleteTask(id: string) {
    const toastId = toast.loading("Deleting...");
    const { error } = await supabase.from("production_tasks").delete().eq("id", id);
    if (!error) { setTasks((prev) => prev.filter((t) => t.id !== id)); toast.success("Deleted", { id: toastId }); }
    else toast.error("Failed", { id: toastId });
  }

  const today = new Date().toISOString().slice(0, 10);
  const filtered = tasks.filter((t) => {
    if (filter === "overdue") return !t.is_done && t.due_date && t.due_date < today;
    return true;
  });
  const pending = filtered.filter((t) => !t.is_done);
  const done = filtered.filter((t) => t.is_done);

  function TaskRow({ task }: { task: Task }) {
    const assignee = team.find((m) => m.id === task.assignee_id);
    const article = articles.find((a) => a.id === task.article_id);
    const isOverdue = !task.is_done && task.due_date && task.due_date < today;
    return (
      <div className={"flex items-center gap-3 p-3 bg-white border rounded-lg " + (task.is_done ? "opacity-50 border-gray-100" : "border-gray-200 hover:border-gray-300") + " transition-all"}>
        <button onClick={() => toggleDone(task)}
          className={"w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all " + (task.is_done ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-500")}>
          {task.is_done && <Check size={11} className="text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={"text-xs font-medium " + (task.is_done ? "line-through text-gray-400" : "text-gray-800")}>{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.due_date && (
              <span className={"text-[10px] flex items-center gap-0.5 " + (isOverdue ? "text-red-500 font-semibold" : "text-gray-400")}>
                <Clock size={9} /> {new Date(task.due_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                {task.due_time && " " + task.due_time.slice(0, 5)}
              </span>
            )}
            {article && <span className="text-[10px] text-gray-400 truncate max-w-[120px]" dir="rtl">{article.title}</span>}
          </div>
        </div>
        {assignee && <Avatar member={assignee} size={22} />}
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditTask(task); setShowModal(true); }} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">
            <Pencil size={11} />
          </button>
          <button onClick={() => deleteTask(task.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(["all","overdue"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all " + (filter===f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              {f === "all" ? "All" : "Overdue"}
            </button>
          ))}
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:opacity-80">
          <Plus size={13} /> New Task
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {pending.length === 0 && done.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <ClipboardList size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
        {pending.map((t) => <TaskRow key={t.id} task={t} />)}
        {done.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Completed</p>
            {done.map((t) => <TaskRow key={t.id} task={t} />)}
          </>
        )}
      </div>
      {showModal && (
        <TaskModal team={team} articles={articles} events={events} task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={(t) => {
            if (editTask) setTasks((prev) => prev.map((tk) => tk.id === t.id ? t : tk));
            else setTasks((prev) => [t, ...prev]);
          }} />
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ProductionClient({ articles: initial, categories, team: initialTeam, events: initialEvents, tasks: initialTasks }: {
  articles: Article[]; categories: Category[]; team: TeamMember[];
  events: ProductionEvent[]; tasks: Task[];
}) {
  const [articles, setArticles] = useState<Article[]>(initial);
  const [tab, setTab] = useState<MainTab>("pipeline");

  const counts = {
    draft: articles.filter((a) => a.status === "draft").length,
    scheduled: articles.filter((a) => a.status === "scheduled").length,
    overdueTasks: initialTasks.filter((t) => !t.is_done && t.due_date && t.due_date < new Date().toISOString().slice(0,10)).length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/30">
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {([
              { id: "pipeline", icon: LayoutGrid, label: "Pipeline" },
              { id: "schedule", icon: CalendarDays, label: "Schedule" },
              { id: "tasks",    icon: ClipboardList, label: "Tasks" + (counts.overdueTasks > 0 ? " (" + counts.overdueTasks + ")" : "") },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={"flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all " +
                  (tab === id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600")}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span><span className="font-semibold text-yellow-500">{counts.draft}</span> drafts</span>
            <span><span className="font-semibold text-blue-500">{counts.scheduled}</span> scheduled</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-5">
        {tab === "pipeline" && <PipelineTab articles={articles} categories={categories} onArticlesChange={setArticles} />}
        {tab === "schedule" && <ScheduleTab events={initialEvents} team={initialTeam} articles={articles} />}
        {tab === "tasks"    && <TasksTab tasks={initialTasks} team={initialTeam} articles={articles} events={initialEvents} />}
      </div>
    </div>
  );
}
