import { getAdSlot, AD_MOBILE_MAX } from "@/lib/adSlots";
import { getLiveBooking } from "@/lib/ads";

interface AdSlotProps {
  id: string;
  breakpoint: "desktop" | "mobile";
  label?: string;
  /** Set false when this slot already sits inside a sticky parent (e.g. the
   *  article series sidebar, which sticks its whole nav+ad block together
   *  as one unit) — nesting two independent sticky elements makes the ad
   *  drift apart from what it's meant to travel with. Defaults to true. */
  sticky?: boolean;
}

// 1x1 transparent GIF — the <img> fallback inside <picture> needs *some*
// src, but this one costs effectively nothing to fetch. The real creative
// only ever loads via the matching <source>.
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";

export async function AdSlot({ id, breakpoint, label = "އިޝްތިހާރު", sticky = true }: AdSlotProps) {
  const def = getAdSlot(id);
  if (!def) return null;

  const size = breakpoint === "desktop" ? def.desktop : def.mobile;
  if (!size) return null;

  const booking = await getLiveBooking(id);
  const creative = breakpoint === "desktop"
    ? booking?.creative_url
    : (booking?.creative_url_mobile ?? booking?.creative_url);

  const cls = "adslot-" + id + "-" + breakpoint;
  const wrapCls = cls + "-wrap";

  // The media query that decides whether THIS breakpoint's instance is the
  // one actually shown on screen. Used both for the wrapper's CSS
  // visibility (unchanged) and, via <picture><source media>, to stop the
  // browser from ever downloading this instance's creative when it isn't
  // the visible one — display:none + loading="lazy" alone wasn't reliable
  // enough to prevent the fetch, so both the desktop and mobile creative
  // were downloading on every page load regardless of viewport.
  const visibleQuery = breakpoint === "desktop"
    ? "(min-width:" + (AD_MOBILE_MAX + 1) + "px)"
    : "(max-width:" + AD_MOBILE_MAX + "px)";

  const base = [
    "." + wrapCls + "{",
    "display:flex;flex-direction:column;align-items:center;gap:6px;",
    "margin-inline:auto;",
    breakpoint === "desktop" && !size.fill && sticky ? "position:sticky;top:96px;align-self:start;" : "",
    "}",
    "." + cls + "{",
    "position:relative;",
    "width:" + size.width + ";",
    size.fill ? "height:100%;" : size.height ? "height:" + size.height + ";" : "",
    size.aspectRatio ? "aspect-ratio:" + size.aspectRatio + ";" : "",
    "border-radius:10px;",
    "overflow:hidden;",
    creative ? "" : "border:1.5px dashed rgba(0,0,0,0.13);background:rgba(0,0,0,0.015);",
    "}",
    "." + cls + " img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}",
  ].join("");

  const visibility =
    breakpoint === "desktop"
      ? "." + wrapCls + "{display:flex;}@media(max-width:" + AD_MOBILE_MAX + "px){." + wrapCls + "{display:none;}}"
      : "." + wrapCls + "{display:none;}@media(max-width:" + AD_MOBILE_MAX + "px){." + wrapCls + "{display:flex;}}";

  const creativeImg = creative ? (
    <picture>
      <source media={visibleQuery} srcSet={creative} />
      <img src={BLANK_PIXEL} alt={booking?.advertiser?.name ?? ""} loading="lazy" />
    </picture>
  ) : null;

  const caption = (
    <span
      style={{
        fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif',
        fontSize: "11px",
        fontWeight: 700,
        color: "rgba(0,0,0,0.28)",
        letterSpacing: "0.05em",
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      {label}
    </span>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: base + visibility }} />
      <div className={wrapCls}>
        <div className={cls} data-ad-slot={id}>
          {creative ? (
            booking?.click_url ? (
              
                href={booking.click_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={{ position: "absolute", inset: 0, display: "block" }}
                aria-label={booking.advertiser?.name ?? ""}
              >
                {creativeImg}
              </a>
            ) : (
              creativeImg
            )
          ) : null}
        </div>
        {caption}
      </div>
    </>
  );
}
