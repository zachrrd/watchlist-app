-- Migration: Add ImageKit file ID columns to public.shows
-- Execute this migration in the Neon SQL Console / psql to enable automated ImageKit file cleanup.

ALTER TABLE public.shows 
ADD COLUMN IF NOT EXISTS poster_file_id TEXT,
ADD COLUMN IF NOT EXISTS backdrop_file_id TEXT;

-- Create indexes to optimize file reuse checks across shows
CREATE INDEX IF NOT EXISTS idx_shows_poster_file_id ON public.shows (poster_file_id) WHERE poster_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shows_backdrop_file_id ON public.shows (backdrop_file_id) WHERE backdrop_file_id IS NOT NULL;

COMMENT ON COLUMN public.shows.poster_file_id IS 'ImageKit fileId for the show poster';
COMMENT ON COLUMN public.shows.backdrop_file_id IS 'ImageKit fileId for the show backdrop';
