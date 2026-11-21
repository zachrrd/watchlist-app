import { neon } from "@/lib/neon";
import type { Episode, EpisodeRow, EpisodeInsert, EpisodeUpdate } from "@/types";

/**
 * Maps a database EpisodeRow (snake_case) to the frontend Episode entity (camelCase).
 * Resolves show_id -> seriesId.
 */
export function mapEpisodeRowToEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    seriesId: row.show_id,
    season: row.season,
    episodeNumber: row.episode_number ?? undefined,
    title: row.title,
    platform: row.platform ?? undefined,
    link: row.watch_link ?? undefined,
    notes: row.notes ?? undefined,
    watched: row.watched,
  };
}

/**
 * Maps frontend Episode data to a database EpisodeInsert payload.
 * Resolves seriesId -> show_id.
 */
export function mapEpisodeToInsert(
  data: Omit<Episode, "id"> & { id?: string },
): EpisodeInsert {
  return {
    ...(data.id ? { id: data.id } : {}),
    show_id: data.seriesId,
    season: data.season ?? 1,
    episode_number: data.episodeNumber ?? null,
    title: data.title.trim(),
    platform: data.platform ?? null,
    watch_link: data.link ?? null,
    notes: data.notes ?? null,
    watched: data.watched ?? false,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps partial frontend Episode updates to a database EpisodeUpdate payload.
 */
export function mapEpisodeToUpdate(
  data: Partial<Omit<Episode, "id" | "seriesId">>,
): EpisodeUpdate {
  const update: EpisodeUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.season !== undefined) update.season = data.season;
  if (data.episodeNumber !== undefined) {
    update.episode_number = data.episodeNumber ?? null;
  }
  if (data.title !== undefined) update.title = data.title.trim();
  if (data.platform !== undefined) update.platform = data.platform || null;
  if (data.link !== undefined) update.watch_link = data.link || null;
  if (data.notes !== undefined) update.notes = data.notes || null;
  if (data.watched !== undefined) update.watched = data.watched;

  return update;
}

/**
 * Fetches all episodes belonging to a specific show, ordered by season and episode number.
 */
export async function getEpisodesByShowId(showId: string): Promise<Episode[]> {
  const { data, error } = await neon
    .from("episodes")
    .select("*")
    .eq("show_id", showId)
    .order("season", { ascending: true })
    .order("episode_number", { ascending: true })
    .returns<EpisodeRow[]>();

  if (error) {
    throw new Error(
      `Failed to fetch episodes for show with id "${showId}": ${error.message}`,
    );
  }

  return (data ?? []).map(mapEpisodeRowToEpisode);
}

/**
 * Fetches all episodes accessible by the authenticated user across all shows.
 * Useful for global watchlist calculations and continue-watching rails.
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  const { data, error } = await neon
    .from("episodes")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<EpisodeRow[]>();

  if (error) {
    throw new Error(`Failed to fetch all episodes: ${error.message}`);
  }

  return (data ?? []).map(mapEpisodeRowToEpisode);
}

/**
 * Inserts a new episode associated with its parent show.
 */
export async function createEpisode(
  data: Omit<Episode, "id"> & { id?: string },
): Promise<Episode> {
  const payload = mapEpisodeToInsert(data);

  const { data: created, error } = await neon
    .from("episodes")
    .insert(payload)
    .select()
    .returns<EpisodeRow[]>()
    .single();

  if (error) {
    throw new Error(`Failed to create episode: ${error.message}`);
  }

  if (!created) {
    throw new Error("Episode creation succeeded but no record was returned.");
  }

  return mapEpisodeRowToEpisode(created);
}

/**
 * Updates an existing episode by its UUID.
 */
export async function updateEpisode(
  id: string,
  data: Partial<Omit<Episode, "id" | "seriesId">>,
): Promise<Episode> {
  const payload = mapEpisodeToUpdate(data);

  const { data: updated, error } = await neon
    .from("episodes")
    .update(payload)
    .eq("id", id)
    .select()
    .returns<EpisodeRow[]>()
    .single();

  if (error) {
    throw new Error(`Failed to update episode with id "${id}": ${error.message}`);
  }

  if (!updated) {
    throw new Error(
      `Episode with id "${id}" was not found or could not be updated.`,
    );
  }

  return mapEpisodeRowToEpisode(updated);
}

/**
 * Deletes a single episode by its UUID.
 */
export async function deleteEpisode(id: string): Promise<void> {
  const { error } = await neon.from("episodes").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete episode with id "${id}": ${error.message}`);
  }
}
