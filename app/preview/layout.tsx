// app/preview/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview | މެރިހާނާ",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="dv" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
