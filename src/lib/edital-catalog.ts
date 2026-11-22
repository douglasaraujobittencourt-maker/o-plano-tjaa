import { supabase } from "@/integrations/supabase/external-client";
import { loadCatalog, type Assunto, type Catalog, type Materia } from "@/lib/edital-caixa-bb-data";

function completo(c: Catalog | null, incorporado: Catalog): c is Catalog {
  if (!c || !Array.isArray(c.materias) || !Array.isArray(c.assuntos)) return false;
  if (!c.materias.length || !c.assuntos.length) return false;
  // Aceita novos assuntos, desde que todos os IDs incorporados estejam presentes.
  const materias = new Set(c.materias.map(m => m.numero));
  const assuntos = new Set(c.assuntos.map(a => a.id));
  return incorporado.materias.every(m => materias.has(m.numero)) &&
    incorporado.assuntos.every(a => assuntos.has(a.id));
}

function textoValido(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value.trim() !== "—";
}

/**
 * O catálogo incorporado contém a nomenclatura original dos 184 assuntos (182 originais mais dois itens BB restaurados).
 * Se um registro no Supabase ou no navegador estiver sem título,
 * recuperamos somente os campos vazios, mantendo o ID e os dados do usuário.
 * Não há gravações nem duplicação de linhas no banco.
 */
function restaurarTitulos(origem: Catalog, oficial: Catalog): Catalog {
  const materiaOriginal = new Map(oficial.materias.map(m => [m.numero, m]));
  const assuntoOriginal = new Map(oficial.assuntos.map(a => [a.id, a]));
  const preencher = <T extends Materia | Assunto>(atual: T, original: T | undefined): T => {
    if (!original) return atual;
    const next = { ...atual };
    for (const field of ["titulo_central", "topico_central", "nomenclatura_caixa", "nomenclatura_bb"] as const) {
      if (field in original && !textoValido((atual as any)[field])) {
        (next as any)[field] = (original as any)[field];
      }
    }
    return next;
  };
  const materias = origem.materias.map(m => {
    const atual = preencher(m, materiaOriginal.get(m.numero));
    if (m.numero === 10) {
      return {
        ...atual,
        titulo_central: atual.titulo_central.replace("itens 1 a 9", "itens 1 a 11"),
        nomenclatura_bb: atual.nomenclatura_bb.replace("itens 1 a 9", "itens 1 a 11"),
      };
    }
    return atual;
  });
  const existentes = new Set(origem.assuntos.map(a => a.id));
  // Mesmo se a migração ainda não tiver sido aplicada, os IDs 183/184 ficam
  // disponíveis no frontend sem sobrescrever os 182 IDs históricos.
  const assuntos = [
    ...origem.assuntos.map(a => preencher(a, assuntoOriginal.get(a.id))),
    ...oficial.assuntos.filter(a => !existentes.has(a.id)),
  ].sort((a,b) => a.ordem_exibicao-b.ordem_exibicao);
  return { materias, assuntos };
}

/** Catálogo único do Edital Verticalizado e do Bora Estudar, sem mutações. */
export async function getEditalCatalog(): Promise<Catalog> {
  // Primeiro carrega o catálogo original, que garante os textos dos 184 assuntos.
  const original = await loadCatalog();
  let externo: Catalog | null = null;

  try {
    const db = supabase as unknown as { from: (name: string) => any };
    const [materias, assuntos] = await Promise.all([
      db.from("edital_materias").select("*").order("numero"),
      db.from("edital_assuntos").select("*").order("ordem_exibicao"),
    ]);
    if (!materias.error && !assuntos.error) {
      const candidate: Catalog = {
        materias: materias.data as Materia[],
        assuntos: assuntos.data as Assunto[],
      };
      if (completo(candidate, original)) externo = candidate;
    }
  } catch { /* Usa o catálogo incorporado/local se as tabelas não estiverem disponíveis. */ }

  if (!externo) {
    try {
      const stored = localStorage.getItem("edital-caixa-bb-catalog-v1");
      const candidate = stored ? JSON.parse(stored) as Catalog : null;
      if (completo(candidate, original)) externo = candidate;
    } catch { /* Não utiliza armazenamento local inválido. */ }
  }

  if (!externo) return original;
  return restaurarTitulos(externo, original);
}
