/** BNB - edital nº 1 de 26/01/2024, Anexo IV, Analista Bancário 1.
 *  3 disciplinas, 126 itens numerados (inclusive subitens).
 *  IDs fixos 1001–1126, fora dos 182 IDs de Caixa/BB.
 *  A fonte é empacotada para preservar literalmente a redação do edital.
 */
import { supabase } from "@/integrations/supabase/external-client";
export const BNB_COR = "#DC2626";
export const BNB_COR_ESPECIFICA = "#FB923C";
export function corMateriaBnb(categoria: "basica" | "especifica"): string {
  return categoria === "especifica" ? BNB_COR_ESPECIFICA : BNB_COR;
}
export const BNB_MATERIA_OFFSET = 100;
export const BNB_ASSUNTO_OFFSET = 1000;
export type BnbMateria = { numero: number; titulo_central: string; categoria: "basica" | "especifica" };
export type BnbAssunto = { id: number; materia_numero: number; numero_edital: string; topico_central: string; comum: boolean };
export type BnbCatalog = { materias: BnbMateria[]; assuntos: BnbAssunto[] };

const PACKED_BNB = "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";

export function normalizaBnb(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\b\d+(?:\.\d+)*\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g," ").trim();
}
const EXCLUSIVOS_BNB = /\b(fne|fundo constitucional|pronaf|credito rural|microfinancas|microcredito urbano|bndes|finame|fundo de amparo|fat\b|banco do nordeste|regiao nordeste|cred[ií]to industrial|agroindustrial|comercio e para a prestacao|politica de responsabilidade socioambiental|gestao da etica|codigo de conduta etica e integridade|desenvolvimento sustentavel|contratos por instrumento|cedulas e notas de credito|hipoteca e penhor|alienacao fiduciaria de bens moveis|cadastro de pessoas juridicas|composicao societaria|forma de tributacao|mandatos e procuracoes)\b/;
const COMUNS_BANCARIOS = /\b(sistema financeiro nacional|banco central|conselho monetario|riscos da atividade bancaria|credito pessoal|cartao de credito|capital de giro|depositos|caderneta de poupanca|fundos de investimento|titulos de capitalizacao|seguros|previdencia|sistema de pagamentos brasileiro|pix|arranjos de pagamentos|fintechs|open banking|internet banking|mobile banking|blockchain|lgpd|protecao de dados|seguranca cibernetica|transformacao digital|correspondentes bancarios|funcoes da moeda|mercado financeiro|emprestimos|financiamentos)\b/;

/** Comparação temática indicativa entre o BNB e os editais Caixa/BB.
 *  Não confunde equivalência de tema com identidade integral de conteúdo.
 */
export function assuntoBNBEmComum(titulo: string, categoria: "basica" | "especifica", numero: string): boolean {
  if (categoria === "basica") return true;
  const t = normalizaBnb(titulo);
  if (EXCLUSIVOS_BNB.test(t)) return false;
  return COMUNS_BANCARIOS.test(t);
}

let cached: Promise<BnbCatalog> | undefined;
export function loadBnbCatalog(): Promise<BnbCatalog> {
  if (!cached) cached = (async () => {
    // Quando a migração do BNB estiver aplicada, usa a fonte oficial no Supabase.
    // Em implantações anteriores, mantém fallback idêntico ao anexo incorporado.
    try {
      const db = supabase as unknown as {from: (table: string)=>any};
      const [m, a] = await Promise.all([
        db.from("edital_bnb_materias").select("*").order("numero"),
        db.from("edital_bnb_assuntos").select("*").order("id"),
      ]);
      if (!m.error && !a.error && m.data?.length === 3 && a.data?.length === 126) {
        const materias = m.data as BnbMateria[];
        const assuntos = (a.data as (BnbAssunto & {ordem_exibicao:number})[]).map(item => ({
          ...item,
          comum: assuntoBNBEmComum(item.topico_central,
            materias.find(mat=>mat.numero===item.materia_numero)?.categoria ?? "especifica",
            item.numero_edital),
        }));
        return {materias, assuntos};
      }
    } catch { /* O catálogo incorporado pode funcionar sem essa migração. */ }
    const bytes = Uint8Array.from(atob(PACKED_BNB), c => c.charCodeAt(0));
    const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate"));
    const raw = JSON.parse(await new Response(stream).text()) as Array<{
      nome: string; tipo: "basica" | "especifica"; topicos: [string, string][]
    }>;
    if (raw.length !== 3 || raw.reduce((n,m)=>n+m.topicos.length,0) !== 126)
      throw new Error("Catálogo do BNB incompleto");
    const materias = raw.map((m,i)=>({numero: BNB_MATERIA_OFFSET+i+1, titulo_central:m.nome, categoria:m.tipo}));
    let index = 0;
    const assuntos = raw.flatMap((m,i) => m.topicos.map(([numero_edital, topico_central]) => ({
      id: BNB_ASSUNTO_OFFSET+(++index), materia_numero: BNB_MATERIA_OFFSET+i+1,
      numero_edital, topico_central,
      comum: assuntoBNBEmComum(topico_central,m.tipo,numero_edital),
    })));
    return {materias,assuntos};
  })();
  return cached;
}
