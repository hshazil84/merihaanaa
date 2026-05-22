/* ─────────────────────────────────────────────────────────
   MERIHAANAA — TypeScript Types
   ───────────────────────────────────────────────────────── */

// ── ENUMS ────────────────────────────────────────────────

export type UserRole = "reader" | "author" | "editor" | "admin";

export type ArticleStatus = "draft" | "published" | "scheduled";

export type ContentType =
  | "article"
  | "review"
  | "interview"
  | "photo_essay"
  | "fiction";

export type HomepagePlacement =
  | "hero"
  | "editors_choice"
  | "review"
  | "reel"
  | null;

export type VideoType = "reel" | "episode";

export type VideoStatus = "draft" | "published";

export type AuthorRole =
  | "editor"
  | "writer"
  | "contributor"
  | "photographer";

// ── CATEGORY ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;         // Thaana
  slug: string;
  parent_id: string | null;
  description: string | null;
  created_at: string;
  parent?: Category;
  children?: Category[];
}

// ── AUTHOR ───────────────────────────────────────────────

export interface Author {
  id: string;
  user_id: string | null;
  full_name: string;    // Thaana
  slug: string;
  bio: string | null;   // Thaana
  avatar: string | null;
  role: AuthorRole;
  social_twitter: string | null;
  social_instagram: string | null;
  is_active: boolean;
  created_at: string;
}

// ── ARTICLE ──────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;                          // Thaana
  slug: string;
  excerpt: string | null;                 // Thaana
  body: Record<string, unknown> | null;   // Tiptap JSON
  category_id: string;
  author_id: string;
  content_type: ContentType;
  reading_time_minutes: number | null;
  featured_image: string | null;          // R2 URL
  featured_image_caption: string | null;  // Thaana
  featured_video_id: string | null;       // Cloudflare Stream ID
  homepage_placement: HomepagePlacement;
  display_order: number;
  status: ArticleStatus;
  published_at: string | null;
  scheduled_for: string | null;
  is_premium: boolean;
  review_score: number | null;
  review_subject: string | null;          // Thaana
  og_title: string | null;               // Thaana
  og_description: string | null;         // Thaana
  og_image: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  author?: Author;
  tags?: Tag[];
}

// ── TAG ──────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;    // Thaana
  slug: string;
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
}

// ── VIDEO ─────────────────────────────────────────────────

export interface Video {
  id: string;
  title: string;                          // Thaana
  slug: string;
  description: Record<string, unknown> | null; // Tiptap JSON — show notes
  cloudflare_stream_id: string;
  duration_seconds: number | null;
  thumbnail: string | null;               // R2 URL
  category_id: string | null;
  series_id: string | null;
  episode_number: number | null;
  type: VideoType;
  status: VideoStatus;
  published_at: string | null;
  is_premium: boolean;
  created_at: string;
  // Relations
  category?: Category;
  series?: Series;
}

// ── SERIES ────────────────────────────────────────────────

export interface Series {
  id: string;
  title: string;        // Thaana
  slug: string;
  description: string | null;
  thumbnail: string | null;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  // Relations
  episodes?: Video[];
  category?: Category;
}

// ── PODCAST ───────────────────────────────────────────────

export interface Podcast {
  id: string;
  title: string;        // Thaana
  description: string | null;
  artwork: string | null;
  is_active: boolean;
}

export interface PodcastEpisode {
  id: string;
  podcast_id: string;
  title: string;                          // Thaana
  description: Record<string, unknown> | null; // Tiptap JSON
  audio_url: string;                      // R2 URL
  duration_seconds: number | null;
  episode_number: number;
  season_number: number;
  status: "draft" | "published";
  published_at: string | null;
  is_premium: boolean;
  // Relations
  podcast?: Podcast;
}

// ── HOMEPAGE LAYOUT ───────────────────────────────────────

export interface HomepageLayout {
  id: string;
  hero_article_id: string | null;
  editors_choice: string[];     // array of 3 article IDs
  reviews: string[];            // array of 3 article IDs
  reels: string[];              // array of 4 video IDs
  featured_episode_id: string | null;
  lottie_1_url: string | null;
  lottie_2_url: string | null;
  show_hero: boolean;
  show_editors_choice: boolean;
  show_reels: boolean;
  show_reviews: boolean;
  show_featured_episode: boolean;
  show_latest_articles: boolean;
  show_newsletter: boolean;
  show_lottie_breakers: boolean;
  is_active: boolean;
  updated_at: string;
  // Resolved relations
  hero_article?: Article;
  editors_choice_articles?: Article[];
  reviews_articles?: Article[];
  reels_videos?: Video[];
  featured_episode?: Video;
}

// ── USER ─────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar: string | null;
  role: UserRole;
  is_subscriber: boolean;
  created_at: string;
}

// ── COMMENT ──────────────────────────────────────────────

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  body: string;         // Thaana
  is_approved: boolean;
  created_at: string;
  // Relations
  user?: UserProfile;
  article?: Article;
}

// ── SAVED ARTICLE ────────────────────────────────────────

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
  article?: Article;
}

// ── SUBSCRIBER ───────────────────────────────────────────

export interface Subscriber {
  id: string;
  email: string;
  is_confirmed: boolean;
  subscribed_at: string;
}

// ── API RESPONSES ────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ── ADMIN ────────────────────────────────────────────────

export interface DashboardStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  total_subscribers: number;
  pending_comments: number;
  total_videos: number;
}
