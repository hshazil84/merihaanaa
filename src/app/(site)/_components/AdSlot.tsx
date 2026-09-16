import { getAdSlot, AD_MOBILE_MAX } from "@/lib/adSlots";

interface AdSlotProps {
  id: string;
  /** which breakpoint this instance renders at — the other one stays hidden */
  breakpoint: "desktop" | "mobile";
  label?: string;
}

export function AdSlot({ id, breakpoint, label = "އިޝްތިހާރު" }: AdSlotProps) {
  const def = getAdSlot(id);
  if (!def) return null;

  const size = breakpoint === "desktop" ? def.desktop : def.mobile;
  if (!size) return null;

  const cls = "adslot-" + id + "-" + breakpoint;

  const base = [
    "." + cls + "{",
    "width:" + size.width + ";",
    size.height ? "height:" + size.height + ";" : "",
    size.aspectRatio ? "aspect-ratio:" + size.aspectRatio + ";" : "",
    "border-radius:10px;",
    "border:1.5px dashed rgba(0,0,0,0.13);",
    "background:rgba(0,0,0,0.015);",
    "align-items:center;justify-content:center;",
    "margin-inline:auto;",
    "}",
  ].join("");

  const visibility =
    breakpoint === "desktop"
      ? "." + cls + "{display:flex;}@media(max-width:" + AD_MOBILE_MAX + "px){." + cls + "{display:none;}}"
      : "." + cls + "{display:none;}@media(max-width:" + AD_MOBILE_MAX + "px){." + cls + "{display:flex;}}";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: base + visibility }} />
      <div className={cls} data-ad-slot={id}>
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
      </div>
    </>
  );
}
