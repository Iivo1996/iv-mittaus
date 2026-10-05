-- Future inserts retain the newest 20 recovery points for that user.
-- Current app_backups and photo assets are not modified.
BEGIN;

CREATE OR REPLACE FUNCTION public.iv_prune_backup_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(NEW.user_id::text, 94751005)
  );

  DELETE FROM public.app_backup_versions AS versions
  WHERE versions.user_id = NEW.user_id
    AND versions.id IN (
      SELECT history.id
      FROM public.app_backup_versions AS history
      WHERE history.user_id = NEW.user_id
      ORDER BY history.created_at DESC NULLS LAST, history.id DESC
      OFFSET 20
    );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER iv_prune_backup_history
AFTER INSERT ON public.app_backup_versions
FOR EACH ROW EXECUTE FUNCTION public.iv_prune_backup_history();

REVOKE ALL ON FUNCTION public.iv_prune_backup_history() FROM PUBLIC;

COMMIT;

SELECT tgname AS trigger_name, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.app_backup_versions'::regclass
  AND tgname = 'iv_prune_backup_history';
