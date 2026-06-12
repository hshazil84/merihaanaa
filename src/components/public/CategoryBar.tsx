// components/public/CategoryBar.tsx
// Static in-flow category bar — sits right after the hero on the homepage.
// No JS, no fixed positioning: scrolls as one piece with the page (New Yorker pattern).
import Link from "next/link";

interface Category { id: string; name: string; slug: string; }

export default function CategoryBar({ categories }: { categories: Category[] }) {
  return (
    <nav
      aria-label="ކެޓަގަރީތައް"
      style={{
        backgroundColor: "rgb(249,248,245)",
        borderBottom: "1px solid rgb(224,221,214)",
        height: "56px",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div
          className="flex items-center justify-start md:justify-center gap-1 h-full overflow-x-auto no-scrollbar"
          dir="rtl"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={"/" + cat.slug}
              target={cat.slug === "originals" ? "_blank" : undefined}
              rel={cat.slug === "originals" ? "noopener noreferrer" : undefined}
              className="whitespace-nowrap px-4 py-2 transition-colors hover:text-[rgb(26,26,26)]"
              style={{
                fontFamily: "'MVTypewriter','MV Boli',sans-serif",
                fontSize: "13px",
                color: "rgb(153,153,153)",
              }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
