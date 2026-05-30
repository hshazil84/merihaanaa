import { createServerSupabaseClient } from "@/lib/supabase/server";
import HeroSection from "@/components/public/HeroSection";
import TodaysPicks from "@/components/public/TodaysPicks";
import FeatureSplit from "@/components/public/FeatureSplit";
import ReelsStrip from "@/components/public/ReelsStrip";
import ReviewsSection from "@/components/public/ReviewsSection";
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
    { data: latest },
  ] = await Promise.all([
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, cover_type, cover_video_thumbnail, category:categories!category_id(name, slug), author:authors!author_id(full_name)").eq("status", "published").eq("homepage_placement", "hero").order("published_at", { ascending: false }).limit(1).single(),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_placement", "editors_choice").order("published_at", { ascending: false }).limit(4),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, category:categories!category_id(name, slug), author:authors!author_id(full_name)").eq("status", "published").eq("homepage_placement", "people").order("published_at", { ascending: false }).limit(1),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, reading_time_minutes, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_placement", "review").order("published_at", { ascending: false }).limit(3),
    supabase.from("reels").select("id, title, slug, stream_video_id, thumbnail_url, duration_seconds, category:categories!category_id(name, slug)").eq("status", "published").eq("homepage_featured", true).order("published_at", { ascending: false }).limit(4),
    supabase.from("articles").select("id, title, slug, excerpt, featured_image, reading_time_minutes, category:categories!category_id(name, slug)").eq("status", "published").is("homepage_placement", null).order("published_at", { ascending: false }).limit(8),
  ]);
  return {
    hero,
    todaysPicks: (todaysPicks ?? []) as any[],
    people: (people ?? []) as any[],
    reviews: (reviews ?? []) as any[],
    reels: (reels ?? []) as any[],
    latest: (latest ?? []) as any[],
  };
}

function ComingSoon() {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100svh", background: "#020b14", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes aurora1 { 0%,100%{transform:translateX(0) translateY(0) scaleX(1);opacity:0.5} 33%{transform:translateX(-80px) translateY(30px) scaleX(1.2);opacity:0.8} 66%{transform:translateX(60px) translateY(-20px) scaleX(0.9);opacity:0.4} }
        @keyframes aurora2 { 0%,100%{transform:translateX(0) translateY(0) scaleX(1);opacity:0.4} 33%{transform:translateX(100px) translateY(-40px) scaleX(0.8);opacity:0.7} 66%{transform:translateX(-60px) translateY(20px) scaleX(1.3);opacity:0.3} }
        @keyframes aurora3 { 0%,100%{transform:translateX(0) translateY(0) scaleX(1);opacity:0.3} 50%{transform:translateX(-40px) translateY(50px) scaleX(1.4);opacity:0.6} }
        @keyframes floatLogo { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 40px rgba(0,200,120,0.15),0 0 80px rgba(0,150,200,0.08)} 50%{box-shadow:0 0 60px rgba(0,200,120,0.25),0 0 120px rgba(0,150,200,0.15)} }
        .cs-a1{position:absolute;width:700px;height:200px;background:radial-gradient(ellipse,rgba(0,220,130,0.35) 0%,rgba(0,180,100,0.15) 40%,transparent 70%);top:5%;left:-10%;border-radius:50%;filter:blur(40px);animation:aurora1 14s ease-in-out infinite}
        .cs-a2{position:absolute;width:600px;height:160px;background:radial-gradient(ellipse,rgba(0,180,255,0.3) 0%,rgba(60,120,220,0.12) 40%,transparent 70%);top:12%;right:-15%;border-radius:50%;filter:blur(50px);animation:aurora2 18s ease-in-out infinite}
        .cs-a3{position:absolute;width:500px;height:120px;background:radial-gradient(ellipse,rgba(100,0,200,0.25) 0%,rgba(80,0,160,0.1) 40%,transparent 70%);top:2%;left:30%;border-radius:50%;filter:blur(45px);animation:aurora3 22s ease-in-out infinite}
        .cs-a4{position:absolute;width:400px;height:100px;background:radial-gradient(ellipse,rgba(0,240,160,0.2) 0%,rgba(0,200,140,0.08) 40%,transparent 70%);top:20%;left:20%;border-radius:50%;filter:blur(35px);animation:aurora1 25s ease-in-out infinite reverse}
        .cs-milky{position:absolute;width:140%;height:120px;background:linear-gradient(90deg,transparent 0%,rgba(180,160,255,0.04) 15%,rgba(220,200,255,0.08) 30%,rgba(255,240,200,0.06) 50%,rgba(200,220,255,0.08) 70%,rgba(160,180,255,0.04) 85%,transparent 100%);top:35%;left:-20%;transform:rotate(-15deg);filter:blur(8px)}
        .cs-logo-wrap{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;animation:floatLogo 6s ease-in-out infinite}
        .cs-ring1{position:absolute;width:180px;height:180px;border-radius:50%;border:1px solid rgba(0,220,130,0.12);animation:rotateSlow 20s linear infinite,pulseGlow 4s ease-in-out infinite}
        .cs-ring2{position:absolute;width:240px;height:240px;border-radius:50%;border:1px solid rgba(0,180,255,0.06);animation:rotateSlow 30s linear infinite reverse}
        .cs-circle{width:130px;height:130px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;position:relative;z-index:2}
        .cs-stars{position:absolute;inset:0;pointer-events:none}
      `}</style>
      <canvas className="cs-stars" id="cs-canvas"></canvas>
      <div className="cs-a1" /><div className="cs-a2" /><div className="cs-a3" /><div className="cs-a4" /><div className="cs-milky" />
      <div className="cs-logo-wrap">
        <div className="cs-ring2" /><div className="cs-ring1" />
        <div className="cs-circle">
          <img src="/logo.svg" alt="މެރިހާނާ" style={{ width: "70px", height: "70px", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
        </div>
        <p style={{ fontFamily: '"MVTypewriter", "Noto Sans Thaana", sans-serif', fontSize: "13px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textAlign: "center", position: "relative", zIndex: 2, margin: 0 }}>
          މެރިހާނާ — އަންނަނީ
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `(function(){var c=document.getElementById('cs-canvas');if(!c)return;var x=c.getContext('2d'),w=c.parentElement;function r(){c.width=w.offsetWidth;c.height=w.offsetHeight;}r();var s=Array.from({length:280},function(){return{x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.2,sp:0.3+Math.random()*1.5,ph:Math.random()*Math.PI*2,b:0.3+Math.random()*0.7,col:Math.random()>0.85?'rgba(180,220,255,':Math.random()>0.7?'rgba(255,240,200,':'rgba(255,255,255,'};});var t=0;function d(){x.clearRect(0,0,c.width,c.height);t+=0.008;s.forEach(function(s){var f=s.b*(0.6+0.4*Math.sin(t*s.sp+s.ph));x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fillStyle=s.col+f+')';x.fill();});requestAnimationFrame(d);}d();window.addEventListener('resize',r);})();` }} />
    </div>
  );
}

export default async function HomePage() {
  const isAdmin = await isAdminUser();
  if (!isAdmin) return <ComingSoon />;

  const { hero, todaysPicks, people, reviews, reels, latest } = await getHomeData();

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
      {reels.length > 0 && <ReelsStrip reels={reels} />}
      <ReviewsSection articles={reviews} />
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
