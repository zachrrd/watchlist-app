export interface Series {
  id: string;
  title: string;
  type: string;
  poster?: string;
  poster_url?: string;
  backdrop?: string;
  backdrop_url?: string;
  poster_file_id?: string;
  backdrop_file_id?: string;
  posterFileId?: string;
  backdropFileId?: string;
  genre?: string;
  year?: number | string;
  duration?: number | string;
  status?: string;
  description?: string;
}

export interface Episode {
  id: string;
  seriesId: string;
  season?: number;
  episodeNumber?: number;
  title: string;
  platform?: string;
  link?: string;
  notes?: string;
  watched: boolean;
}

export type SortOption =
  | 'default'
  | 'title-asc'
  | 'title-desc'
  | 'year-desc'
  | 'year-asc';

export type StatusFilterOption =
  | 'all'
  | 'Watching'
  | 'Plan to Watch'
  | 'Completed';

export * from './database';
