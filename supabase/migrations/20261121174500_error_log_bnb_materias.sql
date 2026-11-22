-- Amplia o Caderno de Erros para matérias do BNB sem perder registros de BB/Caixa.
-- Códigos do edital unificado: BB/Caixa = 1..10, BNB = 101..103.
alter table public.error_log
  drop constraint if exists error_log_edital_materia_numero_check;

alter table public.error_log
  add constraint error_log_edital_materia_numero_check
  check (
    edital_materia_numero is null
    or edital_materia_numero between 1 and 10
    or edital_materia_numero between 101 and 103
  );
