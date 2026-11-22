-- PROTEÇÃO CONTRA DUPLICAÇÃO DE REVISÕES PENDENTES
-- Execução manual no SQL Editor do Supabase, DEPOIS da migração
-- 20261121213000_equivalencia_bnb_1017_caixa_72.sql.
-- Não apaga, modifica nem marca revisões como concluídas.
-- Aplica-se apenas a revisões PENDENTES vinculadas ao Edital.
-- A revisão de 60 dias poderá ser reagendada quando a anterior for concluída.

BEGIN;

DO $auditoria$
DECLARE
  grupos_duplicados integer;
BEGIN
  SELECT count(*) INTO grupos_duplicados FROM (
    SELECT user_id, edital_assunto_id, layer
    FROM public.reviews
    WHERE done IS FALSE AND edital_assunto_id IS NOT NULL
    GROUP BY user_id, edital_assunto_id, layer
    HAVING count(*) > 1
  ) repetidos;

  IF grupos_duplicados > 0 THEN
    RAISE EXCEPTION
      'Há % grupo(s) de revisões pendentes repetidas. Nada foi alterado. Consulte a query de diagnóstico abaixo antes de criar o índice.',
      grupos_duplicados;
  END IF;
END
$auditoria$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_pendentes_usuario_assunto_layer
ON public.reviews (user_id, edital_assunto_id, layer)
WHERE done IS FALSE AND edital_assunto_id IS NOT NULL;

COMMIT;

-- Confirme que o índice existe:
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reviews'
  AND indexname = 'uq_reviews_pendentes_usuario_assunto_layer';

-- Se a auditoria interromper o script, execute APENAS esta consulta para
-- localizar as duplicações, sem alterar os dados:
-- SELECT user_id, edital_assunto_id, layer, count(*) AS pendencias_repetidas,
--        array_agg(id ORDER BY id) AS revisoes_ids
-- FROM public.reviews
-- WHERE done IS FALSE AND edital_assunto_id IS NOT NULL
-- GROUP BY user_id, edital_assunto_id, layer
-- HAVING count(*) > 1
-- ORDER BY pendencias_repetidas DESC;
