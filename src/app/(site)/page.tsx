import { createServerSupabaseClient } from "@/lib/supabase/server";
import HeroSection from "@/components/public/HeroSection";
import TodaysPicks from "@/components/public/TodaysPicks";
import FeatureSplit from "@/components/public/FeatureSplit";
import ReelsStrip from "@/components/public/ReelsStrip";
import ReviewsSection from "@/components/public/ReviewsSection";
import OriginalsStrip from "@/components/public/OriginalsStrip";
import NewsletterCTA from "@/components/public/NewsletterCTA";
import Link from "next/link";

async function isAdminUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    return profile && ["admin", "editor", "author"].includes(profile.role);
  } catch {
    return false;
  }
}

async function getHomeData() {
  const supabase = await createServerSupabaseClient();
  const [
    { data: hero },
    { data: todaysPicks },
    { data: people },
    { data: reviews },
    { data: reels },
    { data: originals },
    { data: latest },
  ] = await Promise.all([
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, cover_type, cover_video_thumbnail, category:categories!category_id(name, slug), author:authors!author_id(full_name)").eq("status", "published").eq("homepage_placement", "hero").order("published_at", { ascending: false }).limit(1).single(),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_placement", "editors_choice").order("homepage_slot", { ascending: true, nullsFirst: false }).limit(4),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, category:categories!category_id(name, slug), author:authors!author_id(full_name)").eq("status", "published").eq("homepage_placement", "people").order("published_at", { ascending: false }).limit(1),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, reading_time_minutes, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_placement", "review").order("homepage_slot", { ascending: true, nullsFirst: false }).limit(3),
    supabase.from("reels").select("id, title, slug, stream_video_id, thumbnail_url, duration_seconds, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_featured", true).order("published_at", { ascending: false }).limit(4),
    supabase.from("originals").select("id, title, slug, thumbnail_url, duration_seconds, type").eq("status", "published").order("published_at", { ascending: false }).limit(8),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, reading_time_minutes, category:categories!category_id(name, slug)").eq("status", "published").is("homepage_placement", null).order("published_at", { ascending: false }).limit(8),
  ]);
  return {
    hero,
    todaysPicks: (todaysPicks ?? []) as any[],
    people: (people ?? []) as any[],
    reviews: (reviews ?? []) as any[],
    reels: (reels ?? []) as any[],
    originals: (originals ?? []) as any[],
    latest: (latest ?? []) as any[],
  };
}

function ComingSoon() {
  return (
    <div style={{
      width: "100%",
      minHeight: "100svh",
      background: "#F0EAD6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <img
        src="/logo.svg"
        alt="މެރިހާނާ"
        style={{ width: "120px", height: "120px", objectFit: "contain" }}
      />
    </div>
  );
}

export default async function HomePage() {
  const isAdmin = await isAdminUser();
  if (!isAdmin) return <ComingSoon />;

  const { hero, todaysPicks, people, reviews, reels, originals, latest } = await getHomeData();

  return (
    <div className="bg-[#F5F3EF]" dir="rtl">
      {hero ? (
        <HeroSection article={hero as any} />
      ) : (
        <div className="h-screen flex items-center justify-center">
          <p style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "13px", color: "rgb(140,138,132)" }}>
            ލިޔުންތައް ލޯޑްވަނީ...
          </p>
        </div>
      )}
      {todaysPicks.length > 0 && <TodaysPicks articles={todaysPicks} />}
      {people.length > 0 && <FeatureSplit article={people[0]} />}
      {reviews.length > 0 && <ReviewsSection articles={reviews} />}
      {reels.length > 0 && <ReelsStrip reels={reels} />}
      {originals.length > 0 && <OriginalsStrip originals={originals} />}
      {/* <PodcastSection /> */}
      {latest.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12" dir="rtl">
          <h2 className="text-center mb-10" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 400, fontSize: "26px", color: "rgb(26, 26, 26)", lineHeight: 2 }}>
            އެންމެ ފަހުގެ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {latest.map((article: any) => (
              <Link key={article.id} href={`/${article.category?.slug ?? "article"}/${article.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#e8e5de] mb-3">
                  {article.featured_image ? (
                    <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-[#dedad2]" />
                  )}
                </div>
                {article.category && (
                  <div className="mb-1.5">
                    <span className="inline-block text-[10px] px-2.5 py-1 rounded-full border" style={{ fontFamily: "'MVTypewriter', sans-serif", color: "rgb(100, 100, 100)", borderColor: "rgb(210, 207, 200)", backgroundColor: "rgb(240, 239, 233)", lineHeight: 2 }}>
                      {article.category.name}
                    </span>
                  </div>
                )}
                <h3 className="line-clamp-3 group-hover:opacity-70 transition-opacity" style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontWeight: 700, fontSize: "14px", color: "rgb(26, 26, 26)", lineHeight: 2 }}>
                  {article.title}
                </h3>
                {article.reading_time_minutes && (
                  <p className="mt-1.5" style={{ fontFamily: '"MVTypewriter", sans-serif', fontSize: "10px", color: "rgb(160, 158, 152)", lineHeight: 2 }}>
                    {article.reading_time_minutes} މިނެޓު
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
      <NewsletterCTA />
    </div>
  );
}
