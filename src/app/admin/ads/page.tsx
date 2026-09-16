"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { AD_SLOTS } from "@/lib/adSlots";

type Booking = {
  id: string;
  slot_key: string;
  advertiser: string;
  status: string;
  creative_url: string | null;
  creative_url_mobile: string | null;
  click_url: string | null;
  starts_on: string;
  ends_on: string;
  notes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  booked: "ބުކްކޮށްފައި",
  live: "ހިނގަނީ",
  ended: "ނިމިފައި",
};

const EMPTY = {
  slot_key: AD_SLOTS[0]?.id ?? "",
  advertiser: "",
  status: "booked",
  creative_url: "",
  creative_url_mobile: "",
  click_url: "",
  starts_on: "",
  ends_on: "",
  notes: "",
};

export default function AdminAdsPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("ad_bookings")
      .select("*")
      .order("starts_on", { ascending: false });
    if (error) toast.error("ލޯޑް ނުވި");
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().slice(0, 10);

  const liveFor = (slotKey: string) =>
    bookings.find(
      (b) => b.slot_key === slotKey && b.status === "live" && b.starts_on <= today && b.ends_on >= today
    );

  const save = async () => {
    if (!form.advertiser.trim() || !form.starts_on || !form.ends_on) {
      toast.error("އިޝްތިހާރުދޭ ފަރާތާއި ތާރީޚް ފުރިހަމަކުރޭ");
      return;
    }
    if (form.ends_on < form.starts_on) {
      toast.error("ނިމޭ ތާރީޚް ފެށޭ ތާރީޚަށްވުރެ ކުރިން ނުވާނެ");
      return;
    }
    setSaving(true);
    const payload = {
      slot_key: form.slot_key,
      advertiser: form.advertiser.trim(),
      status: form.status,
      creative_url: form.creative_url.trim() || null,
      creative_url_mobile: form.creative_url_mobile.trim() || null,
      click_url: form.click_url.trim() || null,
      starts_on: form.starts_on,
      ends_on: form.ends_on,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editingId
      ? await supabase.from("ad_bookings").update(payload).eq("id", editingId)
      : await supabase.from("ad_bookings").insert(payload);
    setSaving(false);
    if (error) { toast.error("ސޭވް ނުވި"); return; }
    toast.success(editingId ? "އަޕްޑޭޓްވެއްޖެ" : "އިތުރުކުރެވިއްޖެ");
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const edit = (b: Booking) => {
    setEditingId(b.id);
    setForm({
      slot_key: b.slot_key,
      advertiser: b.advertiser,
      status: b.status,
      creative_url: b.creative_url ?? "",
      creative_url_mobile: b.creative_url_mobile ?? "",
      click_url: b.click_url ?? "",
      starts_on: b.starts_on,
      ends_on: b.ends_on,
      notes: b.notes ?? "",
    });
  };

  const remove = async (id: string) => {
    if (!confirm("މި ބުކިންގ ޑިލީޓްކުރަންތަ؟")) return;
    const { error } = await supabase.from("ad_bookings").delete().eq("id", id);
    if (error) { toast.error("ޑިލީޓް ނުވި"); return; }
    toast.success("ޑިލީޓްވެއްޖެ");
    load();
  };

  const input = "w-full h-9 px-3 rounded-lg border border-border bg-background font-body text-sm";
  const lbl = "font-body text-xs text-muted-foreground mb-1 block";

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">

      {/* Inventory — one row per slot defined in the registry */}
      <section className="mb-8">
        <h2 className="font-body text-sm font-semibold mb-3">ސްލޮޓް އިންވެންޓްރީ</h2>
        <div className="rounded-xl border border-border overflow-hidden bg-background">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="font-body text-xs text-muted-foreground">
                <th className="text-right p-3 font-normal">ސްލޮޓް</th>
                <th className="text-right p-3 font-normal">ޞަފްޙާ</th>
                <th className="text-right p-3 font-normal">ޑެސްކްޓޮޕް</th>
                <th className="text-right p-3 font-normal">މޮބައިލް</th>
                <th className="text-right p-3 font-normal">މިހާރު</th>
              </tr>
            </thead>
            <tbody>
              {AD_SLOTS.map((slot) => {
                const live = liveFor(slot.id);
                return (
                  <tr key={slot.id} className="border-t border-border font-body text-sm">
                    <td className="p-3">
                      <span className="font-mono text-xs">{slot.id}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{slot.placement}</p>
                    </td>
                    <td className="p-3">{slot.page}</td>
                    <td className="p-3 text-xs">{slot.desktop?.label ?? "—"}</td>
                    <td className="p-3 text-xs">{slot.mobile?.label ?? "—"}</td>
                    <td className="p-3">
                      {live ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-800">{live.advertiser}</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">ހުސް</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Booking form */}
      <section className="mb-8">
        <h2 className="font-body text-sm font-semibold mb-3">
          {editingId ? "ބުކިންގ އެޑިޓް" : "އާ ބުކިންގ"}
        </h2>
        <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>ސްލޮޓް</label>
            <select className={input} value={form.slot_key} onChange={(e) => setForm({ ...form, slot_key: e.target.value })}>
              {AD_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>އިޝްތިހާރުދޭ ފަރާތް</label>
            <input className={input} value={form.advertiser} onChange={(e) => setForm({ ...form, advertiser: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ސްޓޭޓަސް</label>
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>ފެށޭ ތާރީޚް</label>
            <input type="date" className={input} value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ނިމޭ ތާރީޚް</label>
            <input type="date" className={input} value={form.ends_on} onChange={(e) => setForm({ ...form, ends_on: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ކްލިކް ލިންކް</label>
            <input className={input} dir="ltr" value={form.click_url} onChange={(e) => setForm({ ...form, click_url: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ކްރިއޭޓިވް (ޑެސްކްޓޮޕް)</label>
            <input className={input} dir="ltr" value={form.creative_url} onChange={(e) => setForm({ ...form, creative_url: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ކްރިއޭޓިވް (މޮބައިލް)</label>
            <input className={input} dir="ltr" value={form.creative_url_mobile} onChange={(e) => setForm({ ...form, creative_url_mobile: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ނޯޓް</label>
            <input className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2">
            <button onClick={save} disabled={saving}
              className="h-9 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-50">
              {saving ? "ސޭވްވަނީ..." : editingId ? "އަޕްޑޭޓް" : "އިތުރުކުރޭ"}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm(EMPTY); }}
                className="h-9 px-4 rounded-lg border border-border font-body text-xs">
                ކެންސަލް
              </button>
            )}
          </div>
        </div>
      </section>

      {/* All bookings */}
      <section>
        <h2 className="font-body text-sm font-semibold mb-3">ހުރިހާ ބުކިންގ</h2>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">ލޯޑްވަނީ...</p>
        ) : bookings.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">ބުކިންގއެއް ނެތް</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="font-body text-xs text-muted-foreground">
                  <th className="text-right p-3 font-normal">އިޝްތިހާރުދޭ ފަރާތް</th>
                  <th className="text-right p-3 font-normal">ސްލޮޓް</th>
                  <th className="text-right p-3 font-normal">ތާރީޚް</th>
                  <th className="text-right p-3 font-normal">ސްޓޭޓަސް</th>
                  <th className="text-right p-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-border font-body text-sm">
                    <td className="p-3">{b.advertiser}</td>
                    <td className="p-3 font-mono text-xs">{b.slot_key}</td>
                    <td className="p-3 text-xs" dir="ltr">{b.starts_on} → {b.ends_on}</td>
                    <td className="p-3 text-xs">{STATUS_LABELS[b.status] ?? b.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => edit(b)} className="text-xs text-muted-foreground hover:text-foreground">އެޑިޓް</button>
                        <button onClick={() => remove(b.id)} className="text-xs text-destructive">ޑިލީޓް</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
