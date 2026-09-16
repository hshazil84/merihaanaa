interface AdSlotProps {
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Placeholder ad container. Swap the inner content for your actual ad
// network's embed code / script tag once that's wired up (AdSense, Google
// Ad Manager, a direct sponsor creative, etc.) — this just reserves the
// space and gives it a consistent look in the meantime.
export function AdSlot({ label = "އިޝްތިހާރު", className, style }: AdSlotProps) {
  return (
    <div
      className={className}
      style={{
        height: "100%",
        minHeight: "200px",
        borderRadius: "10px",
        border: "1.5px dashed rgba(0,0,0,0.15)",
        background: "rgba(0,0,0,0.02)",
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
          color: "rgba(0,0,0,0.3)",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
