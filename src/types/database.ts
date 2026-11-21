/**
 * Database Row and Payload Type Definitions for Neon PostgreSQL
 * 
 * Tables:
 * - public.shows
 * - public.episodes
 */

export interface ShowRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  poster_url: string | null;
  backdrop_url: string | null;
  poster_file_id?: string | null;
  backdrop_file_id?: string | null;
  genre: string | null;
  release_year: number | null;
  duration: string | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShowInsert {
  id?: string;
  user_id: string;
  title: string;
  type: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  poster_file_id?: string | null;
  backdrop_file_id?: string | null;
  genre?: string | null;
  release_year?: number | null;
  duration?: string | null;
  status?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShowUpdate {
  title?: string;
  type?: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  poster_file_id?: string | null;
  backdrop_file_id?: string | null;
  genre?: string | null;
  release_year?: number | null;
  duration?: string | null;
  status?: string;
  description?: string | null;
  updated_at?: string;
}

export interface EpisodeRow {
  id: string;
  show_id: string;
  season: number;
  episode_number: number | null;
  title: string;
  platform: string | null;
  watch_link: string | null;
  notes: string | null;
  watched: boolean;
  created_at: string;
  updated_at: string;
}

export interface EpisodeInsert {
  id?: string;
  show_id: string;
  season?: number;
  episode_number?: number | null;
  title: string;
  platform?: string | null;
  watch_link?: string | null;
  notes?: string | null;
  watched?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EpisodeUpdate {
  show_id?: string;
  season?: number;
  episode_number?: number | null;
  title?: string;
  platform?: string | null;
  watch_link?: string | null;
  notes?: string | null;
  watched?: boolean;
  updated_at?: string;
}
