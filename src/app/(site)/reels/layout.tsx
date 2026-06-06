export default function ReelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "black" }}>
      {children}
    </div>
  );
}
