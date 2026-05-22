-- ─────────────────────────────────────────────────────────
-- MERIHAANAA — Supabase Migration
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CATEGORIES ───────────────────────────────────────────

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug) VALUES
  ('ކަވަރ ސްޓޯރީ',         'cover-story'),
  ('ފިލްމް',               'film'),
  ('މިއުޒިކް',             'music'),
  ('އާޓް',        'art'),
  ('ވާހަކަ',               'fiction'),
  ('ދިރިއުޅުން',           'lifestyle'),
  ('ރިވިއު',        'review'),
  ('ކެއުން',        'food'),
  ('ދަތުރު',               'travel'),
  ('އިންޓަވިއު', 'interview');

-- Seed subcategories (Film)
INSERT INTO categories (name, slug, parent_id)
SELECT 'ކުރު ފިލްމް', 'short-film', id FROM categories WHERE slug = 'film';

INSERT INTO categories (name, slug, parent_id)
SELECT 'ޑޮކިއުމެންޓްރީ', 'documentary', id FROM categories WHERE slug = 'film';

-- ── AUTHORS ──────────────────────────────────────────────

CREATE TABLE authors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  bio              TEXT,
  avatar           TEXT,
  role             TEXT NOT NULL DEFAULT 'writer'
                   CHECK (role IN ('editor', 'writer', 'contributor', 'photographer')),
  social_twitter   TEXT,
  social_instagram TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ARTICLES ─────────────────────────────────────────────

CREATE TABLE articles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  excerpt                 TEXT,
  body                    JSONB,
  category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id               UUID REFERENCES authors(id) ON DELETE SET NULL,
  content_type            TEXT NOT NULL DEFAULT 'article'
                          CHECK (content_type IN ('article','review','interview','photo_essay','fiction')),
  reading_time_minutes    INT,
  featured_image          TEXT,
  featured_image_caption  TEXT,
  featured_video_id       TEXT,
  homepage_placement      TEXT
                          CHECK (homepage_placement IN ('hero','editors_choice','review','reel')),
  display_order           INT DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','published','scheduled')),
  published_at            TIMESTAMPTZ,
  scheduled_for           TIMESTAMPTZ,
  is_premium              BOOLEAN DEFAULT FALSE,
  review_score            INT CHECK (review_score >= 1 AND review_score <= 10),
  review_subject          TEXT,
  og_title                TEXT,
  og_description          TEXT,
  og_image                TEXT,
  meta_description        TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── TAGS ─────────────────────────────────────────────────

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE
);

CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ── SERIES ───────────────────────────────────────────────

CREATE TABLE series (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail   TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEOS ───────────────────────────────────────────────

CREATE TABLE videos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  description           JSONB,
  cloudflare_stream_id  TEXT NOT NULL,
  duration_seconds      INT,
  thumbnail             TEXT,
  category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  series_id             UUID REFERENCES series(id) ON DELETE SET NULL,
  episode_number        INT,
  type                  TEXT NOT NULL DEFAULT 'episode'
                        CHECK (type IN ('reel', 'episode')),
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
  published_at          TIMESTAMPTZ,
  is_premium            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── PODCASTS ─────────────────────────────────────────────

CREATE TABLE podcasts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  artwork     TEXT,
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE podcast_episodes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id       UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      JSONB,
  audio_url        TEXT NOT NULL,
  duration_seconds INT,
  episode_number   INT NOT NULL,
  season_number    INT NOT NULL DEFAULT 1,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'published')),
  published_at     TIMESTAMPTZ,
  is_premium       BOOLEAN DEFAULT FALSE
);

-- ── HOMEPAGE LAYOUT ───────────────────────────────────────

CREATE TABLE homepage_layouts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_article_id       UUID REFERENCES articles(id) ON DELETE SET NULL,
  editors_choice        UUID[] DEFAULT '{}',
  reviews               UUID[] DEFAULT '{}',
  reels                 UUID[] DEFAULT '{}',
  featured_episode_id   UUID REFERENCES videos(id) ON DELETE SET NULL,
  lottie_1_url          TEXT,
  lottie_2_url          TEXT,
  show_hero             BOOLEAN DEFAULT TRUE,
  show_editors_choice   BOOLEAN DEFAULT TRUE,
  show_reels            BOOLEAN DEFAULT TRUE,
  show_reviews          BOOLEAN DEFAULT TRUE,
  show_featured_episode BOOLEAN DEFAULT TRUE,
  show_latest_articles  BOOLEAN DEFAULT TRUE,
  show_newsletter       BOOLEAN DEFAULT TRUE,
  show_lottie_breakers  BOOLEAN DEFAULT TRUE,
  is_active             BOOLEAN DEFAULT TRUE,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default layout row (only ever one active row)
INSERT INTO homepage_layouts (is_active) VALUES (TRUE);

-- ── USER PROFILES ─────────────────────────────────────────

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar        TEXT,
  role          TEXT NOT NULL DEFAULT 'reader'
                CHECK (role IN ('reader', 'author', 'editor', 'admin')),
  is_subscriber BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── COMMENTS ─────────────────────────────────────────────

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SAVED ARTICLES ────────────────────────────────────────

CREATE TABLE saved_articles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- ── SUBSCRIBERS ───────────────────────────────────────────

CREATE TABLE subscribers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT NOT NULL UNIQUE,
  is_confirmed   BOOLEAN DEFAULT FALSE,
  subscribed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────

ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE series            ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_layouts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers       ENABLE ROW LEVEL SECURITY;

-- ── HELPER FUNCTION ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── CATEGORIES — Public read ──────────────────────────────

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT USING (TRUE);

CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── AUTHORS — Public read ─────────────────────────────────

CREATE POLICY "authors_public_read"
  ON authors FOR SELECT USING (is_active = TRUE);

CREATE POLICY "authors_admin_all"
  ON authors FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── ARTICLES — Public reads published only ────────────────

CREATE POLICY "articles_public_read"
  ON articles FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "articles_author_own_drafts"
  ON articles FOR SELECT
  USING (
    get_user_role() = 'author'
    AND author_id = (
      SELECT id FROM authors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "articles_author_insert"
  ON articles FOR INSERT
  WITH CHECK (get_user_role() IN ('author', 'editor', 'admin'));

CREATE POLICY "articles_author_update_own"
  ON articles FOR UPDATE
  USING (
    get_user_role() = 'author'
    AND author_id = (SELECT id FROM authors WHERE user_id = auth.uid())
    AND status = 'draft'
  );

CREATE POLICY "articles_editor_all"
  ON articles FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── TAGS — Public read ────────────────────────────────────

CREATE POLICY "tags_public_read"
  ON tags FOR SELECT USING (TRUE);

CREATE POLICY "tags_editor_all"
  ON tags FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

CREATE POLICY "article_tags_public_read"
  ON article_tags FOR SELECT USING (TRUE);

CREATE POLICY "article_tags_editor_all"
  ON article_tags FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── SERIES — Public read ──────────────────────────────────

CREATE POLICY "series_public_read"
  ON series FOR SELECT USING (is_active = TRUE);

CREATE POLICY "series_editor_all"
  ON series FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── VIDEOS — Public reads published only ──────────────────

CREATE POLICY "videos_public_read"
  ON videos FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "videos_editor_all"
  ON videos FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── PODCASTS — Public read ────────────────────────────────

CREATE POLICY "podcasts_public_read"
  ON podcasts FOR SELECT USING (is_active = TRUE);

CREATE POLICY "podcast_episodes_public_read"
  ON podcast_episodes FOR SELECT
  USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "podcasts_editor_all"
  ON podcasts FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

CREATE POLICY "podcast_episodes_editor_all"
  ON podcast_episodes FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── HOMEPAGE LAYOUT — Public read, editor write ───────────

CREATE POLICY "homepage_public_read"
  ON homepage_layouts FOR SELECT USING (is_active = TRUE);

CREATE POLICY "homepage_editor_all"
  ON homepage_layouts FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── USER PROFILES ─────────────────────────────────────────

CREATE POLICY "profiles_own_read"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_own_update"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON user_profiles FOR ALL
  USING (get_user_role() = 'admin');

-- ── COMMENTS ─────────────────────────────────────────────

-- Public reads approved comments only
CREATE POLICY "comments_public_read"
  ON comments FOR SELECT
  USING (is_approved = TRUE);

-- Readers can insert comments
CREATE POLICY "comments_reader_insert"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can see their own pending comments
CREATE POLICY "comments_own_read"
  ON comments FOR SELECT
  USING (user_id = auth.uid());

-- Editors approve/delete
CREATE POLICY "comments_editor_all"
  ON comments FOR ALL
  USING (get_user_role() IN ('editor', 'admin'));

-- ── SAVED ARTICLES ────────────────────────────────────────

CREATE POLICY "saved_own"
  ON saved_articles FOR ALL
  USING (user_id = auth.uid());

-- ── SUBSCRIBERS ───────────────────────────────────────────

CREATE POLICY "subscribers_insert"
  ON subscribers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "subscribers_admin_read"
  ON subscribers FOR SELECT
  USING (get_user_role() IN ('editor', 'admin'));

-- ─────────────────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────────────────

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_placement ON articles(homepage_placement);
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_type ON videos(type);
CREATE INDEX idx_videos_series ON videos(series_id);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_saved_user ON saved_articles(user_id);
