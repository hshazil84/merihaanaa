"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Plus, X, ChevronLeft, ChevronRight, Users, Check } from "lucide-react";

const PJ = "'Plus Jakarta Sans', system-ui, sans-serif";
const DV = "'MVTypewriter','Noto Sans Thaana',sans-serif";

interface Article {
  id: string; title: string; slug: string; status: string;
  category_id: string | null; published_at: string | null;
  scheduled_at: string | null; created_at: string;
  category: { name: string; slug: string } | null;
}
interface Category { id: string; name: string; slug: string; }
interface TeamMember { id: string; full_name: string; role: string | null; phone: string | null; email: string | null; is_active: boolean; }
interface Task {
  id: string; title: string; stage: string; due_date: string | null;
  assignee_ids: string[]; article_id: string | null; created_at: string;
}
interface Project {
  id: string; title: string; description: string | null; stage: string;
  due_date: string | null; assignee_ids: string[]; created_at: string;
}

type ItemType = "article" | "task" | "project";
type Stage = "todo" | "inprogress" | "done";

interface BoardItem {
  id: string; type: ItemType; title: string; stage: Stage;
  date: string | null; assignee_ids: string[]; category?: string | null;
}

const STAGE_COLORS: Record<Stage, { bg: string; border: string; dot: string; label: string }> = {
  todo:       { bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", label: "To do" },
  inprogress: { bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6", label: "In progress" },
  done:       { bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", label: "Done" },
};

const TYPE_COLORS: Record<ItemType, string> = {
  article: "#6b7280", task: "#3b82f6", project: "#8b5cf6",
};

const CREW_ROLES = ["Photographer", "Videographer", "Makeup Artist", "Writer", "Editor", "Director", "Producer", "Other"];

function isDhivehi(text: string): boolean {
  return /[\u0780-\u07BF]/.test(text);
}
function textFont(text: string): string {
  return isDhivehi(text) ? DV : PJ;
}

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") + "-" + Math.random().toString(36).slice(2, 5);
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function MemberAvatar({ member, size = 20 }: { member: TeamMember; size?: number }) {
  const initials = member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600, color: "#64748b", flexShrink: 0, fontFamily: PJ }}>
      {initials}
    </div>
  );
}

// ── Sticky Note Card ──────────────────────────────────────────────────────────
function StickyCard({ item, team, onStageChange, onEdit, onDragStart }: {
  item: BoardItem; team: TeamMember[];
  onStageChange: (id: string, type: ItemType, stage: Stage) => void;
  onEdit: (item: BoardItem) => void;
  onDragStart: (e: React.DragEvent, item: BoardItem) => void;
}) {
  const s = STAGE_COLORS[item.stage];
  const stages: Stage[] = ["todo", "inprogress", "done"];
  const nextStage = stages[(stages.indexOf(item.stage) + 1) % stages.length];
  const assignees = team.filter((m) => item.assignee_ids.includes(m.id));

  function cycleStage(e: React.MouseEvent) {
    e.stopPropagation();
    onStageChange(item.id, item.type, nextStage);
  }

  return (
    <div draggable onDragStart={(e) => onDragStart(e, item)} onClick={() => onEdit(item)}
      style={{ background: s.bg, border: "1px solid " + s.border, borderRadius: "8px", padding: "7px 8px", marginBottom: "4px", cursor: "grab", userSelect: "none", position: "relative" }}>

      {/* Status dot — clickable to cycle */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
        <button onClick={cycleStage} title={"→ " + STAGE_COLORS[nextStage].label}
          style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.dot, border: "none", cursor: "pointer", flexShrink: 0, marginTop: "3px", padding: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.5, fontFamily: textFont(item.title), wordBreak: "break-word" }}
            dir={isDhivehi(item.title) ? "rtl" : "ltr"}>
            {item.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "9px", fontWeight: 600, color: TYPE_COLORS[item.type], background: TYPE_COLORS[item.type] + "18", padding: "1px 5px", borderRadius: "4px", fontFamily: PJ }}>
              {item.type}
            </span>
            {item.category && (
              <span style={{ fontSize: "9px", color: "#9ca3af", fontFamily: PJ }}>{item.category}</span>
            )}
          </div>
          {assignees.length > 0 && (
            <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
              {assignees.slice(0, 3).map((m) => <MemberAvatar key={m.id} member={m} size={16} />)}
              {assignees.length > 3 && <span style={{ fontSize: "9px", color: "#9ca3af", fontFamily: PJ }}>+{assignees.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New / Edit Item Modal ─────────────────────────────────────────────────────
function ItemModal({ categories, team, articles, item, defaultDate, onClose, onSave }: {
  categories: Category[]; team: TeamMember[]; articles: Article[];
  item?: BoardItem | null; defaultDate?: string;
  onClose: () => void; onSave: (item: BoardItem) => void;
}) {
  const supabase = createClient();
  const [type, setType] = useState<ItemType>(item?.type ?? "article");
  const [title, setTitle] = useState(item?.title ?? "");
  const [stage, setStage] = useState<Stage>((item?.stage as Stage) ?? "todo");
  const [date, setDate] = useState(item?.date ?? defaultDate ?? "");
  const [catId, setCatId] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(item?.assignee_ids ?? []);
  const [linkedArticle, setLinkedArticle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const toastId = toast.loading("Saving...");

    if (type === "article") {
      const { data, error } = await supabase.from("articles")
        .insert({ title: title.trim(), slug: slugify(title), status: stage === "done" ? "published" : "draft", content_type: "article", category_id: catId || null, scheduled_at: date || null, body: {} })
        .select("id").single();
      if (error || !data) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      const cat = categories.find((c) => c.id === catId);
      toast.success("Created", { id: toastId });
      onSave({ id: data.id, type: "article", title: title.trim(), stage, date: date || null, assignee_ids: assigneeIds, category: cat?.name ?? null });
    } else if (type === "task") {
      const payload = { title: title.trim(), stage, due_date: date || null, assignee_ids: assigneeIds, article_id: linkedArticle || null, is_done: stage === "done" };
      const { data, error } = item?.id
        ? await supabase.from("production_tasks").update(payload).eq("id", item.id).select("id").single()
        : await supabase.from("production_tasks").insert(payload).select("id").single();
      if (error || !data) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      toast.success(item ? "Saved" : "Created", { id: toastId });
      onSave({ id: data.id, type: "task", title: title.trim(), stage, date: date || null, assignee_ids: assigneeIds });
    } else {
      const payload = { title: title.trim(), description: description || null, stage, due_date: date || null, assignee_ids: assigneeIds };
      const { data, error } = item?.id
        ? await supabase.from("production_projects").update(payload).eq("id", item.id).select("id").single()
        : await supabase.from("production_projects").insert(payload).select("id").single();
      if (error || !data) { toast.error("Failed", { id: toastId }); setSaving(false); return; }
      toast.success(item ? "Saved" : "Created", { id: toastId });
      onSave({ id: data.id, type: "project", title: title.trim(), stage, date: date || null, assignee_ids: assigneeIds });
    }
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <div dir="ltr" style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "400px", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "0.5px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontFamily: PJ, fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>
              {item ? "Edit item" : "New item"}
            </p>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
              <X size={15} />
            </button>
          </div>
          {!item && (
            <div style={{ display: "flex", gap: "6px" }}>
              {(["article", "task", "project"] as ItemType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: "8px", fontSize: "12px", fontFamily: PJ, fontWeight: 500, border: "0.5px solid", cursor: "pointer", borderColor: type === t ? "#d1d5db" : "#f3f4f6", background: type === t ? "white" : "#f9fafb", color: type === t ? "#111827" : "#9ca3af", transition: "all 0.15s" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>

          <div>
            <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>Title *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={type === "article" ? "Article title..." : type === "task" ? "What needs to be done?" : "Project name..."}
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: PJ, outline: "none" }} />
          </div>

          {type === "article" && (
            <div>
              <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>Category</label>
              <select value={catId} onChange={(e) => setCatId(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: PJ, outline: "none", background: "white" }}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {type === "task" && (
            <div>
              <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>Linked article</label>
              <select value={linkedArticle} onChange={(e) => setLinkedArticle(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: PJ, outline: "none", background: "white" }}>
                <option value="">None</option>
                {articles.slice(0, 50).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          )}

          {type === "project" && (
            <div>
              <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: PJ, outline: "none", resize: "none" }} />
            </div>
          )}

          <div>
            <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "5px" }}>
              {type === "task" ? "Due date" : "Target date"}
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "0.5px solid #d1d5db", borderRadius: "8px", fontSize: "13px", fontFamily: PJ, outline: "none" }} />
          </div>

          {/* Assignees */}
          {(type === "task" || type === "project") && team.length > 0 && (
            <div>
              <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "7px" }}>Crew</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {team.filter((m) => m.is_active).map((m) => {
                  const selected = assigneeIds.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleAssignee(m.id)}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 8px", borderRadius: "20px", border: "0.5px solid", borderColor: selected ? "#374151" : "#e5e7eb", background: selected ? "#111827" : "white", cursor: "pointer", transition: "all 0.15s" }}>
                      {selected && <Check size={9} color="white" />}
                      <span style={{ fontSize: "11px", fontWeight: 500, fontFamily: PJ, color: selected ? "white" : "#6b7280" }}>
                        {m.full_name.split(" ")[0]}
                      </span>
                      {m.role && (
                        <span style={{ fontSize: "9px", color: selected ? "rgba(255,255,255,0.6)" : "#d1d5db", fontFamily: PJ }}>
                          {m.role}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage */}
          <div>
            <label style={{ fontFamily: PJ, fontSize: "11px", color: "#6b7280", display: "block", marginBottom: "7px" }}>Status</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {(Object.entries(STAGE_COLORS) as [Stage, typeof STAGE_COLORS[Stage]][]).map(([s, cfg]) => (
                <button key={s} onClick={() => setStage(s)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: "8px", fontSize: "11px", fontFamily: PJ, fontWeight: 500, border: "1px solid", cursor: "pointer", borderColor: stage === s ? cfg.dot : "#f3f4f6", background: stage === s ? cfg.bg : "#f9fafb", color: stage === s ? cfg.dot : "#9ca3af", transition: "all 0.15s" }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ fontFamily: PJ, fontSize: "13px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()}
            style={{ fontFamily: PJ, fontSize: "13px", fontWeight: 600, padding: "8px 20px", borderRadius: "8px", background: "#111827", color: "white", border: "none", cursor: "pointer", opacity: saving || !title.trim() ? 0.4 : 1 }}>
            {saving ? "Saving..." : item ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Crew Panel ────────────────────────────────────────────────────────────────
function CrewPanel({ team: initial, onClose }: { team: TeamMember[]; onClose: () => void; }) {
  const supabase = createClient();
  const [team, setTeam] = useState<TeamMember[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(CREW_ROLES[0]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("team")
      .insert({ full_name: name.trim(), role, phone: phone || null, email: email || null, is_active: true })
      .select("*").single();
    if (!error && data) { setTeam((prev) => [...prev, data]); toast.success("Added"); }
    else toast.error("Failed");
    setName(""); setPhone(""); setEmail(""); setShowAdd(false); setSaving(false);
  }

  async function handleRemove(id: string) {
    await supabase.from("team").update({ is_active: false }).eq("id", id);
    setTeam((prev) => prev.filter((m) => m.id !== id));
    toast.success("Removed");
  }

  return (
    <div dir="ltr" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "280px", background: "white", borderLeft: "0.5px solid #e5e7eb", zIndex: 40, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontFamily: PJ, fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>Crew</p>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#111827", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={13} color="white" />
          </button>
          <button onClick={onClose}
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f9fafb", border: "0.5px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {showAdd && (
        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #e5e7eb", background: "#f9fafb", display: "flex", flexDirection: "column", gap: "8px" }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            style={{ padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "7px", fontSize: "12px", fontFamily: PJ, outline: "none" }} />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            style={{ padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "7px", fontSize: "12px", fontFamily: PJ, outline: "none", background: "white" }}>
            {CREW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)"
            style={{ padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "7px", fontSize: "12px", fontFamily: PJ, outline: "none" }} />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)"
            style={{ padding: "7px 10px", border: "0.5px solid #d1d5db", borderRadius: "7px", fontSize: "12px", fontFamily: PJ, outline: "none" }} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={handleAdd} disabled={saving || !name.trim()}
              style={{ flex: 1, padding: "7px", borderRadius: "7px", background: "#111827", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: PJ, fontWeight: 600, opacity: saving || !name.trim() ? 0.4 : 1 }}>
              Add
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ flex: 1, padding: "7px", borderRadius: "7px", background: "white", border: "0.5px solid #e5e7eb", cursor: "pointer", fontSize: "12px", fontFamily: PJ, color: "#6b7280" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {team.filter((m) => m.is_active).map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <MemberAvatar member={m} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: PJ, fontSize: "12px", fontWeight: 600, color: "#111827", margin: 0 }}>{m.full_name}</p>
              {m.role && <p style={{ fontFamily: PJ, fontSize: "10px", color: "#9ca3af", margin: 0 }}>{m.role}</p>}
            </div>
            <button onClick={() => handleRemove(m.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 0, flexShrink: 0 }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ef4444")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#d1d5db")}>
              <X size={13} />
            </button>
          </div>
        ))}
        {team.filter((m) => m.is_active).length === 0 && (
          <p style={{ fontFamily: PJ, fontSize: "12px", color: "#d1d5db", textAlign: "center", padding: "2rem" }}>No crew yet</p>
        )}
      </div>
    </div>
  );
}

// ── Calendar Board ────────────────────────────────────────────────────────────
export default function ProductionClient({ articles: initialArticles, categories, team: initialTeam, tasks: initialTasks, projects: initialProjects }: {
  articles: Article[]; categories: Category[]; team: TeamMember[];
  tasks: Task[]; projects: Project[];
}) {
  const supabase = createClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [items, setItems] = useState<BoardItem[]>(() => {
    const all: BoardItem[] = [];
    for (const a of initialArticles) {
      const d = a.scheduled_at ?? a.published_at;
      if (!d && a.status === "archived") continue;
      all.push({ id: a.id, type: "article", title: a.title, stage: a.status === "published" ? "done" : a.status === "scheduled" ? "inprogress" : "todo", date: d ? d.slice(0, 10) : null, assignee_ids: [], category: a.category?.name ?? null });
    }
    for (const t of initialTasks) {
      all.push({ id: t.id, type: "task", title: t.title, stage: (t.stage as Stage) ?? "todo", date: t.due_date ? t.due_date.slice(0, 10) : null, assignee_ids: t.assignee_ids ?? [] });
    }
    for (const p of initialProjects) {
      all.push({ id: p.id, type: "project", title: p.title, stage: (p.stage as Stage) ?? "todo", date: p.due_date ? p.due_date.slice(0, 10) : null, assignee_ids: p.assignee_ids ?? [] });
    }
    return all;
  });
  const [unscheduled, setUnscheduled] = useState<BoardItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [showCrew, setShowCrew] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<BoardItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragging, setDragging] = useState<BoardItem | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);

  const days = getDaysInMonth(year, month);
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() });
  const todayKey = formatDate(now);

  const byDate: Record<string, BoardItem[]> = {};
  for (const item of items) {
    if (!item.date) continue;
    const key = item.date;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(item);
  }
  const noDate = items.filter((i) => !i.date);

  function prev() { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); }
  function next() { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); }

  async function handleStageChange(id: string, type: ItemType, stage: Stage) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, stage } : i));
    if (type === "article") {
      const statusMap: Record<Stage, string> = { todo: "draft", inprogress: "scheduled", done: "published" };
      await supabase.from("articles").update({ status: statusMap[stage] }).eq("id", id);
    } else if (type === "task") {
      await supabase.from("production_tasks").update({ stage, is_done: stage === "done" }).eq("id", id);
    } else {
      await supabase.from("production_projects").update({ stage }).eq("id", id);
    }
  }

  async function handleDateDrop(newDate: string) {
    if (!dragging) return;
    const item = dragging;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, date: newDate } : i));
    setDragging(null); setOverDate(null);
    if (item.type === "article") await supabase.from("articles").update({ scheduled_at: newDate }).eq("id", item.id);
    else if (item.type === "task") await supabase.from("production_tasks").update({ due_date: newDate }).eq("id", item.id);
    else await supabase.from("production_projects").update({ due_date: newDate }).eq("id", item.id);
    toast.success("Rescheduled");
  }

  function handleSaveItem(saved: BoardItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === saved.id);
      if (exists) return prev.map((i) => i.id === saved.id ? saved : i);
      return [saved, ...prev];
    });
  }

  const monthLabel = new Date(year, month).toLocaleDateString("en", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", fontFamily: PJ, background: "#fafafa" }}>

      {/* Header */}
      <div style={{ flexShrink: 0, background: "white", borderBottom: "0.5px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontFamily: PJ, fontSize: "14px", fontWeight: 700, color: "#111827", margin: 0 }}>Production</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button onClick={prev} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "0.5px solid #e5e7eb", background: "white", cursor: "pointer", color: "#6b7280" }}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontFamily: PJ, fontSize: "13px", fontWeight: 600, color: "#374151", minWidth: "130px", textAlign: "center" }}>{monthLabel}</span>
            <button onClick={next} style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", border: "0.5px solid #e5e7eb", background: "white", cursor: "pointer", color: "#6b7280" }}>
              <ChevronRight size={13} />
            </button>
            <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
              style={{ fontFamily: PJ, fontSize: "11px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>Today</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "#9ca3af", fontFamily: PJ }}>
            {(Object.entries(STAGE_COLORS) as [Stage, typeof STAGE_COLORS[Stage]][]).map(([s, cfg]) => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => setShowCrew(!showCrew)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", border: "0.5px solid #e5e7eb", background: showCrew ? "#111827" : "white", color: showCrew ? "white" : "#374151", cursor: "pointer", fontSize: "12px", fontFamily: PJ, fontWeight: 500 }}>
            <Users size={13} /> Crew {team.filter((m) => m.is_active).length > 0 && "(" + team.filter((m) => m.is_active).length + ")"}
          </button>
          <button onClick={() => { setEditItem(null); setSelectedDate(null); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "#111827", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: PJ, fontWeight: 600 }}>
            <Plus size={13} /> New Item
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} style={{ fontFamily: PJ, fontSize: "10px", fontWeight: 700, color: "#9ca3af", textAlign: "center", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {blanks.map((_, i) => <div key={"b" + i} />)}
          {days.map((day) => {
            const key = formatDate(day);
            const dayItems = byDate[key] ?? [];
            const isToday = key === todayKey;
            const isOver = overDate === key;

            return (
              <div key={key}
                onDragOver={(e) => { e.preventDefault(); setOverDate(key); }}
                onDragLeave={() => setOverDate(null)}
                onDrop={() => handleDateDrop(key)}
                onClick={() => { setSelectedDate(key); setEditItem(null); setShowModal(true); }}
                style={{ minHeight: "100px", borderRadius: "10px", padding: "6px", border: "1px solid", borderColor: isOver ? "#94a3b8" : isToday ? "#3b82f6" : "#e5e7eb", background: isOver ? "#f1f5f9" : isToday ? "#eff6ff" : "white", cursor: "pointer", transition: "all 0.15s", position: "relative" }}>

                <p style={{ fontFamily: PJ, fontSize: "11px", fontWeight: isToday ? 700 : 500, color: isToday ? "#2563eb" : "#6b7280", margin: "0 0 4px", textAlign: "right" }}>
                  {day.getDate()}
                </p>

                <div onClick={(e) => e.stopPropagation()}>
                  {dayItems.map((item) => (
                    <StickyCard key={item.id} item={item} team={team}
                      onStageChange={handleStageChange}
                      onEdit={(i) => { setEditItem(i); setShowModal(true); }}
                      onDragStart={(e, i) => { e.stopPropagation(); setDragging(i); }} />
                  ))}
                </div>

                {dayItems.length > 0 && (
                  <button style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "2px 0", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(key); setEditItem(null); setShowModal(true); }}>
                    <Plus size={11} color="#d1d5db" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Unscheduled tray */}
        {noDate.length > 0 && (
          <div style={{ marginTop: "16px", background: "white", border: "0.5px solid #e5e7eb", borderRadius: "12px", padding: "12px 16px" }}>
            <p style={{ fontFamily: PJ, fontSize: "11px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
              Unscheduled ({noDate.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {noDate.map((item) => {
                const s = STAGE_COLORS[item.stage];
                return (
                  <button key={item.id} onClick={() => { setEditItem(item); setShowModal(true); }}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "20px", border: "1px solid " + s.border, background: s.bg, cursor: "pointer" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "#374151", fontFamily: textFont(item.title) }}>{item.title}</span>
                    <span style={{ fontSize: "9px", color: TYPE_COLORS[item.type], fontFamily: PJ }}>{item.type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {showModal && (
        <ItemModal categories={categories} team={team} articles={initialArticles}
          item={editItem} defaultDate={selectedDate ?? undefined}
          onClose={() => { setShowModal(false); setEditItem(null); setSelectedDate(null); }}
          onSave={handleSaveItem} />
      )}

      {showCrew && <CrewPanel team={team} onClose={() => setShowCrew(false)} />}

    </div>
  );
}
