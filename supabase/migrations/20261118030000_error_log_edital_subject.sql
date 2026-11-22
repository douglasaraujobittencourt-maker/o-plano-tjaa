-- Permite registrar erros associados diretamente a matérias do Edital Verticalizado,
-- sem criar cópias das matérias na tabela "subjects".
alter table public.error_log
  add column if not exists edital_materia_numero integer;

alter table public.error_log
  drop constraint if exists error_log_edital_materia_numero_check;
alter table public.error_log
  add constraint error_log_edital_materia_numero_check
    check (edital_materia_numero is null or edital_materia_numero between 1 and 10);

-- Registros do app usam subject_id, registros do edital usam edital_materia_numero.
-- Linhas históricas sem referência continuam preservadas.
create index if not exists idx_error_log_user_edital
  on public.error_log (user_id, edital_materia_numero);
