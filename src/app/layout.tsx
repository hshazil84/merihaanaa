import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "މެރިހާނާ",
    template: "%s — މެރިހާނާ",
  },
  description: "ދިވެހި ކަލްޗަރ، ފިލްމް، މިއުޒިކް، ލައިފްސްޓައިލް",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://merihaanaa.com"
  ),
  openGraph: {
    siteName: "މެރިހާނާ",
    locale: "dv",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@merihaanaa",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="dv" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Noto Sans Thaana — fallback font, preloaded */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thaana:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Dark mode script — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('merihaanaa-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-white dark:bg-black text-black dark:text-neutral-50 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
