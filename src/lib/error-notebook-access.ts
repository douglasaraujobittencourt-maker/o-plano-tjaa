import { supabase } from "@/integrations/supabase/client";
import { getEditalCatalog } from "@/lib/edital-catalog";
import { isTribunalSubject } from "@/lib/tribunal-catalog";
import { getEtapasAutomaticasEdital, etapaDoAssunto } from "@/lib/edital-auto-progress";

export type EligibleErrorSubject = {
  value: string;
  name: string;
  kind: "subject" | "edital";
  subjectId?: string;
  materiaNumero?: number;
};
export type ErrorNotebookAccess = {
  options: EligibleErrorSubject[];
  eligibleKeys: string[];
};

/**
 * Uma matéria pode ser liberada de duas maneiras:
 * 1) subjects.study_status = "finalized" (ciclo de estudos do app)
 * 2) Todos os assuntos do Edital Verticalizado chegaram à Revisão 60D.
 *
 * As etapas do edital são derivadas de sessões e revisões do planner.
 */
export async function getErrorNotebookAccess(): Promise<ErrorNotebookAccess> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Entre na sua conta para acessar o Caderno de Erros.");

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects").select("id, name, study_status").order("ord");
  if (subjectsError) throw subjectsError;

  const options: EligibleErrorSubject[] = (subjects ?? [])
    .filter(s => isTribunalSubject(s.name) && s.study_status === "finalized")
    .map(s => ({ value: "subject:" + s.id, name: s.name, kind: "subject" as const, subjectId: s.id }));

  const catalog = await getEditalCatalog();

  // O edital agora é read-only: seu progresso vem de sessões e revisões reais,
  // não dos antigos checkboxes manuais.
  let etapas: Awaited<ReturnType<typeof getEtapasAutomaticasEdital>> = {};
  try {
    etapas = await getEtapasAutomaticasEdital();
  } catch {
    // Sem a migração, preserva o desbloqueio das matérias finalizadas no app.
  }

  for (const m of [...catalog.materias].sort((a,b) => a.numero-b.numero)) {
    const topics = catalog.assuntos.filter(a => a.materia_numero === m.numero);
    if (!topics.length || !topics.every(a => etapaDoAssunto(etapas, a.id) === "Revisão 60D")) continue;
    options.push({
      value: "edital:" + m.numero,
      name: m.titulo_central.replace(/^\d+\.\s*/, ""),
      kind: "edital",
      materiaNumero: m.numero,
    });
  }

  return {options, eligibleKeys: options.map(o => o.value)};
}
