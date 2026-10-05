-- Fresh replacement project only. Do not run against the disk-full project.
BEGIN;
CREATE TABLE public.app_backups (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 2097152),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.app_backup_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 2097152),
  UNIQUE (user_id, created_at)
);
CREATE INDEX app_backup_versions_user_created_idx ON public.app_backup_versions(user_id,created_at DESC,id DESC);
ALTER TABLE public.app_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_backup_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_backups,public.app_backup_versions FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.app_backups TO authenticated;
GRANT SELECT,INSERT,DELETE ON public.app_backup_versions TO authenticated;
GRANT USAGE ON SEQUENCE public.app_backup_versions_id_seq TO authenticated;
CREATE POLICY own_backup_read ON public.app_backups FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY own_backup_insert ON public.app_backups FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY own_backup_update ON public.app_backups FOR UPDATE TO authenticated USING ((SELECT auth.uid())=user_id) WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY own_history_read ON public.app_backup_versions FOR SELECT TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE POLICY own_history_insert ON public.app_backup_versions FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid())=user_id);
CREATE POLICY own_history_delete ON public.app_backup_versions FOR DELETE TO authenticated USING ((SELECT auth.uid())=user_id);
CREATE FUNCTION public.iv_lock_backup_history() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(NEW.user_id::text,94751005));
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.iv_prune_backup_history() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  DELETE FROM public.app_backup_versions v WHERE v.user_id=NEW.user_id AND v.id IN (
    SELECT h.id FROM public.app_backup_versions h WHERE h.user_id=NEW.user_id
    ORDER BY h.created_at DESC,h.id DESC OFFSET 20
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER iv_lock_backup_history BEFORE INSERT ON public.app_backup_versions FOR EACH ROW EXECUTE FUNCTION public.iv_lock_backup_history();
CREATE TRIGGER iv_prune_backup_history AFTER INSERT ON public.app_backup_versions FOR EACH ROW EXECUTE FUNCTION public.iv_prune_backup_history();
REVOKE ALL ON FUNCTION public.iv_lock_backup_history(),public.iv_prune_backup_history() FROM PUBLIC;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('Project-photos','Project-photos',false,5242880,ARRAY['image/jpeg']);
CREATE POLICY own_project_photo_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='Project-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
CREATE POLICY own_project_photo_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='Project-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
CREATE POLICY own_project_photo_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='Project-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text) WITH CHECK(bucket_id='Project-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
CREATE POLICY own_project_photo_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='Project-photos' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);
COMMIT;
