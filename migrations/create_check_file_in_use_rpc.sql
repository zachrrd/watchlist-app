-- Migration: Create trusted reference check RPC for ImageKit files
-- Function: public.check_file_in_use
-- Purpose: Safely check across all shows whether an ImageKit fileId is still referenced,
--          bypassing user-scoped RLS without leaking any row data to the caller.

CREATE OR REPLACE FUNCTION public.check_file_in_use(
  target_file_id text,
  exclude_show_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_in_use boolean;
BEGIN
  IF target_file_id IS NULL OR length(trim(target_file_id)) = 0 THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.shows
    WHERE (poster_file_id = trim(target_file_id) OR backdrop_file_id = trim(target_file_id))
      AND (exclude_show_id IS NULL OR id != exclude_show_id)
  ) INTO is_in_use;

  RETURN is_in_use;
END;
$$;

-- Revoke default public and anon permissions; grant execute only to authenticated and service_role
REVOKE ALL ON FUNCTION public.check_file_in_use(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_file_in_use(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_file_in_use(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_file_in_use(text, uuid) TO service_role;

COMMENT ON FUNCTION public.check_file_in_use(text, uuid) IS 
  'Checks if a poster or backdrop fileId is in use by any other show in the database, ignoring user RLS boundaries.';
