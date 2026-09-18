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
    placement: "Full-width banner beneath the header, above all sections — Vaahaka's centered single-column layout has no side rail, so this uses a standard banner shape instead",
    desktop: { width: "100%", height: null, aspectRatio: "728/90", label: "728×90 leaderboard" },
    mobile: { width: "100%", height: null, aspectRatio: "320/100", label: "320×100 large mobile banner" },
  },
  {
    id: "article-top-banner",
    page: "article",
    placement: "Article reading page — after the byline, before the body starts",
    desktop: { width: "100%", height: null, aspectRatio: "728/90", label: "728×90 leaderboard" },
    mobile: { width: "100%", height: null, aspectRatio: "320/100", label: "320×100 large mobile banner" },
  },
  {
    id: "article-bottom-banner",
    page: "article",
    placement: "Article reading page — after the body and chapter pagination, before tags",
    desktop: { width: "100%", height: null, aspectRatio: "728/90", label: "728×90 leaderboard" },
    mobile: { width: "100%", height: null, aspectRatio: "320/100", label: "320×100 large mobile banner" },
  },
  {
    id: "article-series-rail",
    page: "article",
    placement: "Series chapter pages only — sidebar beside the chapter navigation, inside its existing sticky block",
    desktop: { width: "300px", height: "600px", label: "300×600 half page" },
    mobile: null,
  },
  {
    id: "homepage-banner",
    page: "home",
    placement: "Two instances used down the scroll: right above TodaysPicks, and after OriginalsStrip before the Latest grid",
    desktop: { width: "100%", height: null, aspectRatio: "760/180", label: "760×180 banner" },
    mobile: { width: "100%", height: null, aspectRatio: "760/180", label: "760×180 banner (scaled)" },
  },
];

export function getAdSlot(id: string): AdSlotDef | undefined {
  return AD_SLOTS.find((s) => s.id === id);
}

export function getAdSlotsForPage(page: string): AdSlotDef[] {
  return AD_SLOTS.filter((s) => s.page === page);
}
