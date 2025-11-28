-- Caché de timelines de partidas (reduce llamadas a Riot API)

CREATE TABLE IF NOT EXISTS match_timelines (
  match_id TEXT PRIMARY KEY,
  timeline JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_timelines_cached_at
  ON match_timelines(cached_at DESC);
