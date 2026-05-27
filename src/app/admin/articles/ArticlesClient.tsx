"use client";
// app/admin/articles/ArticlesClient.tsx

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, PlusCircle, Pencil, Trash2, Eye,
  ChevronRight, ChevronLeft, ArrowUpDown,
} from "lucide-react";

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  content_type: string;
  category_id: string | null;
  published_at: string | null;
  created_at: string;
  view_count: number | null;
  author: Author | null;
  category: Category | null;
}

interface Props {
  articles: Article[];
  totalCount: number;
  page: number;
  pageSize: number;
  currentStatus: string;
  currentQ: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  published: { label: "ލައިވް",   variant: "default" },
  draft:     { label: "ޑްރާފްޓް", variant: "secondary" },
  scheduled: { label: "ޝެޑިއުލް", variant: "outline" },
  archived:  { label: "އާރކައިވް", variant: "outline" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "ހުރިހާ" },
  { value: "published", label: "ލައިވް" },
  { value: "draft",     label: "ޑްރާފްޓް" },
  { value: "scheduled", label: "ޝެޑިއުލް" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(iso));
}

function formatViews(n: number | null): string {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ArticlesClient({
  articles, totalCount, page, pageSize, currentStatus, currentQ,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentQ);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const navigate = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams();
    const merged = { page: String(page), status: currentStatus, q: currentQ, ...params };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "") sp.set(k, v);
      if (k === "page" && v !== "1") sp.set(k, v);
    });
    startTransition(() => { router.push(`${pathname}?${sp.toString()}`); });
  }, [page, currentStatus, currentQ, pathname, router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", deleteTarget.id);
      if (!error) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        console.error("Delete error:", error.message);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div dir="rtl" className="mx-auto max-w-7xl px-4 py-8 font-body">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ލިޔުންތައް</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ޖުމްލަ <span className="tabular-nums font-medium text-foreground">{totalCount}</span> ލިޔުން
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/articles/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              އާ ލިޔުން
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ q: searchValue, page: "1" }); }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="ލިޔުން ހޯދާ…"
                className="w-60 pr-9 text-right"
                dir="rtl"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">ހޯދާ</Button>
            {currentQ && (
              <Button type="button" variant="ghost" size="sm"
                onClick={() => { setSearchValue(""); navigate({ q: "", page: "1" }); }}>
                ސީދާ ކުރޭ
              </Button>
            )}
          </form>

          <Select value={currentStatus} onValueChange={(v) => navigate({ status: v, page: "1" })}>
            <SelectTrigger className="w-40 text-right" dir="rtl">
              <SelectValue placeholder="ހާލަތު" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-right">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    ސުރުހީ <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground w-28">ސްޓޭޓަސް</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground w-32">ކެޓަގަރީ</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground w-28">
                  <div className="flex items-center justify-end gap-1">
                    <Eye className="h-3 w-3" /> ވިއު
                  </div>
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground w-36">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    ތާރީހު <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground w-32">ލިޔުންތެރިޔާ</TableHead>
                <TableHead className="w-24 text-xs font-semibold text-muted-foreground text-center">އެކްޝަން</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isPending ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 ml-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                    {currentQ ? `"${currentQ}" ގެ ލިޔުންތަކެއް ނެތް` : "ލިޔުންތަކެއް ނެތް"}
                  </TableCell>
                </TableRow>
              ) : articles.map((article) => {
                const statusCfg = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;
                const displayDate = article.status === "published"
                  ? formatDate(article.published_at)
                  : formatDate(article.created_at);

                return (
                  <TableRow key={article.id} className="hover:bg-muted/20 transition-colors">

                    <TableCell className="py-4">
                      <Link href={`/admin/articles/${article.id}`} className="block hover:underline underline-offset-2">
                        <p className="text-sm font-semibold text-foreground leading-snug text-right line-clamp-2">
                          {article.title}
                        </p>
                        {article.content_type && (
                          <p className="mt-0.5 text-xs text-muted-foreground text-right">
                            {article.content_type}
                          </p>
                        )}
                      </Link>
                    </TableCell>

                    <TableCell className="text-right">
                      <Badge variant={statusCfg.variant} className="text-xs">{statusCfg.label}</Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {article.category?.name ?? "—"}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 flex-shrink-0" />
                        <span className="tabular-nums">{formatViews(article.view_count)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="text-xs tabular-nums text-muted-foreground">{displayDate}</span>
                    </TableCell>

                    <TableCell className="text-right">
                      {article.author?.full_name ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{article.author.full_name}</span>
                          {article.author.avatar_url && (
                            <img src={article.author.avatar_url} alt=""
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-border" />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/admin/articles/${article.id}`}>
                          <button type="button" title="އެޑިޓް"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>

                        {article.status === "published" ? (
                          <Link href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                            <button type="button" title="ބަލާ"
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        ) : (
                          <button type="button" disabled title="ޕަބްލިޝްކޮށްގެން ބެލޭނެ"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/30 cursor-not-allowed">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button type="button" title="ފޮހެލާ"
                          onClick={() => setDeleteTarget(article)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground" dir="rtl">
            <span>ސަފްހާ {page} / {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={page <= 1 || isPending}
                onClick={() => navigate({ page: String(page - 1) })}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === "…"
                  ? <span key={`e-${i}`} className="px-1">…</span>
                  : <Button key={p} variant={p === page ? "default" : "outline"} size="icon"
                      className="h-8 w-8 tabular-nums" disabled={isPending}
                      onClick={() => navigate({ page: String(p) })}>{p}</Button>
                )}
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={page >= totalPages || isPending}
                onClick={() => navigate({ page: String(page + 1) })}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal — outside all containers so fixed positioning works */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-background rounded-2xl p-6 max-w-md w-full shadow-xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-body text-base font-semibold text-foreground mb-2">
              ލިޔުން ފޮހެލަންތޯ؟
            </h2>
            <p className="font-body text-sm text-muted-foreground mb-6 leading-relaxed">
              <span className="font-semibold text-foreground">{deleteTarget.title}</span>
              {" "}— މި ލިޔުން ދާއިމީ ގޮތެއްގައި ފޮހެވޭނެ.
            </p>
            <div className="flex gap-2 justify-start">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-destructive text-white font-body text-sm font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity"
              >
                {isDeleting ? "ފޮހެލަނީ…" : "ފޮހެލާ"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border font-body text-sm text-foreground hover:bg-muted transition-colors"
              >
                ނޫން
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
