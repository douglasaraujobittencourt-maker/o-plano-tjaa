/** Cores das bolinhas da Caixa, conforme a identidade visual adotada no Edital Verticalizado. */
export const CORES_CAIXA = {
  basica: "#0284C7",
  especifica: "#D97706",
} as const;

export function normalizarMateria(nome: string): string {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function categoriaMateriaCaixa(nome: string): "basica" | "especifica" {
  const n = normalizarMateria(nome);
  const especifica = n.includes("conhecimentos bancarios")
    || n.includes("atendimento bancario")
    || n.includes("vendas e negociacao")
    || /\btic\b/.test(n)
    || n.includes("informatica")
    || n.includes("conhecimentos e comportamentos digitais")
    || n.includes("comportamentos digitais");
  return especifica ? "especifica" : "basica";
}

/**
 * Aplica o azul/laranja às matérias conhecidas da Caixa inclusive quando
 * o nome não começa com "CAIXA:" (como ocorre no Dashboard).
 * Não altera cores de matérias alheias ao edital ou explicitamente "BB:".
 */
/** Detecta matérias da Caixa pelo nome, sem alterar disciplinas explicitamente do BB. */
export function corCaixaParaMateria(nome: string): string | null {
  const n = normalizarMateria(nome);
  if (/^(?:bb|banco do brasil|bnb|banco do nordeste)(?:\s|$)/.test(n) && !n.includes("caixa")) return null;

  const identificadores = [
    "lingua portuguesa", "portugues", "matematica financeira",
    "lingua inglesa", "ingles", "probabilidade e estatistica",
    "matematica", "comportamentos eticos", "compliance",
    "conhecimentos bancarios", "atendimento bancario", "vendas e negociacao",
    "informatica", "tecnologia da informacao", "tic",
    "conhecimentos e comportamentos digitais", "comportamentos digitais",
  ];
  if (/^caixa(?:\s|$)/.test(n) ||
      identificadores.some(v => n === v || n.includes(v))) {
    return CORES_CAIXA[categoriaMateriaCaixa(nome)];
  }
  return null;
}

/** Cores fixas das matérias do Banco do Nordeste, inclusive as já cadastradas. */
export function corBnbParaMateria(nome: string): string | null {
  const n = normalizarMateria(nome);
  if (!/^(?:bnb|banco do nordeste)(?:\s|$)/.test(n)) return null;
  return n.includes("conhecimentos bancarios") ? "#FB923C" : "#DC2626";
}

export function corBolinhaVisaoGeral(
  nome: string | null | undefined,
  corCadastrada: string | null | undefined,
): string {
  return (nome ? corBnbParaMateria(nome) ?? corCaixaParaMateria(nome) : null)
    ?? corCadastrada ?? CORES_CAIXA.basica;
}
