-- Arquitetura bancária integrada — marcadores de progresso e unicidade.
-- Aplicar depois das migrações de catálogo e equivalência (BNB 1017 → Caixa 72).
-- Migração idempotente: não remove registros históricos.
BEGIN;

-- Marcadores de conclusão devem existir apenas uma vez por usuário/assunto.
-- Zero minuto evita inflar as horas semanais, PDFs e videoaulas.
CREATE UNIQUE INDEX IF NOT EXISTS uq_planner_edital_conclusao_manual
ON public.study_sessions (user_id, edital_assunto_id)
WHERE task = 'Conclusão manual' AND minutes = 0 AND edital_assunto_id IS NOT NULL;

-- A trava física elimina concorrência na criação de revisões pendentes.
-- Se houver duplicações históricas, o índice falhará SEM excluir registros.
-- Nesse caso, audite os grupos repetidos com o SQL de proteção já fornecido.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_pendentes_usuario_assunto_layer
ON public.reviews (user_id, edital_assunto_id, layer)
WHERE done IS FALSE AND edital_assunto_id IS NOT NULL;

-- Trava de execução atômica: uma sessão zero-minuto por assunto concluído.
-- SECURITY INVOKER conserva o RLS; o usuário deve ser dono da matéria.
CREATE OR REPLACE FUNCTION public.planner_mark_edital_topics_studied(
  p_subject_id uuid,
  p_topic_ids integer[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'É necessário estar autenticado' USING ERRCODE = '28000';
  END IF;

  IF p_subject_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.subjects
    WHERE id = p_subject_id AND user_id = v_uid
  ) THEN
    RAISE EXCEPTION 'Matéria inexistente ou não pertence ao usuário' USING ERRCODE = '42501';
  END IF;

  IF p_topic_ids IS NULL OR cardinality(p_topic_ids) = 0 THEN
    RETURN 0;
  END IF;

  -- Canoniza as equivalências BNB/BB/Caixa antes da gravação.
  -- O INSERT e a verificação de unicidade ocorrem na mesma transação.
  WITH ids AS (
    SELECT DISTINCT COALESCE(e.assunto_canonico_id, original.id) AS id
    FROM unnest(p_topic_ids) AS original(id)
    LEFT JOIN public.edital_equivalencias_bnb e
      ON e.bnb_assunto_id = original.id
  )
  INSERT INTO public.study_sessions (
    user_id, subject_id, edital_assunto_id, session_date,
    kind, minutes, pages_read, questions_done, questions_correct,
    task, lesson
  )
  SELECT v_uid, p_subject_id, ids.id,
    (now() AT TIME ZONE 'America/Sao_Paulo')::date,
    'questoes', 0, 0, 0, 0, 'Conclusão manual',
    COALESCE(a.topico_central, b.topico_central)
  FROM ids
  LEFT JOIN public.edital_assuntos a ON a.id = ids.id
  LEFT JOIN public.edital_bnb_assuntos b ON b.id = ids.id
  WHERE a.id IS NOT NULL OR b.id IS NOT NULL
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.planner_mark_edital_topics_studied(uuid,integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.planner_mark_edital_topics_studied(uuid,integer[]) TO authenticated;

COMMIT;

-- Consulta pós-migração (somente leitura):
-- SELECT indexname FROM pg_indexes WHERE schemaname='public'
--   AND indexname IN ('uq_planner_edital_conclusao_manual',
--                     'uq_reviews_pendentes_usuario_assunto_layer');
