interface AdSlotProps {
  label?: string;
  variant?: "banner" | "rail";
  className?: string;
  style?: React.CSSProperties;
}

// Placeholder ad container. Swap the inner content for your ad network's
// embed code once that's wired up — the sizing/chrome stays the same.
export function AdSlot({ label = "އިޝްތިހާރު", variant = "banner", className, style }: AdSlotProps) {
  const isBanner = variant === "banner";
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: isBanner ? "90px" : "100%",
        minHeight: isBanner ? "90px" : "200px",
        borderRadius: "10px",
        border: "1.5px dashed rgba(0,0,0,0.13)",
        background: "rgba(0,0,0,0.015)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
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
  );
}
