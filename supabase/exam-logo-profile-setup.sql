-- Apply in the existing project's SQL editor AFTER creating the bucket via Storage API.
-- This file is not applied automatically by Lovable.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_logo_url text;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exam logo owner read" ON public.profiles;
CREATE POLICY "Exam logo owner read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Exam logo owner update" ON public.profiles;
CREATE POLICY "Exam logo owner update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Exam logo upload own" ON storage.objects;
CREATE POLICY "Exam logo upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos-concursos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Exam logo read own" ON storage.objects;
CREATE POLICY "Exam logo read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'logos-concursos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Exam logo delete own" ON storage.objects;
CREATE POLICY "Exam logo delete own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'logos-concursos' AND (storage.foldername(name))[1] = auth.uid()::text);