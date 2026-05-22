import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FilePlus,
  LayoutTemplate,
  Video,
  MessageSquare,
  Users,
  TrendingUp,
  Eye,
  PenLine,
} from "lucide-react";
import type { DashboardStats } from "@/types";

async function getStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();
  const [
    { count: total_articles },
    { count: published_articles },
    { count: draft_articles },
    { count: total_subscribers },
    { count: pending_comments },
    { count: total_videos },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("subscribers").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("videos").select("*", { count: "exact", head: true }),
  ]);
  return {
    total_articles: total_articles || 0,
    published_articles: published_articles || 0,
    draft_articles: draft_articles || 0,
    total_subscribers: total_subscribers || 0,
    pending_comments: pending_comments || 0,
    total_videos: total_videos || 0,
  };
}

async function getRecentArticles() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, status, published_at, homepage_placement, featured_image")
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

const PLACEMENT_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  hero:           { label: "ހީރޯ",    variant: "default" },
  editors_choice: { label: "އެޑިޓަރ", variant: "default" },
  review:         { label: "ރިވިއު",  variant: "secondary" },
  reel:           { label: "ރީލް",    variant: "outline" },
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  published: { label: "ލައިވް",    variant: "default" },
  draft:     { label: "ޑްރާފްޓް", variant: "secondary" },
  scheduled: { label: "ތިލަ",      variant: "outline" },
};

export default async function AdminDashboard() {
  const [stats, recentArticles] = await Promise.all([
    getStats(),
    getRecentArticles(),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">ޑޭޝްބޯޑް</h1>
          <p className="font-body text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric",
            })}
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button className="font-body gap-2">
            <FilePlus size={14} />
            އާ ލިޔުން
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-muted-foreground">
              ޖުމްލަ ލިޔުން
            </CardTitle>
            <FileText size={15} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-body text-3xl font-bold">{stats.total_articles}</div>
            <p className="font-body text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp size={11} />
              {stats.published_articles} ލައިވް
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-muted-foreground">
              ޑްރާފްޓް
            </CardTitle>
            <PenLine size={15} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-body text-3xl font-bold">{stats.draft_articles}</div>
            <p className="font-body text-xs text-muted-foreground mt-1">ތައްޔާރުވަނީ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-muted-foreground">
              ސަބްސްކްރައިބަރ
            </CardTitle>
            <Users size={15} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-body text-3xl font-bold">{stats.total_subscribers}</div>
            <p className="font-body text-xs text-muted-foreground mt-1">ނިއުސްލެޓަރ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-muted-foreground">
              ވީޑިއޯ
            </CardTitle>
            <Video size={15} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-body text-3xl font-bold">{stats.total_videos}</div>
            <p className="font-body text-xs text-muted-foreground mt-1">ކްލައުޑްފްލެއަރ</p>
          </CardContent>
        </Card>

        <Card className={stats.pending_comments > 0 ? "border-amber-300 dark:border-amber-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-muted-foreground">
              ކޮމެންޓް
            </CardTitle>
            <MessageSquare size={15} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-body text-3xl font-bold">{stats.pending_comments}</div>
            <p className={`font-body text-xs mt-1 ${stats.pending_comments > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
              ތިލަ ބެލުން ބޭނުން
            </p>
          </CardContent>
        </Card>

        <Link href="/admin/homepage">
          <Card className="cursor-pointer hover:border-foreground transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-body text-sm font-medium text-muted-foreground">
                ހޯމްޕޭޖް
              </CardTitle>
              <LayoutTemplate size={15} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-body text-lg font-bold">ލޭއައުޓް</div>
              <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Eye size={11} />
                ބަދަލުކޮށްލާ
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/admin/articles/new", label: "ލިޔުން ލިޔާ",  icon: FilePlus },
          { href: "/admin/homepage",     label: "ހޯމްޕޭޖް",     icon: LayoutTemplate },
          { href: "/admin/videos",       label: "ވީޑިއޯ",        icon: Video },
          { href: "/admin/comments",     label: "ކޮމެންޓް",      icon: MessageSquare },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href}>
              <Card className="cursor-pointer hover:border-foreground transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="font-body text-sm font-semibold">{a.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="font-body text-base font-semibold">
            ފަހުގެ ލިޔުންތައް
          </CardTitle>
          <Link href="/admin/articles">
            <Button variant="ghost" size="sm" className="font-body text-xs">
              ހުރިހާ ←
            </Button>
          </Link>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body text-xs">ލިޔުން</TableHead>
              <TableHead className="font-body text-xs">ހޯމްޕޭޖް ތަން</TableHead>
              <TableHead className="font-body text-xs">ހާލަތު</TableHead>
              <TableHead className="font-body text-xs text-left">ޢަމަލު</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 font-body text-sm text-muted-foreground">
                  ލިޔުމެއް ނެތް — + އާ ލިޔުން ފަށާ
                </TableCell>
              </TableRow>
            ) : (
              recentArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {article.featured_image ? (
                        <img src={article.featured_image} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-9 bg-muted rounded flex-shrink-0" />
                      )}
                      <span className="font-body text-sm font-medium line-clamp-1">
                        {article.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.homepage_placement ? (
                      <Badge variant={PLACEMENT_MAP[article.homepage_placement]?.variant || "outline"} className="font-body text-xs">
                        {PLACEMENT_MAP[article.homepage_placement]?.label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_MAP[article.status]?.variant || "outline"} className="font-body text-xs">
                      {STATUS_MAP[article.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <Link href={`/admin/articles/${article.id}`}>
                      <Button variant="outline" size="sm" className="font-body text-xs h-7 gap-1.5">
                        <PenLine size={11} />
                        އެޑިޓް
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
