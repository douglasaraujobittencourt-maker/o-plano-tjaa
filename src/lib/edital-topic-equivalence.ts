/** Equivalências entre os 182 tópicos originais BB/Caixa e 126 tópicos BNB.
 * Auditoria dos Anexos IV (BNB 2024), IV (Caixa 2024) e III (BB 2022/001).
 *
 * O catálogo mantém os registros e IDs originais. Somente coincidências
 * temáticas revisadas manualmente usam o MESMO ID canônico no planner.
 * Sobreposições parciais (ex.: BNB 6.1 juros simples E compostos versus
 * dois assuntos separados) NÃO recebem equivalência automática.
 */
export const EQUIVALENCIAS_AUDITADAS = [
  { origem: 1001, canonico: 58, tema: "Compreensão e interpretação de textos" },
  { origem: 1003, canonico: 59, tema: "Ortografia oficial" },
  { origem: 1012, canonico: 63, tema: "Concordância nominal e verbal" },
  { origem: 1013, canonico: 64, tema: "Regência nominal e verbal" },
  { origem: 1014, canonico: 60, tema: "Crase" },
  { origem: 1015, canonico: 65, tema: "Colocação pronominal" },
  { origem: 1017, canonico: 72, tema: "Significação das palavras" },
  { origem: 1024, canonico: 182, tema: "Sistemas lineares" },
  { origem: 1032, canonico: 1, tema: "Sistema Financeiro Nacional" },
  { origem: 1087, canonico: 46, tema: "Sistema de Pagamentos Brasileiro" },
  { origem: 1109, canonico: 3, tema: "Bancos na era digital" },
  { origem: 1112, canonico: 5, tema: "Open Banking / Open Finance" },
  { origem: 1113, canonico: 6, tema: "Novos modelos de negócios" },
  { origem: 1114, canonico: 7, tema: "Fintechs, startups e big techs" },
  { origem: 1115, canonico: 8, tema: "Shadow banking" },
  { origem: 1116, canonico: 51, tema: "Funções da moeda" },
  { origem: 1117, canonico: 9, tema: "Blockchain, bitcoin e criptomoedas" },
  { origem: 1118, canonico: 52, tema: "Marketplace" },
  { origem: 1119, canonico: 10, tema: "Correspondentes bancários" },
  { origem: 1120, canonico: 53, tema: "Arranjos de pagamentos" },
  { origem: 1121, canonico: 11, tema: "PIX" },
  { origem: 1122, canonico: 54, tema: "Segmentação e interações digitais" },
  { origem: 1123, canonico: 12, tema: "Transformação digital no SFN" },
  { origem: 1124, canonico: 30, tema: "Lei Geral de Proteção de Dados" },
  { origem: 1125, canonico: 31, tema: "Legislação anticorrupção" },
  { origem: 1126, canonico: 32, tema: "Segurança cibernética" },
] as const;

const aliases = new Map<number,number>(
  EQUIVALENCIAS_AUDITADAS.map(e => [e.origem,e.canonico]),
);

export function idCanonicoAssunto(id: number): number {
  return aliases.get(id) ?? id;
}

export function idsOriginaisDoAssunto(id: number): number[] {
  const canonico = idCanonicoAssunto(id);
  return [canonico, ...EQUIVALENCIAS_AUDITADAS
    .filter(e => e.canonico === canonico).map(e => e.origem)];
}

export function equivalenciaAuditada(a: number, b: number): boolean {
  return idCanonicoAssunto(a) === idCanonicoAssunto(b);
}
