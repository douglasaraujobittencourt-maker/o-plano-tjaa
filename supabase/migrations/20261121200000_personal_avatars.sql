-- O Plano® — foto pessoal. Não modifica logos-concursos nem exam_logo_url/exam_logo_bb_url.
-- Executar no SQL Editor do projeto Supabase antes de usar o upload em produção.
-- Buckets públicos tornam a imagem acessível a quem possuir a URL.
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
COMMENT ON COLUMN public.profiles.avatar_url IS
  'URL pública da foto pessoal no bucket avatars; independente das logos dos concursos.';

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Avatar profile owner select" ON public.profiles;
CREATE POLICY "Avatar profile owner select" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Avatar profile owner update" ON public.profiles;
CREATE POLICY "Avatar profile owner update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Só é permitido criar, substituir ou apagar fotos na pasta <auth.uid()>/.
-- A leitura do objeto por URL pública é intencional; a listagem autenticada
-- continua restrita aos arquivos do próprio usuário.
DROP POLICY IF EXISTS "Avatar upload own folder" ON storage.objects;
CREATE POLICY "Avatar upload own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar select own folder" ON storage.objects;
CREATE POLICY "Avatar select own folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar update own folder" ON storage.objects;
CREATE POLICY "Avatar update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar delete own folder" ON storage.objects;
CREATE POLICY "Avatar delete own folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text);

COMMIT;
