import "../globals.css";

export default function BioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="dv" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
