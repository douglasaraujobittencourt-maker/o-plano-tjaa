import template from "./edital-template.json";
export const SCOPES = ["Comum (Caixa + BB)", "Só Caixa", "Só BB"] as const;
export const STATUSES = { pending: "⬜ Pendente", studying: "🔄 Em estudo", completed: "✅ Concluído" } as const;
export type EditalStatus = keyof typeof STATUSES;
export type TopicDefinition = { key: string; group_key: string; cycle: number; number: number; discipline: string; scope: string; block: string; title: string; caixa: string; bb: string; ord: number };
export type Topic = TopicDefinition & { id: string; user_id: string; subject_id: string | null; status: EditalStatus; theory: boolean; rev1: boolean; rev2: boolean; rev3: boolean; rev4: boolean; questions: number; correct: number; manual_questions: number; manual_correct: number };
export const EDITAL_TEMPLATE: TopicDefinition[] = template.topics;
export const EDITAL_RULES = template.rules;
export function percentage(n: number, total: number) { return total > 0 ? n / total * 100 : 0; }
export function summary(topics: Topic[]) {
  const completed = topics.filter(t => t.status === "completed").length;
  const studying = topics.filter(t => t.status === "studying").length;
  const questions = topics.reduce((n,t) => n + t.questions, 0);
  const correct = topics.reduce((n,t) => n + t.correct, 0);
  return { total: topics.length, completed, studying, pending: topics.length - completed - studying, progress: percentage(completed, topics.length), questions, correct, accuracy: percentage(correct, questions) };
}
export function groups(topics: Topic[]) {
  const map = new Map<string, Topic[]>();
  for (const t of topics) map.set(t.group_key, [...(map.get(t.group_key) ?? []), t]);
  return [...map.values()].sort((a,b) => a[0].cycle - b[0].cycle || a[0].number - b[0].number);
}
export function validateQuestions(questions: number, correct: number) {
  if (!Number.isInteger(questions) || !Number.isInteger(correct) || questions < 0 || correct < 0 || correct > questions) throw new Error("Informe números inteiros: acertos não podem superar questões.");
}
export function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function previewTopics(): Topic[] { return EDITAL_TEMPLATE.map(t => ({ ...t, id: t.key, user_id: "", subject_id: null, status: "pending", theory: false, rev1: false, rev2: false, rev3: false, rev4: false, questions: 0, correct: 0, manual_questions: 0, manual_correct: 0 })); }
export function parseWorkbookRows(rows: unknown[][]): TopicDefinition[] {
  const header = rows.findIndex(r => normalize(String(r[0] ?? "")) === "ciclo" && r.some(c => normalize(String(c ?? "")).includes("topico central")));
  if (header < 0) throw new Error("Não encontrei as colunas Ciclo e Matéria / Tópico Central da planilha.");
  const result: TopicDefinition[] = []; let group = "", discipline = "", number = 0;
  for (const [i,r] of rows.slice(header + 1).entries()) {
    const type = normalize(String(r[1] ?? ""));
    if (type === "materia") { discipline = String(r[4] ?? "").trim(); number++; group = `import-${normalize(discipline)}`; }
    if (type !== "assunto") continue;
    const title = String(r[4] ?? "").trim(), cycle = Number(String(r[0]).match(/\d+/)?.[0]), scope = String(r[2] ?? "");
    if (!group || !title || ![1,2].includes(cycle) || !SCOPES.includes(scope as typeof SCOPES[number])) throw new Error(`Linha ${header + i + 2}: matéria, ciclo, escopo ou tópico inválido.`);
    result.push({ key: `import-${normalize(discipline)}-${normalize(title)}`, group_key: group, cycle, number, discipline, scope, title, block: String(r[3] ?? ""), caixa: String(r[5] ?? ""), bb: String(r[6] ?? ""), ord: i });
  }
  if (!result.length) throw new Error("A planilha não contém linhas do tipo Assunto.");
  if (new Set(result.map(t => t.key)).size !== result.length) throw new Error("A planilha contém assuntos duplicados na mesma matéria.");
  return result;
}