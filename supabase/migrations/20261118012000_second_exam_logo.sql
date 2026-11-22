-- Segunda logo de concurso, preservando exam_logo_url existente (Logo 1 — Caixa).
alter table public.profiles
  add column if not exists exam_logo_bb_url text;

comment on column public.profiles.exam_logo_bb_url is
  'URL pública da Logo 2 — Banco do Brasil. A Logo 1 — Caixa permanece em exam_logo_url.';
