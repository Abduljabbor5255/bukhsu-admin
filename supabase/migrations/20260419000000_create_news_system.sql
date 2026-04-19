-- ============================================================
-- News system migration
-- Tables: news, news_media
-- RLS: public SELECT for published, authenticated full access
-- ============================================================

-- updated_at trigger function (reused across tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Table: news
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text        UNIQUE NOT NULL,
  title         text        NOT NULL,
  excerpt       text        CHECK (char_length(excerpt) <= 300),
  content       text,
  cover_image   text,
  author_id     uuid        REFERENCES teachers(id) ON DELETE SET NULL,
  category      text        CHECK (category IN ('tadbir','elon','ilmiy','xalqaro','umumiy')) DEFAULT 'umumiy',
  is_featured   boolean     DEFAULT false,
  is_published  boolean     DEFAULT false,
  published_at  timestamptz,
  views_count   integer     DEFAULT 0,
  created_at    timestamptz DEFAULT NOW(),
  updated_at    timestamptz DEFAULT NOW()
);

-- Indexes for news
CREATE INDEX IF NOT EXISTS idx_news_published_at
  ON news (is_published, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_featured_published_at
  ON news (is_featured, published_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_news_category_published_at
  ON news (category, published_at DESC);

-- updated_at trigger for news
CREATE TRIGGER set_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: news
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Public: read published rows only
CREATE POLICY "news_public_select"
  ON news FOR SELECT
  USING (is_published = true);

-- Authenticated: full access to all rows
CREATE POLICY "news_authenticated_select"
  ON news FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "news_authenticated_insert"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_authenticated_update"
  ON news FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_authenticated_delete"
  ON news FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Table: news_media
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id     uuid        REFERENCES news(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('image','video_embed','video_upload')),
  url         text        NOT NULL,
  caption     text,
  thumbnail   text,
  order_index integer     DEFAULT 0,
  created_at  timestamptz DEFAULT NOW()
);

-- Index for news_media
CREATE INDEX IF NOT EXISTS idx_news_media_news_id_order
  ON news_media (news_id, order_index);

-- RLS: news_media
ALTER TABLE news_media ENABLE ROW LEVEL SECURITY;

-- Public: read media only for published news
CREATE POLICY "news_media_public_select"
  ON news_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM news
      WHERE news.id = news_media.news_id
        AND news.is_published = true
    )
  );

-- Authenticated: full access
CREATE POLICY "news_media_authenticated_select"
  ON news_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "news_media_authenticated_insert"
  ON news_media FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_media_authenticated_update"
  ON news_media FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_media_authenticated_delete"
  ON news_media FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');
