export type TopicPerformanceRow = { id: number | null; name: string; qDone: number; qCorrect: number; accuracy: number | null };
type Topic = { id: number; topico_central: string };
type QuestionSession = { edital_assunto_id?: number | null; questions_done?: number | null; questions_correct?: number | null };

// Recebe apenas sessões da matéria e do período selecionado. IDs estáveis preservam renomeações.
export function aggregateTopicPerformance(topics: readonly Topic[], sessions: readonly QuestionSession[], canonicalize: (id: number) => number = id => id): TopicPerformanceRow[] {
  const rows = new Map<number, TopicPerformanceRow>();
  for (const topic of topics) {
    const id = canonicalize(topic.id);
    if (!rows.has(id)) rows.set(id, { id, name: topic.topico_central, qDone: 0, qCorrect: 0, accuracy: null });
  }
  const unlinked = { id: null, name: "Questões sem assunto vinculado", qDone: 0, qCorrect: 0, accuracy: null };
  for (const session of sessions) {
    const topicId = session.edital_assunto_id;
    const row = (topicId == null ? undefined : rows.get(canonicalize(topicId))) ?? unlinked;
    row.qDone += session.questions_done ?? 0;
    row.qCorrect += session.questions_correct ?? 0;
  }
  const result = [...rows.values()];
  if (unlinked.qDone !== 0 || unlinked.qCorrect !== 0) result.push(unlinked);
  return result.map(row => ({ ...row, accuracy: row.qDone > 0 ? Math.round(row.qCorrect / row.qDone * 100) : null }));
}
