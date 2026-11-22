import { idCanonicoAssunto } from "@/lib/edital-topic-equivalence";
import type { Catalog, Materia, Assunto } from "@/lib/edital-caixa-bb-data";
import type { BnbCatalog } from "@/lib/edital-bnb-data";

/** Fonte única de identificação das três provas. Os registros oficiais não são modificados. */
export type BankExam = "bb" | "caixa" | "bnb";
export const BANK_LABELS: Record<BankExam, string> = {
  bb: "Banco do Brasil", caixa: "Caixa", bnb: "BNB",
};
export const BANK_OPTIONS: BankExam[] = ["bb", "caixa", "bnb"];

export const bankMatterAllowed = (numero: number, escopo: string, banco: BankExam) => {
  if (banco === "bnb") return numero >= 101 && numero <= 103;
  if (numero >= 100) return false;
  return banco === "bb" ? escopo !== "Só Caixa" : escopo !== "Só BB";
};
export const bankTopicAllowed = (assunto: Pick<Assunto, "escopo">, banco: BankExam) =>
  banco === "bb" ? assunto.escopo !== "Só Caixa"
    : banco === "caixa" ? assunto.escopo !== "Só BB" : false;

const normalize = (nome: string) => nome.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/^[0-9]+[.\s-]+/, "").replace(/[^a-z0-9]+/g, " ").trim()
  .replace(/\s+/g, " ");

/** Correspondência determinística de nomes de matérias cadastradas com os editais. */
const ALIASES: Record<string, Partial<Record<BankExam, number>>> = {
  "portugues": {bb:2,caixa:2,bnb:101},
  "lingua portuguesa": {bb:2,caixa:2,bnb:101},
  "conhecimentos bancarios": {bb:1,caixa:1,bnb:103},
  "conhecimentos do nordeste": {bnb:103},
  "conhecimentos sobre o nordeste": {bnb:103},
  "atualidades do mercado financeiro": {bb:1},
  "atendimento bancario": {caixa:4},
  "vendas e negociacao": {bb:4},
  "atendimento bancario vendas e negociacao": {bb:4,caixa:4},
  "matematica financeira": {bb:3,caixa:3,bnb:102},
  "matematica": {bb:10,bnb:102},
  "matematica raciocinio logico e quantitativo": {bnb:102},
  "raciocinio logico": {bnb:102},
  "raciocinio logico e quantitativo": {bnb:102},
  "probabilidade": {caixa:7,bnb:102},
  "probabilidade e estatistica": {caixa:7},
  "nocoes de probabilidade e estatistica": {caixa:7},
  "estatistica": {caixa:7},
  "lingua inglesa": {bb:6,caixa:6},
  "ingles": {bb:6,caixa:6},
  "conhecimentos de tecnologia da informacao e comunicacao": {caixa:5},
  "tecnologia da informacao": {bb:5,caixa:5},
  "conhecimentos de informatica": {bb:5},
  "informatica": {bb:5},
  "conhecimentos e comportamentos digitais": {caixa:8},
  "comportamentos digitais": {caixa:8},
  "comportamentos eticos e compliance": {caixa:9},
  "etica e compliance": {caixa:9},
  "compliance": {caixa:9},
};

export function subjectMatterNumber(name: string, banco: BankExam): number | null {
  const normalized = normalize(name);
  if (normalized.startsWith("bnb ")) {
    if (banco !== "bnb") return null;
    return ALIASES[normalized.slice(4)]?.bnb ?? null;
  }
  return ALIASES[normalized]?.[banco] ?? null;
}
export const subjectBelongsToBank = (name: string, banco: BankExam) =>
  subjectMatterNumber(name, banco) !== null;

export function bankMatterNumbers(banco: BankExam, catalog: Catalog | undefined, bnb: BnbCatalog | undefined): number[] {
  if (banco === "bnb") return (bnb?.materias ?? []).map(m => m.numero);
  return (catalog?.materias ?? []).filter(m => bankMatterAllowed(m.numero, m.escopo, banco))
    .map(m => m.numero);
}

export function bankTopicsForMatter(
  numero: number, banco: BankExam, catalog: Catalog | undefined, bnb: BnbCatalog | undefined,
) {
  if (banco === "bnb") return (bnb?.assuntos ?? []).filter(a => a.materia_numero === numero);
  return (catalog?.assuntos ?? []).filter(a => a.materia_numero === numero && bankTopicAllowed(a, banco));
}

/** Compartilha progresso entre tópicos equivalentes pelo identificador canônico. */
export function subjectTopicIds(
  name: string, banco: BankExam, catalog: Catalog | undefined, bnb: BnbCatalog | undefined,
): number[] {
  const numero = subjectMatterNumber(name, banco);
  if (numero === null) return [];
  return [...new Set(bankTopicsForMatter(numero, banco, catalog, bnb).map(a => idCanonicoAssunto(a.id)))];
}
