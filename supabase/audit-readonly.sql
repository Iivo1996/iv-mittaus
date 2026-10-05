-- IV Mittaus: vain luku. Ei muuta tai poista tietoja.
-- Aja Supabasen SQL Editorissa ja lähetä tarkistus-sarakkeen koko JSON-tulos.
select jsonb_pretty(jsonb_build_object(
  'tables', (select coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', c.relname,
    'rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity
  )), '[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where (n.nspname = 'public' and c.relname in ('app_backups', 'app_backup_versions'))
       or (n.nspname = 'storage' and c.relname = 'objects')),
  'policies', (select coalesce(jsonb_agg(jsonb_build_object(
    'schema', schemaname, 'table', tablename, 'name', policyname,
    'mode', permissive, 'roles', roles, 'command', cmd,
    'using', qual, 'with_check', with_check
  )), '[]'::jsonb) from pg_policies
    where (schemaname = 'public' and tablename in ('app_backups', 'app_backup_versions'))
       or (schemaname = 'storage' and tablename = 'objects')),
  'photo_bucket', (select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'public', public, 'file_size_limit', file_size_limit,
    'allowed_mime_types', allowed_mime_types
  )), '[]'::jsonb) from storage.buckets where id = 'project-photos'),
  'indexes', (select coalesce(jsonb_agg(jsonb_build_object(
    'table', tablename, 'name', indexname, 'definition', indexdef
  )), '[]'::jsonb) from pg_indexes
    where schemaname = 'public' and tablename in ('app_backups', 'app_backup_versions'))
)) as tarkistus;
