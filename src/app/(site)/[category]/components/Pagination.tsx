import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  categorySlug: string;
  variant?: "default" | "parchment";
}

export function Pagination({ page, totalPages, categorySlug, variant = "default" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const isParchment = variant === "parchment";

  const btnStyle = isParchment
    ? { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(100,80,30)", borderColor: "rgb(200,180,130)", backgroundColor: "rgb(230,218,180)" }
    : { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(100,98,92)", borderColor: "rgb(210,207,200)", backgroundColor: "rgb(240,239,233)" };

  const labelStyle = isParchment
    ? { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(140,115,65)", lineHeight: 2, padding: "8px 16px" }
    : { fontFamily: '"MVTypewriter", sans-serif', fontSize: "12px", color: "rgb(160,158,152)", lineHeight: 2, padding: "8px 16px" };

  return (
    <div className="flex justify-center gap-2 pb-16">
      {page > 1 && (
        <Link
          href={`/${categorySlug}?page=${page - 1}`}
          className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
          style={btnStyle}
        >
          ← ކުރީގެ
        </Link>
      )}
      <span style={labelStyle}>{page} / {totalPages}</span>
      {page < totalPages && (
        <Link
          href={`/${categorySlug}?page=${page + 1}`}
          className="px-5 py-2 rounded-full border transition-colors hover:border-black/30"
          style={btnStyle}
        >
          ފަހަތަށް →
        </Link>
      )}
    </div>
  );
}
