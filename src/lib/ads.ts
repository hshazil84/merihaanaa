import { createServerSupabaseClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { MAX_LIVE_PER_SLOT } from "@/lib/adSlots";

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
 * A randomly-picked live booking for a slot today, or null. "Live" means
 * status is 'live' and today falls inside the flight dates — a booking that
 * is merely 'booked' has not started running yet.
 *
 * Up to MAX_LIVE_PER_SLOT advertisers can be live on the same slot at once
 * (enforced when a booking is saved as 'live' in the admin panel). When more
 * than one is live, a different one is picked at random on each call, so
 * refreshing the page rotates the ad.
 *
 * noStore() opts this one fetch out of Next's Data/Full Route Cache, so the
 * rotation is real on every request — including on pages that are otherwise
 * statically rendered or ISR'd. Only this fetch is forced fresh; the rest of
 * such a page can still be cached normally.
 */
export async function getLiveBooking(slotKey: string): Promise<AdBooking | null> {
  noStore();
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
    .limit(MAX_LIVE_PER_SLOT);

  const rows = (data as unknown as AdBooking[]) ?? [];
  if (rows.length === 0) return null;

  return rows[Math.floor(Math.random() * rows.length)];
}
