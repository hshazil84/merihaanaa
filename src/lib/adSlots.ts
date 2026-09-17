export type AdSlotSize = {
  /** CSS width — px for fixed slots, "100%" for fluid */
  width: string;
  /** CSS height — px, or null when aspectRatio drives it. This is the creative
   *  size you sell, and what the inventory table shows, even when `fill` is set. */
  height: string | null;
  /** used when height is null */
  aspectRatio?: string;
  /** when true the slot fills its grid/flex track instead of using `height` */
  fill?: boolean;
  /** label for the rate card / inventory sheet */
  label: string;
};

export type AdSlotDef = {
  id: string;
  /** which page this slot belongs to — slots are not shared across pages */
  page: string;
  /** where on the page, in plain words */
  placement: string;
  /** null means the slot does not render at this breakpoint */
  desktop: AdSlotSize | null;
  mobile: AdSlotSize | null;
};

/** Breakpoint boundary, shared by every slot's show/hide CSS. */
export const AD_MOBILE_MAX = 1024;

export const AD_SLOTS: AdSlotDef[] = [
  {
    id: "film-hero-rail",
    page: "film",
    placement: "Beside the featured story and news row; on mobile, between the news row and reviews",
    desktop: { width: "300px", height: "600px", fill: true, label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
  
  {
    id: "dhathuru-hero-rail",
    page: "dhathuru",
    placement: "Beside the featured destination and grid; on mobile, below the filter tabs",
    desktop: { width: "300px", height: "600px", fill: true, label: "300×600 half page" },
    mobile: { width: "100%", height: null, aspectRatio: "4/3", label: "300×250 medium rectangle" },
  },
];

export function getAdSlot(id: string): AdSlotDef | undefined {
  return AD_SLOTS.find((s) => s.id === id);
}

export function getAdSlotsForPage(page: string): AdSlotDef[] {
  return AD_SLOTS.filter((s) => s.page === page);
}
