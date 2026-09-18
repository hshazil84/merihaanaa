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

  const base = [
    "." + cls + "{",
    "position:relative;",
    "width:" + size.width + ";",
    size.fill ? "height:100%;" : size.height ? "height:" + size.height + ";" : "",
    size.aspectRatio ? "aspect-ratio:" + size.aspectRatio + ";" : "",
    "border-radius:10px;",
    "overflow:hidden;",
    creative ? "" : "border:1.5px dashed rgba(0,0,0,0.13);background:rgba(0,0,0,0.015);",
    "align-items:center;justify-content:center;",
    "margin-inline:auto;",
    breakpoint === "desktop" && !size.fill && sticky ? "position:sticky;top:96px;align-self:start;" : "",
    "}",
    "." + cls + " img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}",
  ].join("");

  const visibility =
    breakpoint === "desktop"
      ? "." + cls + "{display:flex;}@media(max-width:" + AD_MOBILE_MAX + "px){." + cls + "{display:none;}}"
      : "." + cls + "{display:none;}@media(max-width:" + AD_MOBILE_MAX + "px){." + cls + "{display:flex;}}";

  const inner = creative ? (
    <img src={creative} alt={booking?.advertiser?.name ?? ""} loading="lazy" />
  ) : (
    <span
      style={{
        fontFamily: '"MVTypewriter","Noto Sans Thaana",sans-serif',
        fontSize: "11px",
        fontWeight: 700,
        color: "rgba(0,0,0,0.25)",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: base + visibility }} />
      <div className={cls} data-ad-slot={id}>
        {creative && booking?.click_url ? (
          <a
            href={booking.click_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{ position: "absolute", inset: 0, display: "block" }}
            aria-label={booking.advertiser?.name ?? ""}
          >
            {inner}
          </a>
        ) : (
          inner
        )}
      </div>
    </>
  );
}
