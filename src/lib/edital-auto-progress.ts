import { supabase } from "@/integrations/supabase/external-client";

export type EtapaEdital =
  | "Pendente"
  | "Teoria"
  | "Concluído"
  | "Revisão 7D"
  | "Revisão 15D"
  | "Revisão 30D"
  | "Revisão 60D";

export type EtapasEdital = Record<number, EtapaEdital>;

const ETAPAS: EtapaEdital[] = [
  "Pendente", "Teoria", "Revisão 7D", "Revisão 15D", "Revisão 30D", "Revisão 60D", "Concluído",
];

/**
 * Espelho estritamente derivado dos eventos salvos no planner.
 * Não usa os checkboxes antigos de edital_progresso_usuario.
 * O vínculo por ID impede confundir assuntos com nomes semelhantes.
 */
export async function getEtapasAutomaticasEdital(): Promise<EtapasEdital> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sessão expirada. Entre novamente.");

  const uid = auth.user.id;
  // Supabase limita o tamanho da resposta; pagina para preservar todo o histórico.
  async function readAll<T>(query: () => any): Promise<T[]> {
    const all: T[] = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await query().range(offset, offset + pageSize - 1);
      if (error) throw new Error("Não foi possível sincronizar o edital com as sessões e revisões. Verifique se a migração do espelho automático foi executada no Supabase.");
      const rows = (data ?? []) as T[];
      all.push(...rows);
      if (rows.length < pageSize) return all;
    }
  }
  const [sessoes, revisoes] = await Promise.all([
    readAll<{ edital_assunto_id: number | null; task: string | null }>(() =>
      supabase.from("study_sessions").select("edital_assunto_id,task").eq("user_id", uid)
        .not("edital_assunto_id", "is", null).order("id")),
    readAll<{ edital_assunto_id: number | null; layer: number; done: boolean }>(() =>
      supabase.from("reviews").select("edital_assunto_id,layer,done").eq("user_id", uid)
        .not("edital_assunto_id", "is", null).order("id")),
  ]);

  const idsTeoria = new Set<number>();
  const idsConcluidos = new Set<number>();
  for (const s of sessoes) {
    if (s.edital_assunto_id == null) continue;
    idsTeoria.add(s.edital_assunto_id);
    if (s.task === "Conclusão manual") idsConcluidos.add(s.edital_assunto_id);
  }

  const feitas = new Map<number, Set<number>>();
  for (const r of revisoes) {
    if (r.edital_assunto_id == null) continue;
    // Uma revisão agendada também prova que a teoria foi registrada anteriormente.
    idsTeoria.add(r.edital_assunto_id);
    if (!r.done || r.layer < 1 || r.layer > 4) continue;
    const layers = feitas.get(r.edital_assunto_id) ?? new Set<number>();
    layers.add(r.layer);
    feitas.set(r.edital_assunto_id, layers);
  }

  const result: EtapasEdital = {};
  for (const id of idsTeoria) {
    let nivel = 1;
    const layers = feitas.get(id);
    // Evolução sequencial: revisão posterior não pula uma etapa anterior faltante.
    while (nivel <= 4 && layers?.has(nivel)) nivel++;
    result[id] = idsConcluidos.has(id) ? "Concluído" : ETAPAS[nivel];
  }

  // Tópicos comuns compartilham o mesmo ID no catálogo de tribunais.
  return result;
}

export const etapaDoAssunto = (etapas: EtapasEdital, id: number): EtapaEdital =>
  etapas[id] ?? "Pendente";
