export interface Series {
  id: number;
  title: string;
  type: string;
  poster?: string;
  backdrop?: string;
  genre?: string;
  year?: number | string;
  duration?: number | string;
  status?: string;
  description?: string;
}

export interface Episode {
  id: number;
  seriesId: number;
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
