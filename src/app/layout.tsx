import type { Metadata } from "next";
import "../styles/globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://merihaanaa.com";

export const metadata: Metadata = {
  title: {
    default: "މެރިހާނާ - ތިޔަ ހޯއްދަވާ ތަފާތު މެގަޒިން",
    template: "%s — މެރިހާނާ",
  },
  description: "ދިވެހި ކަލްޗަރ، ފިލްމް، މިއުޒިކް، ލައިފްސްޓައިލް",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  openGraph: {
    siteName: "މެރިހާނާ",
    locale: "dv",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "މެރިހާނާ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="dv" dir="rtl">
      <head>
        {/* Preload critical public-facing fonts */}
        <link rel="preload" href="/fonts/MVTypewriter.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/MVTypewriter-Bold.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Sangu Suruhee 2.0.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/noto-sans-thaana-v26-latin-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/noto-sans-thaana-v26-latin-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
