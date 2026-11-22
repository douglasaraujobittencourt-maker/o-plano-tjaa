-- Configuração complementar para o serviço externo atual.
-- Crie/configure o bucket público avatars pela API Storage primeiro.
-- Não modifica logos, arquivos anteriores ou o histórico de migrações.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avatar profile owner select" ON public.profiles;
CREATE POLICY "Avatar profile owner select" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Avatar profile owner update" ON public.profiles;
CREATE POLICY "Avatar profile owner update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Avatar upload own folder" ON storage.objects;
CREATE POLICY "Avatar upload own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Avatar select own folder" ON storage.objects;
CREATE POLICY "Avatar select own folder" ON storage.objects
  FOR SELECT TO authenticated USING
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Avatar update own folder" ON storage.objects;
CREATE POLICY "Avatar update own folder" ON storage.objects
  FOR UPDATE TO authenticated USING
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Avatar delete own folder" ON storage.objects;
CREATE POLICY "Avatar delete own folder" ON storage.objects
  FOR DELETE TO authenticated USING
  (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
COMMIT;