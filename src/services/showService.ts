import { neon } from "../lib/neon";
import type { Series, ShowRow, ShowInsert, ShowUpdate } from "../types";

/**
 * Maps a database ShowRow (snake_case) to the frontend Series entity (camelCase).
 * Note: Database internal fields (user_id, created_at, updated_at) are not leaked into Series.
 */
export function mapShowRowToSeries(row: ShowRow): Series {
  const poster = row.poster_url ?? undefined;
  const backdrop = row.backdrop_url ?? undefined;
  const posterFileId = row.poster_file_id ?? undefined;
  const backdropFileId = row.backdrop_file_id ?? undefined;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    poster,
    poster_url: poster,
    backdrop,
    backdrop_url: backdrop,
    poster_file_id: posterFileId,
    posterFileId,
    backdrop_file_id: backdropFileId,
    backdropFileId,
    genre: row.genre ?? undefined,
    year: row.release_year ?? undefined,
    duration: row.duration ?? undefined,
    status: row.status,
    description: row.description ?? undefined,
  };
}

/**
 * Maps frontend Series data to a database ShowInsert payload.
 * Injects the authenticated user's ID.
 */
export function mapSeriesToInsert(
  data: Omit<Series, "id"> & { id?: string },
  userId: string,
): ShowInsert {
  const parsedYear =
    typeof data.year === "number"
      ? data.year
      : typeof data.year === "string" && data.year.trim() !== ""
        ? parseInt(data.year, 10) || null
        : null;

  const poster = data.poster_url || data.poster || null;
  const backdrop = data.backdrop_url || data.backdrop || null;
  const posterFileId = data.poster_file_id || data.posterFileId || null;
  const backdropFileId = data.backdrop_file_id || data.backdropFileId || null;

  return {
    ...(data.id ? { id: data.id } : {}),
    user_id: userId,
    title: data.title.trim(),
    type: data.type,
    poster_url: poster,
    backdrop_url: backdrop,
    poster_file_id: posterFileId,
    backdrop_file_id: backdropFileId,
    genre: data.genre ?? null,
    release_year: parsedYear,
    duration: data.duration ? String(data.duration) : null,
    status: data.status || "Watching",
    description: data.description ?? null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps partial frontend Series updates to a database ShowUpdate payload.
 */
export function mapSeriesToUpdate(
  data: Partial<Omit<Series, "id">>,
): ShowUpdate {
  const update: ShowUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) update.title = data.title.trim();
  if (data.type !== undefined) update.type = data.type;

  const poster = data.poster_url !== undefined ? data.poster_url : data.poster;
  if (poster !== undefined) update.poster_url = poster || null;

  const backdrop =
    data.backdrop_url !== undefined ? data.backdrop_url : data.backdrop;
  if (backdrop !== undefined) update.backdrop_url = backdrop || null;

  const posterFileId =
    data.poster_file_id !== undefined ? data.poster_file_id : data.posterFileId;
  if (posterFileId !== undefined) update.poster_file_id = posterFileId || null;

  const backdropFileId =
    data.backdrop_file_id !== undefined
      ? data.backdrop_file_id
      : data.backdropFileId;
  if (backdropFileId !== undefined)
    update.backdrop_file_id = backdropFileId || null;

  if (data.genre !== undefined) update.genre = data.genre || null;
  if (data.year !== undefined) {
    update.release_year =
      typeof data.year === "number"
        ? data.year
        : typeof data.year === "string" && data.year.trim() !== ""
          ? parseInt(data.year, 10) || null
          : null;
  }
  if (data.duration !== undefined) {
    update.duration = data.duration ? String(data.duration) : null;
  }
  if (data.status !== undefined) update.status = data.status;
  if (data.description !== undefined) {
    update.description = data.description || null;
  }

  return update;
}

/**
 * Fetches all shows accessible by the authenticated user.
 * Optionally filters by userId if specified.
 */
export async function getShows(userId?: string): Promise<Series[]> {
  let query = neon
    .from("shows")
    .select("*")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.returns<ShowRow[]>();

  if (error) {
    throw new Error(`Failed to fetch shows: ${error.message}`);
  }

  return (data ?? []).map(mapShowRowToSeries);
}

/**
 * Fetches a single show by its UUID.
 */
export async function getShowById(id: string): Promise<Series | null> {
  const { data, error } = await neon
    .from("shows")
    .select("*")
    .eq("id", id)
    .returns<ShowRow[]>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch show with id "${id}": ${error.message}`);
  }

  return data ? mapShowRowToSeries(data) : null;
}

/**
 * Detects if a Neon PostgREST error is due to missing poster_file_id / backdrop_file_id columns
 * (e.g. before the user runs the database migration).
 */
function isFileIdColumnMissingError(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST204" ||
    (typeof error.message === "string" &&
      (error.message.includes("poster_file_id") ||
        error.message.includes("backdrop_file_id") ||
        (error.message.includes("column") &&
          error.message.includes("does not exist"))))
  );
}

/**
 * Inserts a new show for the authenticated user.
 * Gracefully omits fileId columns if the database migration has not been run yet.
 */
export async function createShow(
  data: Omit<Series, "id"> & { id?: string },
  userId: string,
): Promise<Series> {
  const payload = mapSeriesToInsert(data, userId);

  let { data: created, error } = await neon
    .from("shows")
    .insert(payload)
    .select()
    .returns<ShowRow[]>()
    .single();

  if (error && isFileIdColumnMissingError(error)) {
    console.warn(
      "Database missing fileId columns; retrying insert without fileIds.",
    );
    const fallbackPayload = { ...payload };
    delete fallbackPayload.poster_file_id;
    delete fallbackPayload.backdrop_file_id;

    const retry = await neon
      .from("shows")
      .insert(fallbackPayload)
      .select()
      .returns<ShowRow[]>()
      .single();

    created = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(`Failed to create show: ${error.message}`);
  }

  if (!created) {
    throw new Error("Show creation succeeded but no record was returned.");
  }

  return mapShowRowToSeries(created);
}

/**
 * Updates an existing show via protected RPC (safe_update_show).
 * Implements transparent retry on serialization drift (IMAGE_LOCK_DRIFT_RETRY).
 */
export async function updateShow(
  id: string,
  data: Partial<Omit<Series, "id">>,
  maxRetries = 2,
): Promise<Series> {
  const payload = mapSeriesToUpdate(data);

  let attempt = 0;
  while (attempt <= maxRetries) {
    const { data: updated, error } = await neon
      .rpc("safe_update_show", {
        p_show_id: id,
        p_payload: payload,
      })
      .returns<ShowRow>()
      .single();

    if (error) {
      const isDrift =
        error.code === "40001" ||
        (typeof error.message === "string" &&
          error.message.includes("IMAGE_LOCK_DRIFT_RETRY"));

      if (isDrift && attempt < maxRetries) {
        attempt++;
        // Jittered backoff before retrying
        await new Promise((res) => setTimeout(res, 50 * attempt + Math.random() * 50));
        continue;
      }

      throw new Error(`Failed to update show with id "${id}": ${error.message}`);
    }

    if (!updated) {
      throw new Error(
        `Show with id "${id}" was not found or could not be updated.`,
      );
    }

    return mapShowRowToSeries(updated);
  }

  throw new Error(`Failed to update show with id "${id}" after retries.`);
}

/**
 * Deletes a show via protected RPC (safe_delete_show).
 * Trigger automatically queues orphaned ImageKit file IDs for cleanup.
 */
export async function deleteShow(id: string): Promise<void> {
  const { error } = await neon.rpc("safe_delete_show", {
    p_show_id: id,
  });

  if (error) {
    throw new Error(`Failed to delete show with id "${id}": ${error.message}`);
  }
}
