// src/components/admin/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Bell, CalendarDays, ClipboardList, X } from "lucide-react";

interface Notification {
  id: string;
  type: "event" | "task";
  title: string;
  subtitle: string;
  href: string;
  urgent: boolean;
}

export default function NotificationBell() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const in48h = new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10);

      const [{ data: events }, { data: tasks }] = await Promise.all([
        supabase.from("production_events").select("id, title, event_date").gte("event_date", today).lte("event_date", in48h),
        supabase.from("production_tasks").select("id, title, due_date, due_time").eq("is_done", false).lte("due_date", in48h).not("due_date", "is", null),
      ]);

      const notifs: Notification[] = [];

      for (const e of events ?? []) {
        const isToday = e.event_date === today;
        notifs.push({
          id: "event-" + e.id, type: "event",
          title: e.title,
          subtitle: isToday ? "Today" : "Tomorrow",
          href: "/admin/production",
          urgent: isToday,
        });
      }

      for (const t of tasks ?? []) {
        const isOverdue = t.due_date < today;
        notifs.push({
          id: "task-" + t.id, type: "task",
          title: t.title,
          subtitle: isOverdue ? "Overdue" : "Due " + new Date(t.due_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
          href: "/admin/production",
          urgent: isOverdue,
        });
      }

      setNotifications(notifs);
    }
    load();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const urgent = notifications.filter((n) => n.urgent).length;
  const count = notifications.length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <Bell size={14} />
        {count > 0 && (
          <span className={"absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center " + (urgent > 0 ? "bg-red-500" : "bg-neutral-700")}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 w-72 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-body text-xs font-semibold text-foreground">Notifications</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={20} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-body text-xs text-muted-foreground">All clear</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " + (n.urgent ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-500")}>
                    {n.type === "event" ? <CalendarDays size={13} /> : <ClipboardList size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs font-medium text-foreground truncate">{n.title}</p>
                    <p className={"font-body text-[10px] " + (n.urgent ? "text-red-500 font-semibold" : "text-muted-foreground")}>{n.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
