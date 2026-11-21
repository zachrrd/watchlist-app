-- 1. RPC safe_update_show
CREATE OR REPLACE FUNCTION public.safe_update_show(
  p_show_id uuid,
  p_payload jsonb
)
RETURNS public.shows
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated public.shows;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.shows
  SET
    title = CASE WHEN p_payload ? 'title' THEN NULLIF(btrim(p_payload->>'title'), '') ELSE title END,
    type = CASE WHEN p_payload ? 'type' THEN p_payload->>'type' ELSE type END,
    poster_url = CASE WHEN p_payload ? 'poster_url' THEN p_payload->>'poster_url' ELSE poster_url END,
    backdrop_url = CASE WHEN p_payload ? 'backdrop_url' THEN p_payload->>'backdrop_url' ELSE backdrop_url END,
    poster_file_id = CASE WHEN p_payload ? 'poster_file_id' THEN p_payload->>'poster_file_id' ELSE poster_file_id END,
    backdrop_file_id = CASE WHEN p_payload ? 'backdrop_file_id' THEN p_payload->>'backdrop_file_id' ELSE backdrop_file_id END,
    genre = CASE WHEN p_payload ? 'genre' THEN p_payload->>'genre' ELSE genre END,
    release_year = CASE WHEN p_payload ? 'release_year' THEN (p_payload->>'release_year')::integer ELSE release_year END,
    duration = CASE WHEN p_payload ? 'duration' THEN p_payload->>'duration' ELSE duration END,
    status = CASE WHEN p_payload ? 'status' THEN p_payload->>'status' ELSE status END,
    description = CASE WHEN p_payload ? 'description' THEN p_payload->>'description' ELSE description END,
    updated_at = now()
  WHERE id = p_show_id
    AND user_id = v_user_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;

  RETURN v_updated;
END;
$$;

-- 2. RPC safe_delete_show
CREATE OR REPLACE FUNCTION public.safe_delete_show(
  p_show_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.shows
  WHERE id = p_show_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- 3. Atur hak akses eksekusi RPC
REVOKE ALL ON FUNCTION public.safe_update_show(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_update_show(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.safe_delete_show(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_delete_show(uuid) TO authenticated;

-- 4. Cek verifikasi seluruh komponen database
SELECT
  to_regclass('public.image_cleanup_queue') AS queue_table,
  (SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enqueue_orphaned_show_images') AS trigger_name,
  (SELECT count(*) FROM pg_proc WHERE proname IN ('safe_update_show', 'safe_delete_show')) AS rpc_count;