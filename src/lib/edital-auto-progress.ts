import { supabase } from "@/integrations/supabase/external-client";
import { getEditalCatalog } from "@/lib/edital-catalog";
import { loadBnbCatalog } from "@/lib/edital-bnb-data";
import { montarMateriasTresBancos } from "@/lib/edital-three-banks";

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

  // Espelha somente tópicos textualmente equivalentes nos três bancos.
  // Mantém o armazenamento original por ID: nenhuma sessão ou revisão é duplicada.
  // Tópicos parcialmente relacionados, mas diferentes, continuam independentes.
  try {
    const [catalog, bnb] = await Promise.all([getEditalCatalog(), loadBnbCatalog()]);
    for (const materia of montarMateriasTresBancos(catalog, bnb)) {
      for (const assunto of materia.assuntos) {
        if (!assunto.referencias.some(ref => ref.origem === "bnb") ||
            !assunto.referencias.some(ref => ref.origem === "caixa-bb")) continue;
        const maiorEtapa = Math.max(...assunto.referencias.map(ref =>
          ETAPAS.indexOf(result[ref.id] ?? "Pendente")));
        const etapaCompartilhada = ETAPAS[maiorEtapa] ?? "Pendente";
        for (const ref of assunto.referencias) result[ref.id] = etapaCompartilhada;
      }
    }
  } catch {
    // Se um catálogo estiver indisponível, os dados originais de progresso
    // continuam sendo exibidos sem perder nenhuma etapa já registrada.
  }
  return result;
}

export const etapaDoAssunto = (etapas: EtapasEdital, id: number): EtapaEdital =>
  etapas[id] ?? "Pendente";
