"use client";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  documentary: "ޑޮކިއުމެންޓްރީ",
  profile:     "ޕްރޮފައިލް",
  episode:     "އެޕިސޯޑް",
  segment:     "ސެގްމެންޓް",
  interview:   "އިންޓަވިއު",
  short:       "ޝޯޓް",
};

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function OriginalCard({ item }: { item: any }) {
  return (
    <div className="group block flex-none relative">
      <Link href={`/originals/${item.slug}/watch`}>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </div>
          {item.duration_seconds && (
            <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/60 px-1.5 py-0.5 rounded tabular-nums">
              {formatDuration(item.duration_seconds)}
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] text-neutral-300 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded" style={{ fontFamily: "MVTypewriter, serif" }}>
              {TYPE_LABELS[item.type] ?? item.type}
            </span>
          </div>
          <Link
            href={`/originals/${item.slug}`}
            onClick={e => e.stopPropagation()}
            className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
        </div>
      </Link>
      <p className="mt-2 text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug group-hover:text-white transition-colors" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>
        {item.title}
      </p>
      {item.series && (
        <p className="text-xs text-neutral-500 mt-0.5" dir="auto" style={{ fontFamily: "MVTypewriter, serif" }}>{item.series.title}</p>
      )}
    </div>
  );
}
