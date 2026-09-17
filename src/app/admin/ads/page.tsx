"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { AD_SLOTS } from "@/lib/adSlots";

type Advertiser = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
};

type Booking = {
  id: string;
  slot_key: string;
  advertiser_id: string;
  advertiser: { name: string } | null;
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

const EMPTY_BOOKING = {
  slot_key: AD_SLOTS[0]?.id ?? "",
  advertiser_id: "",
  status: "booked",
  creative_url: "",
  creative_url_mobile: "",
  click_url: "",
  starts_on: "",
  ends_on: "",
  notes: "",
};

const EMPTY_ADVERTISER = {
  name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  notes: "",
};

export default function AdminAdsPage() {
  const supabase = createClient();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [bForm, setBForm] = useState(EMPTY_BOOKING);
  const [bEditing, setBEditing] = useState<string | null>(null);
  const [bSaving, setBSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);

  const [aForm, setAForm] = useState(EMPTY_ADVERTISER);
  const [aEditing, setAEditing] = useState<string | null>(null);
  const [aSaving, setASaving] = useState(false);

  const load = async () => {
    const [{ data: adv, error: advErr }, { data: bk, error: bkErr }] = await Promise.all([
      supabase.from("advertisers").select("*").order("name"),
      supabase
        .from("ad_bookings")
        .select("*, advertiser:advertisers!advertiser_id(name)")
        .order("starts_on", { ascending: false }),
    ]);
    if (advErr || bkErr) toast.error("ލޯޑް ނުވި");
    setAdvertisers((adv as Advertiser[]) ?? []);
    setBookings((bk as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().slice(0, 10);

  const liveFor = (slotKey: string) =>
    bookings.find(
      (b) => b.slot_key === slotKey && b.status === "live" && b.starts_on <= today && b.ends_on >= today
    );

  const bookingCount = (advertiserId: string) =>
    bookings.filter((b) => b.advertiser_id === advertiserId).length;

  // ── advertisers ──────────────────────────────────────

  const saveAdvertiser = async () => {
    if (!aForm.name.trim()) { toast.error("ނަން ފުރިހަމަކުރޭ"); return; }
    setASaving(true);
    const payload = {
      name: aForm.name.trim(),
      contact_name: aForm.contact_name.trim() || null,
      contact_email: aForm.contact_email.trim() || null,
      contact_phone: aForm.contact_phone.trim() || null,
      notes: aForm.notes.trim() || null,
    };
    const { error } = aEditing
      ? await supabase.from("advertisers").update(payload).eq("id", aEditing)
      : await supabase.from("advertisers").insert(payload);
    setASaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "މި ނަން ކުރިންވެސް އެބައޮތް" : "ސޭވް ނުވި");
      return;
    }
    toast.success(aEditing ? "އަޕްޑޭޓްވެއްޖެ" : "އިތުރުކުރެވިއްޖެ");
    setAForm(EMPTY_ADVERTISER);
    setAEditing(null);
    load();
  };

  const editAdvertiser = (a: Advertiser) => {
    setAEditing(a.id);
    setAForm({
      name: a.name,
      contact_name: a.contact_name ?? "",
      contact_email: a.contact_email ?? "",
      contact_phone: a.contact_phone ?? "",
      notes: a.notes ?? "",
    });
  };

  const toggleAdvertiser = async (a: Advertiser) => {
    const { error } = await supabase
      .from("advertisers")
      .update({ is_active: !a.is_active })
      .eq("id", a.id);
    if (error) { toast.error("ބަދަލު ނުކުރެވުނު"); return; }
    load();
  };

  // ── creative upload ──────────────────────────────────

  const uploadCreative = async (file: File, breakpoint: "desktop" | "mobile") => {
    setUploading(breakpoint);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slotId", bForm.slot_key);
    fd.append("breakpoint", breakpoint);
    try {
      const res = await fetch("/api/upload-ad-creative", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upload failed");
      setBForm((f) => ({
        ...f,
        [breakpoint === "desktop" ? "creative_url" : "creative_url_mobile"]: data.url,
      }));
      if (data.warning) toast.error(data.warning);
      else toast.success("އަޕްލޯޑްވެއްޖެ");
    } catch {
      toast.error("އަޕްލޯޑް ނުވި");
    } finally {
      setUploading(null);
    }
  };

  // ── bookings ─────────────────────────────────────────

  const saveBooking = async () => {
    if (!bForm.advertiser_id || !bForm.starts_on || !bForm.ends_on) {
      toast.error("އިޝްތިހާރުދޭ ފަރާތާއި ތާރީޚް ފުރިހަމަކުރޭ");
      return;
    }
    if (bForm.ends_on < bForm.starts_on) {
      toast.error("ނިމޭ ތާރީޚް ފެށޭ ތާރީޚަށްވުރެ ކުރިން ނުވާނެ");
      return;
    }
    setBSaving(true);
    const payload = {
      slot_key: bForm.slot_key,
      advertiser_id: bForm.advertiser_id,
      status: bForm.status,
      creative_url: bForm.creative_url.trim() || null,
      creative_url_mobile: bForm.creative_url_mobile.trim() || null,
      click_url: bForm.click_url.trim() || null,
      starts_on: bForm.starts_on,
      ends_on: bForm.ends_on,
      notes: bForm.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = bEditing
      ? await supabase.from("ad_bookings").update(payload).eq("id", bEditing)
      : await supabase.from("ad_bookings").insert(payload);
    setBSaving(false);
    if (error) { toast.error("ސޭވް ނުވި"); return; }
    toast.success(bEditing ? "އަޕްޑޭޓްވެއްޖެ" : "އިތުރުކުރެވިއްޖެ");
    setBForm(EMPTY_BOOKING);
    setBEditing(null);
    load();
  };

  const editBooking = (b: Booking) => {
    setBEditing(b.id);
    setBForm({
      slot_key: b.slot_key,
      advertiser_id: b.advertiser_id,
      status: b.status,
      creative_url: b.creative_url ?? "",
      creative_url_mobile: b.creative_url_mobile ?? "",
      click_url: b.click_url ?? "",
      starts_on: b.starts_on,
      ends_on: b.ends_on,
      notes: b.notes ?? "",
    });
  };

  const removeBooking = async (id: string) => {
    if (!confirm("މި ބުކިންގ ޑިލީޓްކުރަންތަ؟")) return;
    const { error } = await supabase.from("ad_bookings").delete().eq("id", id);
    if (error) { toast.error("ޑިލީޓް ނުވި"); return; }
    toast.success("ޑިލީޓްވެއްޖެ");
    load();
  };

  const input = "w-full h-9 px-3 rounded-lg border border-border bg-background font-body text-sm";
  const lbl = "font-body text-xs text-muted-foreground mb-1 block";
  const activeAdvertisers = advertisers.filter((a) => a.is_active);

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">

      {/* Inventory */}
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
                        <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-800">
                          {live.advertiser?.name ?? "—"}
                        </span>
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

      {/* Advertiser directory */}
      <section className="mb-8">
        <h2 className="font-body text-sm font-semibold mb-3">
          {aEditing ? "ފަރާތް އެޑިޓް" : "އިޝްތިހާރުދޭ ފަރާތްތައް"}
        </h2>

        <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className={lbl}>ނަން</label>
            <input className={input} value={aForm.name} onChange={(e) => setAForm({ ...aForm, name: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ގުޅޭ ފަރާތް</label>
            <input className={input} value={aForm.contact_name} onChange={(e) => setAForm({ ...aForm, contact_name: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>އީމެއިލް</label>
            <input className={input} dir="ltr" value={aForm.contact_email} onChange={(e) => setAForm({ ...aForm, contact_email: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ފޯން</label>
            <input className={input} dir="ltr" value={aForm.contact_phone} onChange={(e) => setAForm({ ...aForm, contact_phone: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>ނޯޓް</label>
            <input className={input} value={aForm.notes} onChange={(e) => setAForm({ ...aForm, notes: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2">
            <button onClick={saveAdvertiser} disabled={aSaving}
              className="h-9 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-50">
              {aSaving ? "ސޭވްވަނީ..." : aEditing ? "އަޕްޑޭޓް" : "އިތުރުކުރޭ"}
            </button>
            {aEditing && (
              <button onClick={() => { setAEditing(null); setAForm(EMPTY_ADVERTISER); }}
                className="h-9 px-4 rounded-lg border border-border font-body text-xs">
                ކެންސަލް
              </button>
            )}
          </div>
        </div>

        {advertisers.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden bg-background">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="font-body text-xs text-muted-foreground">
                  <th className="text-right p-3 font-normal">ނަން</th>
                  <th className="text-right p-3 font-normal">ގުޅޭ ފަރާތް</th>
                  <th className="text-right p-3 font-normal">ބުކިންގ</th>
                  <th className="text-right p-3 font-normal">ހާލަތު</th>
                  <th className="text-right p-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {advertisers.map((a) => (
                  <tr key={a.id} className={"border-t border-border font-body text-sm" + (a.is_active ? "" : " opacity-50")}>
                    <td className="p-3">{a.name}</td>
                    <td className="p-3 text-xs">
                      {a.contact_name || "—"}
                      {a.contact_email && <span className="block text-muted-foreground" dir="ltr">{a.contact_email}</span>}
                    </td>
                    <td className="p-3 text-xs">{bookingCount(a.id)}</td>
                    <td className="p-3 text-xs">{a.is_active ? "ހިނގާ" : "ނިއްވާފައި"}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => editAdvertiser(a)} className="text-xs text-muted-foreground hover:text-foreground">އެޑިޓް</button>
                        <button onClick={() => toggleAdvertiser(a)} className="text-xs text-muted-foreground hover:text-foreground">
                          {a.is_active ? "ނިއްވާ" : "އަލުން ހިންގާ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Booking form */}
      <section className="mb-8">
        <h2 className="font-body text-sm font-semibold mb-3">
          {bEditing ? "ބުކިންގ އެޑިޓް" : "އާ ބުކިންގ"}
        </h2>
        <div className="rounded-xl border border-border bg-background p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>ސްލޮޓް</label>
            <select className={input} value={bForm.slot_key} onChange={(e) => setBForm({ ...bForm, slot_key: e.target.value })}>
              {AD_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>އިޝްތިހާރުދޭ ފަރާތް</label>
            <select className={input} value={bForm.advertiser_id} onChange={(e) => setBForm({ ...bForm, advertiser_id: e.target.value })}>
              <option value="">— ހޮވާ —</option>
              {activeAdvertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>ސްޓޭޓަސް</label>
            <select className={input} value={bForm.status} onChange={(e) => setBForm({ ...bForm, status: e.target.value })}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>ފެށޭ ތާރީޚް</label>
            <input type="date" className={input} value={bForm.starts_on} onChange={(e) => setBForm({ ...bForm, starts_on: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ނިމޭ ތާރީޚް</label>
            <input type="date" className={input} value={bForm.ends_on} onChange={(e) => setBForm({ ...bForm, ends_on: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ކްލިކް ލިންކް</label>
            <input className={input} dir="ltr" value={bForm.click_url} onChange={(e) => setBForm({ ...bForm, click_url: e.target.value })} />
          </div>
          <div>
            <label className={lbl}>ކްރިއޭޓިވް (ޑެސްކްޓޮޕް)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={input}
              disabled={uploading === "desktop"}
              onChange={(e) => e.target.files?.[0] && uploadCreative(e.target.files[0], "desktop")}
            />
            {bForm.creative_url && <img src={bForm.creative_url} className="mt-2 max-h-24 rounded-lg border border-border" alt="" />}
          </div>
          <div>
            <label className={lbl}>ކްރިއޭޓިވް (މޮބައިލް)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className={input}
              disabled={uploading === "mobile"}
              onChange={(e) => e.target.files?.[0] && uploadCreative(e.target.files[0], "mobile")}
            />
            {bForm.creative_url_mobile && <img src={bForm.creative_url_mobile} className="mt-2 max-h-24 rounded-lg border border-border" alt="" />}
          </div>
          <div>
            <label className={lbl}>ނޯޓް</label>
            <input className={input} value={bForm.notes} onChange={(e) => setBForm({ ...bForm, notes: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-3 flex gap-2">
            <button onClick={saveBooking} disabled={bSaving}
              className="h-9 px-4 rounded-lg bg-foreground text-background font-body text-xs font-semibold disabled:opacity-50">
              {bSaving ? "ސޭވްވަނީ..." : bEditing ? "އަޕްޑޭޓް" : "އިތުރުކުރޭ"}
            </button>
            {bEditing && (
              <button onClick={() => { setBEditing(null); setBForm(EMPTY_BOOKING); }}
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
                    <td className="p-3">{b.advertiser?.name ?? "—"}</td>
                    <td className="p-3 font-mono text-xs">{b.slot_key}</td>
                    <td className="p-3 text-xs" dir="ltr">{b.starts_on} → {b.ends_on}</td>
                    <td className="p-3 text-xs">{STATUS_LABELS[b.status] ?? b.status}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => editBooking(b)} className="text-xs text-muted-foreground hover:text-foreground">އެޑިޓް</button>
                        <button onClick={() => removeBooking(b.id)} className="text-xs text-destructive">ޑިލީޓް</button>
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
