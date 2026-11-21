-- Migration: 004_secure_mutations_and_cleanup_outbox.sql
-- Description: Complete Concurrency Protocol (Lexicographical Advisory Locks, FOR UPDATE, Drift Detection,
--              File Reservation Checks), Outbox Table, Triggers, and Worker Claim/Finalize RPCs.

-- 1. Ensure image_cleanup_queue exists with proper schema
CREATE TABLE IF NOT EXISTS public.image_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  show_id uuid,
  file_id text NOT NULL,
  source text NOT NULL, -- 'poster_replace', 'backdrop_replace', 'show_delete'
  status text NOT NULL DEFAULT 'pending',
  claim_token uuid,
  lease_expires_at timestamptz,
  retry_count int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'processed', 'retained', 'failed'))
);

-- Indeks antrean dan reservasi
CREATE INDEX IF NOT EXISTS idx_cleanup_claimable 
  ON public.image_cleanup_queue(user_id, status, lease_expires_at)
  WHERE status IN ('pending', 'processing', 'failed');

CREATE INDEX IF NOT EXISTS idx_cleanup_file_reservation
  ON public.image_cleanup_queue(file_id, status);

-- RLS untuk tabel antrean (Client dilarang INSERT/UPDATE/DELETE langsung)
ALTER TABLE public.image_cleanup_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.image_cleanup_queue FROM PUBLIC;
REVOKE ALL ON public.image_cleanup_queue FROM authenticated;
GRANT SELECT ON public.image_cleanup_queue TO authenticated;

DROP POLICY IF EXISTS "Users can only read own cleanup records" ON public.image_cleanup_queue;
CREATE POLICY "Users can only read own cleanup records"
  ON public.image_cleanup_queue
  FOR SELECT
  TO authenticated
  USING (
    user_id = coalesce(
  auth.uid()::text,
  nullif(current_setting('request.jwt.claim.sub', true), ''),
  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
)
  );

-- 2. Trigger Penjaga Pengaitan Referensi Baru (BEFORE INSERT OR UPDATE)
CREATE OR REPLACE FUNCTION public.trg_shows_validate_file_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_f1 text := NEW.poster_file_id;
  v_f2 text := NEW.backdrop_file_id;
  v_first text;
  v_second text;
BEGIN
  IF v_f1 IS NOT NULL AND length(trim(v_f1)) = 0 THEN v_f1 := NULL; END IF;
  IF v_f2 IS NOT NULL AND length(trim(v_f2)) = 0 THEN v_f2 := NULL; END IF;

  -- Kunci berurutan secara leksikografis untuk mencegah deadlock antar-file
  IF v_f1 IS NOT NULL AND v_f2 IS NOT NULL AND v_f1 <> v_f2 THEN
    v_first  := LEAST(v_f1, v_f2);
    v_second := GREATEST(v_f1, v_f2);
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(v_first), 1, 16))::bit(64)::bigint);
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(v_second), 1, 16))::bit(64)::bigint);
  ELSIF v_f1 IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(v_f1), 1, 16))::bit(64)::bigint);
  ELSIF v_f2 IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(v_f2), 1, 16))::bit(64)::bigint);
  END IF;

  -- Validasi Reservasi: Tolak jika file sedang dalam terminasi
  IF v_f1 IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_f1 
        AND status IN ('pending', 'processing', 'failed')
    ) THEN
      RAISE EXCEPTION 'Poster file % sedang dalam proses terminasi atau pembersihan', v_f1 
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF v_f2 IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_f2 
        AND status IN ('pending', 'processing', 'failed')
    ) THEN
      RAISE EXCEPTION 'Backdrop file % sedang dalam proses terminasi atau pembersihan', v_f2 
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shows_validate_file_references ON public.shows;
CREATE TRIGGER trg_shows_validate_file_references
  BEFORE INSERT OR UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_shows_validate_file_references();

-- 3. Trigger Pencatat Riwayat Mutasi (AFTER UPDATE OR DELETE)
CREATE OR REPLACE FUNCTION public.trg_shows_record_orphaned_files()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.poster_file_id IS NOT NULL AND length(trim(OLD.poster_file_id)) > 0 THEN
      INSERT INTO public.image_cleanup_queue (user_id, show_id, file_id, source)
      VALUES (OLD.user_id, OLD.id, trim(OLD.poster_file_id), 'show_delete');
    END IF;
    IF OLD.backdrop_file_id IS NOT NULL AND length(trim(OLD.backdrop_file_id)) > 0 
       AND trim(OLD.backdrop_file_id) IS DISTINCT FROM trim(OLD.poster_file_id) THEN
      INSERT INTO public.image_cleanup_queue (user_id, show_id, file_id, source)
      VALUES (OLD.user_id, OLD.id, trim(OLD.backdrop_file_id), 'show_delete');
    END IF;
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.poster_file_id IS NOT NULL AND length(trim(OLD.poster_file_id)) > 0 
       AND trim(OLD.poster_file_id) IS DISTINCT FROM trim(NEW.poster_file_id) THEN
      INSERT INTO public.image_cleanup_queue (user_id, show_id, file_id, source)
      VALUES (OLD.user_id, OLD.id, trim(OLD.poster_file_id), 'poster_replace');
    END IF;
    IF OLD.backdrop_file_id IS NOT NULL AND length(trim(OLD.backdrop_file_id)) > 0 
       AND trim(OLD.backdrop_file_id) IS DISTINCT FROM trim(NEW.backdrop_file_id) THEN
      INSERT INTO public.image_cleanup_queue (user_id, show_id, file_id, source)
      VALUES (OLD.user_id, OLD.id, trim(OLD.backdrop_file_id), 'backdrop_replace');
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_shows_record_orphaned_files ON public.shows;
CREATE TRIGGER trg_shows_record_orphaned_files
  AFTER UPDATE OR DELETE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_shows_record_orphaned_files();

-- 4. RPC safe_update_show dengan Concurrency Hardening Lengkap
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
v_user_id text := coalesce(
  auth.uid()::text,
  nullif(current_setting('request.jwt.claim.sub', true), ''),
  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
);
  v_old_poster text;
  v_old_backdrop text;
  v_new_poster text;
  v_new_backdrop text;
  v_cur_poster text;
  v_cur_backdrop text;
  v_fid text;
  v_updated public.shows;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' OR v_user_id = 'anonymous' THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- 1. Snapshot old references tanpa row lock
  SELECT poster_file_id, backdrop_file_id
  INTO v_old_poster, v_old_backdrop
  FROM public.shows
  WHERE id = p_show_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;

  -- Tentukan target file IDs baru
  v_new_poster := CASE
    WHEN p_payload ? 'poster_file_id' THEN NULLIF(trim(p_payload->>'poster_file_id'), '')
    ELSE v_old_poster
  END;
  v_new_backdrop := CASE
    WHEN p_payload ? 'backdrop_file_id' THEN NULLIF(trim(p_payload->>'backdrop_file_id'), '')
    ELSE v_old_backdrop
  END;

  -- 2. Ambil advisory lock leksikografis untuk seluruh file ID yang relevan (old + new)
  FOR v_fid IN
    SELECT DISTINCT f
    FROM unnest(ARRAY[v_old_poster, v_old_backdrop, v_new_poster, v_new_backdrop]) AS f
    WHERE f IS NOT NULL AND length(trim(f)) > 0
    ORDER BY f ASC
  LOOP
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(trim(v_fid)), 1, 16))::bit(64)::bigint);
  END LOOP;

  -- 3. Row lock show FOR UPDATE
  SELECT poster_file_id, backdrop_file_id
  INTO v_cur_poster, v_cur_backdrop
  FROM public.shows
  WHERE id = p_show_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;

  -- 4. Re-read & Drift Detection
  IF (v_cur_poster IS DISTINCT FROM v_old_poster) OR (v_cur_backdrop IS DISTINCT FROM v_old_backdrop) THEN
    RAISE EXCEPTION 'IMAGE_LOCK_DRIFT_RETRY' USING ERRCODE = '40001';
  END IF;

  -- 5. Reservation check: pastikan file baru tidak sedang dalam antrean pembersihan
  IF v_new_poster IS NOT NULL AND (v_old_poster IS NULL OR v_new_poster <> v_old_poster) THEN
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_new_poster AND status IN ('pending', 'processing', 'failed')
    ) THEN
      RAISE EXCEPTION 'Poster file % is currently reserved for cleanup', v_new_poster USING ERRCODE = '23514';
    END IF;
  END IF;

  IF v_new_backdrop IS NOT NULL AND (v_old_backdrop IS NULL OR v_new_backdrop <> v_old_backdrop) THEN
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_new_backdrop AND status IN ('pending', 'processing', 'failed')
    ) THEN
      RAISE EXCEPTION 'Backdrop file % is currently reserved for cleanup', v_new_backdrop USING ERRCODE = '23514';
    END IF;
  END IF;

  -- 6. Eksekusi UPDATE (AFTER UPDATE trigger akan otomatis memasukkan old file ke queue jika diganti)
  UPDATE public.shows
  SET
    title = CASE WHEN p_payload ? 'title' THEN NULLIF(btrim(p_payload->>'title'), '') ELSE title END,
    type = CASE WHEN p_payload ? 'type' THEN p_payload->>'type' ELSE type END,
    poster_url = CASE WHEN p_payload ? 'poster_url' THEN p_payload->>'poster_url' ELSE poster_url END,
    backdrop_url = CASE WHEN p_payload ? 'backdrop_url' THEN p_payload->>'backdrop_url' ELSE backdrop_url END,
    poster_file_id = CASE WHEN p_payload ? 'poster_file_id' THEN NULLIF(btrim(p_payload->>'poster_file_id'), '') ELSE poster_file_id END,
    backdrop_file_id = CASE WHEN p_payload ? 'backdrop_file_id' THEN NULLIF(btrim(p_payload->>'backdrop_file_id'), '') ELSE backdrop_file_id END,
    genre = CASE WHEN p_payload ? 'genre' THEN p_payload->>'genre' ELSE genre END,
    release_year = CASE WHEN p_payload ? 'release_year' THEN (p_payload->>'release_year')::integer ELSE release_year END,
    duration = CASE WHEN p_payload ? 'duration' THEN p_payload->>'duration' ELSE duration END,
    status = CASE WHEN p_payload ? 'status' THEN p_payload->>'status' ELSE status END,
    description = CASE WHEN p_payload ? 'description' THEN p_payload->>'description' ELSE description END,
    updated_at = now()
  WHERE id = p_show_id
    AND user_id = v_user_id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

-- 5. RPC safe_delete_show dengan Concurrency Hardening Lengkap
CREATE OR REPLACE FUNCTION public.safe_delete_show(
  p_show_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
v_user_id text := coalesce(
  auth.uid()::text,
  nullif(current_setting('request.jwt.claim.sub', true), ''),
  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
);
  v_old_poster text;
  v_old_backdrop text;
  v_cur_poster text;
  v_cur_backdrop text;
  v_fid text;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' OR v_user_id = 'anonymous' THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  -- 1. Snapshot references tanpa row lock
  SELECT poster_file_id, backdrop_file_id
  INTO v_old_poster, v_old_backdrop
  FROM public.shows
  WHERE id = p_show_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;

  -- 2. Ambil advisory lock leksikografis
  FOR v_fid IN
    SELECT DISTINCT f
    FROM unnest(ARRAY[v_old_poster, v_old_backdrop]) AS f
    WHERE f IS NOT NULL AND length(trim(f)) > 0
    ORDER BY f ASC
  LOOP
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(trim(v_fid)), 1, 16))::bit(64)::bigint);
  END LOOP;

  -- 3. Row lock show FOR UPDATE
  SELECT poster_file_id, backdrop_file_id
  INTO v_cur_poster, v_cur_backdrop
  FROM public.shows
  WHERE id = p_show_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Show not found or permission denied' USING ERRCODE = '42501';
  END IF;

  -- 4. Re-read & Drift Detection
  IF (v_cur_poster IS DISTINCT FROM v_old_poster) OR (v_cur_backdrop IS DISTINCT FROM v_old_backdrop) THEN
    RAISE EXCEPTION 'IMAGE_LOCK_DRIFT_RETRY' USING ERRCODE = '40001';
  END IF;

  -- 5. Eksekusi DELETE (AFTER DELETE trigger akan otomatis memasukkan file ke queue)
  DELETE FROM public.shows
  WHERE id = p_show_id AND user_id = v_user_id;
END;
$$;

-- 6. RPC claim_cleanup_queue_items untuk Worker
CREATE OR REPLACE FUNCTION public.claim_cleanup_queue_items(
  batch_size int DEFAULT 5,
  lease_seconds int DEFAULT 60
)
RETURNS TABLE (
  queue_id uuid,
  target_file_id text,
  assigned_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec record;
  v_token uuid;
  v_in_use boolean;
v_user_id text := coalesce(
  auth.uid()::text,
  nullif(current_setting('request.jwt.claim.sub', true), ''),
  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
);
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' OR v_user_id = 'anonymous' THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  FOR v_rec IN
    SELECT q.id, q.file_id, q.status, q.retry_count
    FROM public.image_cleanup_queue q
    WHERE q.user_id = v_user_id
      AND (
        q.status = 'pending'
        OR (q.status = 'failed' AND q.retry_count < 3)
        OR (q.status = 'processing' AND q.lease_expires_at < clock_timestamp())
      )
    ORDER BY q.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 1. Ambil advisory lock untuk file_id ini
    PERFORM pg_advisory_xact_lock(('x' || substr(md5(v_rec.file_id), 1, 16))::bit(64)::bigint);

    -- 2. Deduplikasi Sukses: cek apakah file_id sudah 'processed' di item lain
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_rec.file_id 
        AND id <> v_rec.id 
        AND status = 'processed'
    ) THEN
      UPDATE public.image_cleanup_queue
      SET status = 'processed',
          last_error = 'Resolved via duplicate processed item',
          processed_at = clock_timestamp()
      WHERE id = v_rec.id;
      CONTINUE;
    END IF;

    -- 3. Deduplikasi Paralel: cek apakah file_id sedang aktif diproses item lain
    IF EXISTS (
      SELECT 1 FROM public.image_cleanup_queue
      WHERE file_id = v_rec.file_id 
        AND id <> v_rec.id 
        AND status = 'processing'
        AND lease_expires_at > clock_timestamp()
    ) THEN
      CONTINUE;
    END IF;

    -- 4. Global Reference Check: cek apakah file masih aktif digunakan oleh show mana pun
    SELECT EXISTS (
      SELECT 1 FROM public.shows
      WHERE poster_file_id = v_rec.file_id OR backdrop_file_id = v_rec.file_id
    ) INTO v_in_use;

    IF v_in_use THEN
      UPDATE public.image_cleanup_queue
      SET status = 'retained',
          processed_at = clock_timestamp()
      WHERE id = v_rec.id;
    ELSE
      -- Terbitkan fencing token baru dan perpanjang lease
      v_token := gen_random_uuid();
      UPDATE public.image_cleanup_queue
      SET status = 'processing',
          claim_token = v_token,
          lease_expires_at = clock_timestamp() + (lease_seconds || ' seconds')::interval,
          retry_count = v_rec.retry_count + 1
      WHERE id = v_rec.id;

      queue_id       := v_rec.id;
      target_file_id := v_rec.file_id;
      assigned_token := v_token;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 7. RPC finalize_cleanup_item untuk Worker
CREATE OR REPLACE FUNCTION public.finalize_cleanup_item(
  p_queue_id uuid,
  p_claim_token uuid,
  p_success boolean,
  p_error text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated int;
v_user_id text := coalesce(
  auth.uid()::text,
  nullif(current_setting('request.jwt.claim.sub', true), ''),
  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
);
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' OR v_user_id = 'anonymous' THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.image_cleanup_queue
  SET status = CASE WHEN p_success THEN 'processed' ELSE 'failed' END,
      last_error = p_error,
      processed_at = clock_timestamp(),
      claim_token = NULL
  WHERE id = p_queue_id
    AND user_id = v_user_id
    AND claim_token = p_claim_token
    AND status = 'processing'
    AND lease_expires_at > clock_timestamp();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- 8. Atur Hak Akses Eksekusi (Privilege Hardening)
REVOKE ALL ON FUNCTION public.safe_update_show(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_update_show(uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.safe_delete_show(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_delete_show(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_cleanup_queue_items(int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_cleanup_queue_items(int, int) TO authenticated;

REVOKE ALL ON FUNCTION public.finalize_cleanup_item(uuid, uuid, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_cleanup_item(uuid, uuid, boolean, text) TO authenticated;

-- 9. RPC Worker Admin / Scheduled Cron
-- Server-side only melalui direct PostgreSQL connection.
-- Tidak menggunakan auth.uid() karena worker cron berjalan lintas user.

CREATE OR REPLACE FUNCTION public.claim_cleanup_queue_items_admin(
  batch_size int DEFAULT 10,
  lease_seconds int DEFAULT 60
)
RETURNS TABLE (
  queue_id uuid,
  target_file_id text,
  assigned_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec record;
  v_token uuid;
  v_in_use boolean;
BEGIN
  -- Validasi parameter worker.
  IF batch_size <= 0 OR batch_size > 100 THEN
    RAISE EXCEPTION 'batch_size must be between 1 and 100';
  END IF;

  IF lease_seconds <= 0 OR lease_seconds > 3600 THEN
    RAISE EXCEPTION 'lease_seconds must be between 1 and 3600';
  END IF;

  FOR v_rec IN
    SELECT
      q.id,
      q.file_id,
      q.status,
      q.retry_count
    FROM public.image_cleanup_queue q
    WHERE (
      q.status = 'pending'
      OR (
        q.status = 'failed'
        AND q.retry_count < 3
      )
      OR (
        q.status = 'processing'
        AND q.lease_expires_at < clock_timestamp()
      )
    )
    ORDER BY q.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP

    -- Satu file hanya boleh diproses oleh satu worker
    -- dalam transaksi yang sama.
    PERFORM pg_advisory_xact_lock(
      ('x' || substr(md5(v_rec.file_id), 1, 16))::bit(64)::bigint
    );

    -- Jika file sudah berhasil diproses oleh queue item lain,
    -- item ini cukup dianggap selesai.
    IF EXISTS (
      SELECT 1
      FROM public.image_cleanup_queue
      WHERE file_id = v_rec.file_id
        AND id <> v_rec.id
        AND status = 'processed'
    ) THEN

      UPDATE public.image_cleanup_queue
      SET
        status = 'processed',
        last_error = 'Resolved via duplicate processed item',
        processed_at = clock_timestamp(),
        claim_token = NULL
      WHERE id = v_rec.id;

      CONTINUE;
    END IF;

    -- Jika file sedang aktif diproses worker lain,
    -- jangan claim item ini.
    IF EXISTS (
      SELECT 1
      FROM public.image_cleanup_queue
      WHERE file_id = v_rec.file_id
        AND id <> v_rec.id
        AND status = 'processing'
        AND lease_expires_at > clock_timestamp()
    ) THEN
      CONTINUE;
    END IF;

    -- Pastikan file benar-benar tidak lagi direferensikan
    -- oleh show mana pun.
    SELECT EXISTS (
      SELECT 1
      FROM public.shows
      WHERE poster_file_id = v_rec.file_id
         OR backdrop_file_id = v_rec.file_id
    )
    INTO v_in_use;

    IF v_in_use THEN

      -- File masih digunakan, jadi jangan pernah dihapus.
      UPDATE public.image_cleanup_queue
      SET
        status = 'retained',
        processed_at = clock_timestamp(),
        claim_token = NULL,
        last_error = NULL
      WHERE id = v_rec.id;

    ELSE

      -- Claim dengan fencing token baru.
      v_token := gen_random_uuid();

      UPDATE public.image_cleanup_queue
      SET
        status = 'processing',
        claim_token = v_token,
        lease_expires_at =
          clock_timestamp() + (lease_seconds || ' seconds')::interval,
        retry_count = v_rec.retry_count + 1,
        last_error = NULL
      WHERE id = v_rec.id;

      queue_id := v_rec.id;
      target_file_id := v_rec.file_id;
      assigned_token := v_token;

      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;


-- Admin claim hanya boleh digunakan oleh server-side
-- PostgreSQL connection yang memiliki hak eksekusi.
REVOKE ALL ON FUNCTION
  public.claim_cleanup_queue_items_admin(int, int)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.claim_cleanup_queue_items_admin(int, int)
FROM authenticated;


CREATE OR REPLACE FUNCTION public.finalize_cleanup_item_admin(
  p_queue_id uuid,
  p_claim_token uuid,
  p_success boolean,
  p_error text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated int;
BEGIN

  UPDATE public.image_cleanup_queue
  SET
    status = CASE
      WHEN p_success THEN 'processed'
      ELSE 'failed'
    END,
    last_error = p_error,
    processed_at = clock_timestamp(),
    claim_token = NULL,
    lease_expires_at = NULL
  WHERE id = p_queue_id
    AND claim_token = p_claim_token
    AND status = 'processing'
    AND lease_expires_at > clock_timestamp();

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$;


-- Admin finalize hanya boleh digunakan oleh server-side
-- PostgreSQL connection yang memiliki hak eksekusi.
REVOKE ALL ON FUNCTION
  public.finalize_cleanup_item_admin(uuid, uuid, boolean, text)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.finalize_cleanup_item_admin(uuid, uuid, boolean, text)
FROM authenticated;