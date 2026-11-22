-- Identificador estável do assunto do edital, vinculado às sessões e revisões.
-- Mantém intactas as 10 matérias, os 182 assuntos e seus escopos originais.
-- Não cria ou duplica qualquer registro de catálogo.
alter table public.study_sessions
  add column if not exists edital_assunto_id integer;
alter table public.reviews
  add column if not exists edital_assunto_id integer;

create index if not exists study_sessions_edital_assunto_usuario_idx
  on public.study_sessions(user_id, edital_assunto_id)
  where edital_assunto_id is not null;
create index if not exists reviews_edital_assunto_usuario_idx
  on public.reviews(user_id, edital_assunto_id, layer)
  where edital_assunto_id is not null;

comment on column public.study_sessions.edital_assunto_id is
  'Identificador do assunto do catálogo BB/Caixa selecionado na sessão Bora Estudar.';
comment on column public.reviews.edital_assunto_id is
  'Identificador do assunto original cuja revisão foi agendada ou concluída.';
