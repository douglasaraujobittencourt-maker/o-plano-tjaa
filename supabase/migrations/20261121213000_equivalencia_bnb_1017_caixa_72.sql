-- Complemento idempotente da matriz aprovada em 20261121190000.
-- Os dois editais trazem literalmente: "Significação das palavras".
-- Não exclui, duplica nem reenumera registros-fonte.
BEGIN;

DO $verificacao$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.edital_assuntos
    WHERE id = 72 AND materia_numero = 2 AND escopo = 'Só Caixa'
      AND btrim(topico_central) = 'Significação das palavras'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.edital_bnb_assuntos
    WHERE id = 1017 AND materia_numero = 101
      AND btrim(topico_central) = 'Significação das palavras'
  ) THEN
    RAISE EXCEPTION
      'IDs 72/1017: dados do edital divergentes; equivalência não aplicada';
  END IF;
END
$verificacao$;

INSERT INTO public.edital_equivalencias_bnb
  (bnb_assunto_id, assunto_canonico_id, justificativa)
VALUES (1017, 72, 'Significação das palavras — mesma nomenclatura Caixa/BNB')
ON CONFLICT (bnb_assunto_id) DO UPDATE
SET assunto_canonico_id = EXCLUDED.assunto_canonico_id,
    justificativa = EXCLUDED.justificativa;

-- Canoniza somente vínculos históricos, preservando as sessões e revisões.
UPDATE public.study_sessions
SET edital_assunto_id = 72
WHERE edital_assunto_id = 1017;

UPDATE public.reviews
SET edital_assunto_id = 72
WHERE edital_assunto_id = 1017;

COMMIT;
