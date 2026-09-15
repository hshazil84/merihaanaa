import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  categorySlug: string;
  variant?: "default" | "parchment";
  // Extra query params to carry alongside `page` — e.g. { section: "long" }
  // for the Stories page's per-section pagination. Optional and additive;
  // omitting it preserves the exact href every other caller already uses.
  extraParams?: Record<string, string>;
}

export function Pagination({ page, totalPages, categorySlug, variant = "default", extraParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isParchment = variant === "parchment";

  const btnStyle = isParchment
    ? { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(100,80,30)", borderColor: "rgb(200,180,130)", backgroundColor: "rgb(230,218,180)" }
    : { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(100,98,92)", borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)" };

  const labelStyle = isParchment
    ? { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(140,115,65)", lineHeight: 2, padding: "8px 16px" }
    : { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2, padding: "8px 16px" };

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams({ page: String(targetPage), ...(extraParams ?? {}) });
    return `/${categorySlug}?${params.toString()}`;
  }

  return (
    <div className="flex justify-center gap-2 pb-16">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
          style={btnStyle}
        >
          ← ކުރީގެ
        </Link>
      )}
      <span style={labelStyle}>{page} / {totalPages}</span>
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
          style={btnStyle}
        >
          ފަހަތަށް →
        </Link>
      )}
    </div>
  );
}
