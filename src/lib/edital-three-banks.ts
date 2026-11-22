import type { Catalog, Materia } from "@/lib/edital-caixa-bb-data";
import type { BnbCatalog } from "@/lib/edital-bnb-data";
import { categoriaMateriaCaixa } from "@/lib/caixa-subject-colors";
import { idCanonicoAssunto } from "@/lib/edital-topic-equivalence";

/**
 * A visão BB + Caixa + BNB preserva todas as 10 matérias e 184 assuntos do
 * catálogo original BB/Caixa e insere os 126 assuntos das 3 matérias do BNB
 * nas respectivas matérias equivalentes. Não modifica IDs nem progresso.
 */
export type AreaTresBancos = "bancarios" | "portugues" | "matematica";
export type OrigemTresBancos = "caixa-bb" | "bnb";
export type RefAssuntoTresBancos = {
  id: number;
  origem: OrigemTresBancos;
  escopo: string;
  nome: string;
};
export type AssuntoTresBancos = {
  key: string;
  nome: string;
  referencias: RefAssuntoTresBancos[];
};
export type MateriaTresBancos = {
  area: string; // identificador único da matéria (não apenas da área comum)
  titulo: string;
  tipo: "basica" | "especifica";
  assuntos: AssuntoTresBancos[];
  quantidadeOriginais: number;
};

export const AREAS_TRES_BANCOS = [
  {area: "bancarios", titulo: "Conhecimentos Bancários", tipo: "especifica"},
  {area: "portugues", titulo: "Língua Portuguesa", tipo: "basica"},
  {area: "matematica", titulo: "Matemática / Raciocínio Lógico e Quantitativo", tipo: "basica"},
] as const;

export function normalizaAssuntoTresBancos(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/^[\s\d.\-]+/, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function areaMateriaTresBancos(nome: string): AreaTresBancos | null {
  const t = normalizaAssuntoTresBancos(nome);
  if (t.includes("conhecimentos bancarios")) return "bancarios";
  if (t.includes("lingua portuguesa") || t === "portugues") return "portugues";
  if (/\b(matematica|raciocinio logico|estatistica|probabilidade)\b/.test(t)) return "matematica";
  return null;
}

/**
 * Apenas textos suficientemente coincidentes compartilham uma linha.
 * Temas específicos continuam presentes, com badge do banco correspondente.
 */
function materiaParaBNB(area: AreaTresBancos, materias: Materia[]): Materia | undefined {
  const candidatas = materias.filter(m => areaMateriaTresBancos(m.titulo_central) === area);
  if (area !== "matematica") return candidatas[0];
  // O BNB cobra Matemática/Raciocínio Lógico, e não apenas Matemática Financeira.
  // Prefere a disciplina geral de Matemática quando existe, preservando as
  // demais disciplinas (Financeira, Estatística etc.) como cards próprios.
  return candidatas.find(m => {
    const n = normalizaAssuntoTresBancos(m.titulo_central);
    return n.includes("matematica") &&
      !n.includes("financeira") &&
      !n.includes("estatistica") &&
      !n.includes("probabilidade");
  }) ?? candidatas[0];
}

export function montarMateriasTresBancos(bbCaixa: Catalog, bnb: BnbCatalog): MateriaTresBancos[] {
  type GrupoInterno = MateriaTresBancos & {
    equivalentes: Map<string, AssuntoTresBancos>;
  };
  const grupos: GrupoInterno[] = [];
  const porNumero = new Map<number, GrupoInterno>();

  function novoGrupo(area: string, titulo: string, tipo: "basica" | "especifica"): GrupoInterno {
    const grupo: GrupoInterno = {
      area, titulo, tipo, assuntos: [], quantidadeOriginais: 0,
      equivalentes: new Map(),
    };
    grupos.push(grupo);
    return grupo;
  }

  function adicionar(grupo: GrupoInterno, ref: RefAssuntoTresBancos) {
    // A unificação é baseada no ID canônico auditado, e nunca numa comparação
    // heurística de títulos: números semelhantes podem exigir conteúdos distintos.
    const chave = String(idCanonicoAssunto(ref.id));
    let assunto = grupo.equivalentes.get(chave);
    if (!assunto) {
      assunto = {
        key: grupo.area + ":" + chave,
        nome: ref.nome.trim() || "Assunto sem título",
        referencias: [],
      };
      grupo.assuntos.push(assunto);
      grupo.equivalentes.set(chave, assunto);
    }
    assunto.referencias.push(ref);
    grupo.quantidadeOriginais++;
  }

  const materiasOriginais = [...bbCaixa.materias].sort((a,b) => a.numero-b.numero);
  // TODAS as dez matérias BB/Caixa permanecem na visão de três bancos.
  for (const m of materiasOriginais) {
    const areaTematica = areaMateriaTresBancos(m.titulo_central);
    const titulo = areaTematica === "bancarios" ? "Conhecimentos Bancários"
      : areaTematica === "portugues" ? "Língua Portuguesa"
      : m.titulo_central.replace(/^\s*\d+\.\s*/, "");
    const grupo = novoGrupo("materia-" + m.numero, titulo, categoriaMateriaCaixa(m.titulo_central));
    porNumero.set(m.numero, grupo);
    for (const a of bbCaixa.assuntos.filter(a => a.materia_numero === m.numero)
      .sort((a,b) => a.ordem_exibicao-b.ordem_exibicao)) {
      adicionar(grupo, {
        id: a.id, origem: "caixa-bb", escopo: a.escopo, nome: a.topico_central,
      });
    }
  }

  // Os três blocos BNB entram DENTRO das matérias equivalentes, nunca
  // como cards separados quando a matéria existe no catálogo BB/Caixa.
  for (const materiaBNB of bnb.materias) {
    const area = areaMateriaTresBancos(materiaBNB.titulo_central);
    const destino = area ? materiaParaBNB(area, materiasOriginais) : undefined;
    const grupoPadrao = destino ? porNumero.get(destino.numero) :
      novoGrupo("bnb-materia-" + materiaBNB.numero,
        materiaBNB.titulo_central, materiaBNB.categoria);
    if (!grupoPadrao) continue;
    for (const assunto of bnb.assuntos.filter(a => a.materia_numero === materiaBNB.numero)) {
      // O edital BNB tem apenas "Matemática/Raciocínio Lógico" como matéria,
      // mas a visão integrada distribui seus subitens pelas matérias equivalentes:
      // 6.* -> Matemática Financeira; 5 -> Probabilidade; 1..4 -> Matemática.
      let grupo = grupoPadrao;
      if (materiaBNB.numero === 102) {
        const destinoExato = assunto.numero_edital === "5" ? 7
          : /^6(?:\.|$)/.test(assunto.numero_edital) ? 3
          : destino?.numero;
        grupo = (destinoExato != null ? porNumero.get(destinoExato) : undefined) ?? grupoPadrao;
      }
      adicionar(grupo, {
        id: assunto.id, origem: "bnb", escopo: "BNB", nome: assunto.topico_central,
      });
    }
  }

  // Só as matérias compartilhadas precisam de intercalação temática.
  for (const grupo of grupos) {
    if (!grupo.assuntos.some(a => a.referencias.some(ref => ref.origem === "bnb"))) continue;
    grupo.assuntos.sort((a,b) =>
      normalizaAssuntoTresBancos(a.nome).localeCompare(normalizaAssuntoTresBancos(b.nome), "pt-BR"));
  }

  return grupos.map(g => ({
    area: g.area,
    titulo: g.titulo,
    tipo: g.tipo,
    assuntos: g.assuntos,
    quantidadeOriginais: g.quantidadeOriginais,
  }));
}

export type BancosSelecionadosTresBancos = { bb: boolean; caixa: boolean; bnb: boolean };

/** Seleção comum entre o contador e as linhas realmente exibidas. */
export function filtrarMateriasTresBancos(
  grupos: MateriaTresBancos[], busca: string, selecionados: BancosSelecionadosTresBancos,
): MateriaTresBancos[] {
  const needle = normalizaAssuntoTresBancos(busca);
  const corresponde = (ref: RefAssuntoTresBancos) =>
    ref.origem === "bnb" ? selecionados.bnb
      : (ref.escopo !== "Só BB" && selecionados.caixa) ||
        (ref.escopo !== "Só Caixa" && selecionados.bb);
  return grupos.map(grupo => {
    const assuntos = grupo.assuntos.map(assunto => ({
      ...assunto,
      referencias: assunto.referencias.filter(corresponde),
    })).filter(assunto => assunto.referencias.length > 0 &&
      (!needle || normalizaAssuntoTresBancos(grupo.titulo).includes(needle) ||
       [assunto.nome, ...assunto.referencias.map(ref => ref.nome)]
         .some(nome => normalizaAssuntoTresBancos(nome).includes(needle))));
    return { ...grupo, assuntos };
  }).filter(grupo => grupo.assuntos.length > 0);
}
