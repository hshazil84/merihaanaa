import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdBooking = {
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
};

/**
 * The live booking for a slot today, or null. "Live" means status is 'live'
 * and today falls inside the flight dates — a booking that is merely 'booked'
 * has not started running yet.
 */
export async function getLiveBooking(slotKey: string): Promise<AdBooking | null> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("ad_bookings")
    .select(
      "id, slot_key, advertiser_id, status, creative_url, creative_url_mobile, click_url, starts_on, ends_on, advertiser:advertisers!advertiser_id(name)"
    )
    .eq("slot_key", slotKey)
    .eq("status", "live")
    .lte("starts_on", today)
    .gte("ends_on", today)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as AdBooking) ?? null;
}
