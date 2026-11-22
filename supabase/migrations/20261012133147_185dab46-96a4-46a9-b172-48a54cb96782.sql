CREATE TABLE public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic text NOT NULL,
  mistake text NOT NULL,
  reason text NOT NULL,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_log TO authenticated;
GRANT ALL ON public.error_log TO service_role;
ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own error_log" ON public.error_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX error_log_user_idx ON public.error_log(user_id, created_at DESC);
CREATE TRIGGER touch_error_log BEFORE UPDATE ON public.error_log FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();