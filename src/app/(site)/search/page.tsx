// app/(site)/search/page.tsx

import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PageProps {
  searchParams: { q?: string };
}

export const metadata = {
  title: "ހޯދާ",
};

async function searchArticles(q: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image, reading_time_minutes, published_at, category:categories!category_id(name, slug)")
    .eq("status", "published")
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
    .order("published_at", { ascending: false })
    .limit(24);
  return data ?? [];
}

const DHIVEHI_MONTHS: Record<number, string> = {
  1: "ޖެނުއަރީ", 2: "ފެބްރުއަރީ", 3: "މާރިޗު", 4: "އޭޕްރީލް",
  5: "މެއި", 6: "ޖޫން", 7: "ޖުލައި", 8: "އޮގަސްޓް",
  9: "ސެޕްޓެމްބަރު", 10: "އޮކްޓޯބަރު", 11: "ނޮވެމްބަރު", 12: "ޑިސެމްބަރު",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${DHIVEHI_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim() ?? "";
  const results = q.length > 1 ? await searchArticles(q) : [];

  return (
    <div className="bg-[#F5F3EF] min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-20">

        {/* Search input */}
        <div className="mb-12">
          <form method="get" action="/search">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="ހޯދާ..."
              dir="rtl"
              autoFocus
              className="w-full bg-transparent border-b-2 border-black/20 focus:border-black outline-none text-3xl pb-3 transition-colors placeholder:text-black/20"
              style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif' }}
            />
          </form>
        </div>

        {/* Results count */}
        {q.length > 1 && (
          <p className="mb-8 text-center" style={{
            fontFamily: '"MVTypewriter", sans-serif',
            fontSize: "12px",
            color: "rgb(160,158,152)",
            lineHeight: 2,
          }}>
            {results.length > 0
              ? `"${q}" — ${results.length} ލިޔުން ލިބިއްޖެ`
              : `"${q}" — ލިޔުންތަކެއް ނެތް`
            }
          </p>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {results.map((article: any) => (
              <Link
                key={article.id}
                href={`/${article.category?.slug ?? "article"}/${article.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
                {article.category && (
                  <div className="mb-1.5">
                    <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border" style={{
                      fontFamily: "'MVTypewriter', sans-serif",
                      color: "rgb(100,100,100)",
                      borderColor: "rgb(210,207,200)",
                      backgroundColor: "rgb(240,239,233)",
                      lineHeight: 2,
                    }}>
                      {article.category.name}
                    </span>
                  </div>
                )}
                <h3 className="line-clamp-3 group-hover:opacity-70 transition-opacity" style={{
                  fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "rgb(26,26,26)",
                  lineHeight: 2,
                }}>
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {article.published_at && (
                    <span style={{
                      fontFamily: '"MVTypewriter", sans-serif',
                      fontSize: "10px",
                      color: "rgb(160,158,152)",
                      lineHeight: 2,
                    }}>
                      {formatDate(article.published_at)}
                    </span>
                  )}
                  {article.reading_time_minutes && (
                    <span style={{
                      fontFamily: '"MVTypewriter", sans-serif',
                      fontSize: "10px",
                      color: "rgb(160,158,152)",
                      lineHeight: 2,
                    }}>
                      · {article.reading_time_minutes} މިނެޓު
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {q.length <= 1 && (
          <p className="text-center mt-20" style={{
            fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif',
            fontSize: "14px",
            color: "rgb(160,158,152)",
            lineHeight: 2,
          }}>
            ހޯދަން ބޭނުންވާ ބަސް ލިޔެލާ
          </p>
        )}

      </div>
    </div>
  );
}
