export type AdSlotSize = {
  width: string;
  height: string | null;
  aspectRatio?: string;
  fill?: boolean;
  label: string;
};

export type AdSlotDef = {
  id: string;
  page: string;
  placement: string;
  desktop: AdSlotSize | null;
  mobile: AdSlotSize | null;
};

export const AD_MOBILE_MAX = 1024;

export const AD_SLOTS: AdSlotDef[] = [
  {
    id: "film-hero-rail",
    page: "film",
    placement: "Beside the featured story and news row; on mobile, between the news row and reviews",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "dhathuru-hero-rail",
    page: "dhathuru",
    placement: "Beside the featured destination and grid; on mobile, below the filter tabs",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "raha-hero-rail",
    page: "raha",
    placement: "Beside the featured review and grid; on mobile, below the type tabs",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "meehun-hero-rail",
    page: "meehun",
    placement: "Replaces the most-read column, beside recent circles and the featured story; on mobile, below the recent circles scroll",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "music-hero-rail",
    page: "music",
    placement: "Replaces the trending-songs/events sidebar, beside the featured story and news row; on mobile, between the news row and archive link",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "thakethi-hero-rail",
    page: "thakethi",
    placement: "Beside the featured story and news row; on mobile, between the news row and archive link",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "art-hero-rail",
    page: "art",
    placement: "Beside the featured story and news row; on mobile, between the news row and archive link",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  {
    id: "vaahaka-hero-rail",
    page: "vaahaka",
    placement: "Placement pending — StoriesCategoryPage has four render states (overview, long, short, review) to wire this into",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
];

export function getAdSlot(id: string): AdSlotDef | undefined {
  return AD_SLOTS.find((s) => s.id === id);
}

export function getAdSlotsForPage(page: string): AdSlotDef[] {
  return AD_SLOTS.filter((s) => s.page === page);
}
