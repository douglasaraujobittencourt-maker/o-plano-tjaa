import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CircleHelp, Search } from "lucide-react";
import { getEditalCatalog } from "@/lib/edital-catalog";
import { getProfile } from "@/lib/planner-api";
import { ProfileMenu } from "@/components/profile-menu";
import { BankExamSelector, useBankExam } from "@/components/bank-exam-provider";
import { montarMateriasTresBancos, filtrarMateriasTresBancos } from "@/lib/edital-three-banks";
import { EditalTresBancos } from "@/components/edital-three-banks";
import { loadBnbCatalog, corMateriaBnb } from "@/lib/edital-bnb-data";
import { CORES_CAIXA, categoriaMateriaCaixa } from "@/lib/caixa-subject-colors";
import { etapaDoAssunto, getEtapasAutomaticasEdital, type EtapaEdital } from "@/lib/edital-auto-progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/app/edital")({
  head: () => ({
    meta: [
      { title: "Edital Verticalizado — BB, Caixa e BNB | O Plano" },
      { name: "description", content: "Matérias e assuntos de BB, Caixa e BNB integrados, com evolução vinculada ao planner." },
      { property: "og:title", content: "Edital Verticalizado — BB, Caixa e BNB | O Plano" },
      { property: "og:description", content: "Matérias e assuntos de BB, Caixa e BNB integrados, com evolução vinculada ao planner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditalPage,
});

type Escopo = "Todos" | "Todos os bancos" | "Comum (Caixa + BB)" | "BB + BNB" | "Caixa + BNB" | "Só Caixa" | "Só BB" | "Só BNB";
const escopos: { key: Exclude<Escopo, "Todos">; label: string; styles: string }[] = [
  { key: "Todos os bancos", label: "BB + Caixa + BNB", styles: "border-primary/50 bg-primary/10 text-foreground" },
  { key: "Comum (Caixa + BB)", label: "BB + Caixa", styles: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" },
  { key: "BB + BNB", label: "BB + BNB", styles: "border-yellow-500/40 bg-yellow-500/10 text-foreground" },
  { key: "Caixa + BNB", label: "Caixa + BNB", styles: "border-sky-500/40 bg-sky-500/10 text-foreground" },
  { key: "Só Caixa", label: "Caixa", styles: "border-[#0284C7]/40 bg-[#0284C7]/10 text-[#075985] dark:text-[#7DD3FC]" },
  { key: "Só BB", label: "BB", styles: "border-yellow-400/40 bg-yellow-400/10 text-yellow-800 dark:text-yellow-300" },
  { key: "Só BNB", label: "BNB", styles: "border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400" },
];

// Caixa: tons da paleta de matérias do Dashboard inicial.
// BB: azul e amarelo definidos pela identidade do Banco do Brasil.
const CORES_EDITAIS = {
  caixa: CORES_CAIXA,
  bb: { basica: "#0219c5", especifica: "#F7D200" },
} as const;

function materiaEspecifica(titulo: string) {
  const nome = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const especifica = nome.includes("conhecimentos bancarios")
    || nome.includes("atendimento bancario")
    || nome.includes("vendas e negociacao")
    || /\btic\b/.test(nome)
    || nome.includes("informatica")
    || nome.includes("conhecimentos e comportamentos digitais")
    || nome.includes("comportamentos digitais");
  return especifica;
}

// O filtro Caixa/BB inclui tanto os assuntos comuns como os exclusivos daquele banco.
function pertenceAoFiltro(escopoAssunto: string, filtro: Escopo) {
  if (filtro === "Só BNB") return false;
  if (filtro === "Todos" || filtro === "Todos os bancos") return true;
  if (filtro === "BB + BNB") return escopoAssunto !== "Só Caixa";
  if (filtro === "Caixa + BNB") return escopoAssunto !== "Só BB";
  if (filtro === "Comum (Caixa + BB)") return true; // Visão unificada: todas as matérias equivalentes e seus assuntos, sem limitar aos comuns.
  if (filtro === "Só Caixa") return escopoAssunto === "Comum (Caixa + BB)" || escopoAssunto === "Só Caixa";
  return escopoAssunto === "Comum (Caixa + BB)" || escopoAssunto === "Só BB";
}

// Preserva exatamente a nomenclatura original de cada edital; não renomeia os registros.
// Aceita matéria (titulo_central) e assunto (topico_central) sem renomear nada.
type NomeDoEdital = {
  titulo_central?: string;
  topico_central?: string;
  nomenclatura_caixa?: string;
  nomenclatura_bb?: string;
};
function centralDoEdital(item: NomeDoEdital) {
  return (item.titulo_central ?? item.topico_central)?.trim() || "Assunto sem título";
}
function nomeNoEdital(item: NomeDoEdital, filtro: Escopo) {
  const central = centralDoEdital(item);
  // A nomenclatura oficial pode ser vazia ou só conter referência ao edital.
  const nomeCaixa = item.nomenclatura_caixa?.trim();
  const nomeBB = item.nomenclatura_bb?.trim();
  if (filtro === "Só Caixa") return nomeCaixa && nomeCaixa !== "—" ? nomeCaixa : central;
  if (filtro === "Só BB") return nomeBB && nomeBB !== "—" ? nomeBB : central;
  return central;
}

function NomesDosEditais({ item, filtro }: { item: NomeDoEdital; filtro: Escopo }) {
  // A lista sempre mostra o título principal do assunto: evita linhas vazias
  // caso nomenclaturas oficiais estejam ausentes ou sejam metadados do edital.
  const nome = nomeNoEdital(item, filtro).replace(/^\s*\d+\.\s*/, "");
  const central = centralDoEdital(item).replace(/^\s*\d+\.\s*/, "");
  const exibirCentral = filtro === "Comum (Caixa + BB)" || filtro === "Todos" || filtro === "Todos os bancos";
  return <>{(exibirCentral ? central : nome) || central}</>;
}

// A nomenclatura oficial é preservada integralmente no catálogo do Supabase.
// A lista usa um único título legível para cada assunto, sem duplicar o índice.

function IndicadoresEditais({ titulo, escopo, filtro }: {
  titulo: string;
  escopo: string;
  filtro: Escopo;
}) {
  const categoria = materiaEspecifica(titulo) ? "especifica" : "basica";
  // O filtro escolhido prevalece sobre o escopo cadastrado na matéria.
  // Sem filtro, cada linha respeita o escopo do próprio assunto.
  const exibicao = (filtro === "Todos" || filtro === "Todos os bancos") ? escopo : filtro;
  const mostrarCaixa = exibicao === "Comum (Caixa + BB)" || exibicao === "Só Caixa";
  const mostrarBB = exibicao === "Comum (Caixa + BB)" || exibicao === "Só BB";
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" role="img"
      aria-label={mostrarCaixa && mostrarBB ? "Cores Caixa e Banco do Brasil" : mostrarCaixa ? "Cor Caixa" : "Cor Banco do Brasil"}>
      {mostrarCaixa && <span title="Caixa" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CORES_CAIXA[categoriaMateriaCaixa(titulo)] }} />}
      {mostrarBB && <span title="Banco do Brasil" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CORES_EDITAIS.bb[categoria] }} />}
    </span>
  );
}

const statusStyles: Record<EtapaEdital,string> = {
  "Pendente": "border-border bg-muted/40 text-muted-foreground",
  "Teoria": "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Revisão 7D": "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Revisão 15D": "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Revisão 30D": "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  "Revisão 60D": "border-primary/40 bg-primary/10 text-foreground",
  "Concluído": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function EscopoBadge({ escopo }: { escopo: string }) {
  const item = escopos.find(e => e.key === escopo);
  return (
    <Badge variant="outline" className={"pointer-events-none shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " + (item?.styles ?? "border-border text-muted-foreground")}>
      {item?.label ?? escopo}
    </Badge>
  );
}

function EditalPage() {
  const { bank } = useBankExam();
  const [escopo, setEscopo] = useState<Escopo>("Todos os bancos");
  // A seleção feita nos quadros de progresso acompanha o usuário nesta aba.
  useEffect(() => {
    setEscopo(bank === "bb" ? "Só BB" : bank === "caixa" ? "Só Caixa" : "Só BNB");
  }, [bank]);
  const [busca, setBusca] = useState("");
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const nomePerfil = profile?.display_name?.trim() ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] || "Estudante";
  const catalogQuery = useQuery({ queryKey: ["edital-catalog"], queryFn: getEditalCatalog, staleTime: 60_000 });
  const bnbQuery = useQuery({ queryKey: ["edital-bnb-catalog"], queryFn: loadBnbCatalog, staleTime: Infinity });
  const etapasQuery = useQuery({
    queryKey: ["edital-auto-progresso"],
    queryFn: getEtapasAutomaticasEdital,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
  const catalog = catalogQuery.data;
  const bnb = bnbQuery.data;
  // O catálogo continua visível mesmo se o progresso não puder ser consultado.
  const etapas = etapasQuery.data ?? {};
  const all = catalog?.assuntos ?? [];
  const needle = busca.trim().toLocaleLowerCase("pt-BR");
  const allDoFiltro = all.filter(a => pertenceAoFiltro(a.escopo, escopo));
  const filtered = allDoFiltro.filter(a => {
    if (!needle) return true;
    const m = catalog?.materias.find(m => m.numero === a.materia_numero);
    return [nomeNoEdital(a, escopo), m ? nomeNoEdital(m, escopo) : "", a.topico_central, m?.titulo_central ?? "", a.nomenclatura_caixa, a.nomenclatura_bb, m?.nomenclatura_caixa ?? "", m?.nomenclatura_bb ?? ""]
      .some(nome => nome.toLocaleLowerCase("pt-BR").includes(needle));
  });
  const bnbAll = bnb?.assuntos ?? [];
  const bnbFiltrados = bnbAll.filter(a => {
    if (!needle) return true;
    const materia = bnb?.materias.find(m => m.numero === a.materia_numero);
    return a.topico_central.toLocaleLowerCase("pt-BR").includes(needle)
      || a.numero_edital.includes(needle)
      || !!materia?.titulo_central.toLocaleLowerCase("pt-BR").includes(needle);
  });
  const gruposBnb = (bnb?.materias ?? []).map(m => ({
    materia: m,
    todos: bnbAll.filter(a => a.materia_numero === m.numero),
    assuntos: bnbFiltrados.filter(a => a.materia_numero === m.numero),
  })).filter(g => g.assuntos.length > 0);
  const grupos = [...(catalog?.materias ?? [])].sort((a,b) => a.numero-b.numero)
    .map(m => ({
      materia: m,
      todos: allDoFiltro.filter(a => a.materia_numero === m.numero),
      assuntos: filtered.filter(a => a.materia_numero === m.numero).sort((a,b) => a.ordem_exibicao-b.ordem_exibicao),
    }))
    .filter(g => g.assuntos.length > 0);

  // Os IDs dos registros-fonte são preservados; a unificação agrupa apenas
  // tópicos equivalentes, sem depender de uma contagem fixa do catálogo.
  const visaoComBNB = ["Todos os bancos", "BB + BNB", "Caixa + BNB"].includes(escopo);
  const gruposUnificados = [
    ...(escopo !== "Só BNB"
      ? grupos.map(g => ({...g, tipo: "bbcaixa" as const, posicao: g.materia.numero * 10}))
      : []),
    ...((escopo === "Só BNB" || visaoComBNB)
      ? gruposBnb.map(g => ({
          ...g,
          tipo: "bnb" as const,
          posicao: escopo === "Só BNB"
            ? (g.materia.numero - 100) * 10
            : g.materia.numero === 103 ? 11 : g.materia.numero === 101 ? 21 : 31,
        }))
      : []),
  ].sort((a,b) => a.posicao-b.posicao);
  const bancosSelecionados = escopo === "BB + BNB" ? {bb:true,caixa:false,bnb:true}
    : escopo === "Caixa + BNB" ? {bb:false,caixa:true,bnb:true}
    : {bb:true,caixa:true,bnb:true};
  const catalogoPronto = escopo === "Só BNB" ? !!bnb : !!catalog && (!visaoComBNB || !!bnb);
  const gruposTresBancos = useMemo(
    () => catalog && bnb ? montarMateriasTresBancos(catalog, bnb) : [],
    [catalog, bnb],
  );
  const unificadosTotais = filtrarMateriasTresBancos(gruposTresBancos, "", bancosSelecionados);
  const unificadosFiltrados = filtrarMateriasTresBancos(gruposTresBancos, busca, bancosSelecionados);
  const totalUnificados = unificadosTotais.reduce((n, grupo) => n + grupo.assuntos.length, 0);
  const unificadosVisiveis = unificadosFiltrados.reduce((n, grupo) => n + grupo.assuntos.length, 0);
  const registrosFonte = unificadosTotais.reduce((n, grupo) =>
    n + grupo.assuntos.reduce((total, assunto) => total + assunto.referencias.length, 0), 0);

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
      <header className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <h1 className="flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            <BookOpenCheck className="h-6 w-6 shrink-0 text-primary" /> Edital Verticalizado
          </h1>
          <div className="hidden shrink-0 md:block">
            <ProfileMenu name={nomePerfil} src={profile?.avatar_url} />
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="max-w-full rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-medium leading-relaxed text-muted-foreground">Somente leitura · sincronizado com o planner</span>
        </div>
        <p className="text-sm text-muted-foreground">Caixa, Banco do Brasil e BNB · Acompanhe sua evolução pelo Bora Estudar e pelas Revisões.</p>
      </header>

      <BankExamSelector />
      <Card className="rounded-2xl border-border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-muted-foreground">Escopo:</span>
          {escopos.map(item =>
            <button key={item.key} type="button" aria-pressed={escopo === item.key}
              onClick={() => setEscopo(item.key)}
              className={"rounded-full border px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85 " + item.styles + (escopo === item.key ? " ring-2 ring-primary/50 ring-offset-1 ring-offset-background" : "")}>
              {item.label}
            </button>
          )}
          <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 text-right text-[11px] tabular-nums text-muted-foreground">
            {escopo === "Só BNB" ? (
              <span>{bnbFiltrados.length} de {bnbAll.length} assuntos</span>
            ) : visaoComBNB ? (
              catalog && bnb ? (
                <>
                  <span>{unificadosVisiveis} de {totalUnificados} assuntos unificados</span>
                  <span>{registrosFonte} registros-fonte</span>
                </>
              ) : <span>Carregando contagens...</span>
            ) : (
              <span>{filtered.length} de {allDoFiltro.length} assuntos</span>
            )}
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar matéria ou assunto..." aria-label="Buscar matérias ou assuntos"
            className="h-9 bg-background pl-9 text-sm" />
        </div>
      </Card>

      {catalogQuery.isPending && <Card className="p-6 text-sm text-muted-foreground">Carregando as matérias e assuntos do edital...</Card>}
      {catalogQuery.isError && <Card className="p-6 text-sm text-destructive">Não foi possível carregar o catálogo do edital.</Card>}
      {etapasQuery.isPending && <p className="text-xs text-muted-foreground">Consultando sessões e revisões do planner...</p>}
      {etapasQuery.isError && <Card className="p-4 text-sm text-destructive" role="alert">{etapasQuery.error instanceof Error ? etapasQuery.error.message : "Falha ao sincronizar as etapas do edital."}</Card>}

      {(escopo === "Só BNB" || visaoComBNB) && bnbQuery.isPending && (
        <Card className="p-5 text-sm text-muted-foreground">
          Carregando as matérias e os assuntos do BNB...
        </Card>
      )}
      {(escopo === "Só BNB" || visaoComBNB) && bnbQuery.isError && (
        <Card className="p-5 text-sm text-destructive" role="alert">
          Não foi possível carregar o catálogo do BNB. Os assuntos do BNB não serão omitidos silenciosamente.
        </Card>
      )}
      {visaoComBNB && catalog && bnb && (
        <EditalTresBancos bbCaixa={catalog} bnb={bnb} etapas={etapas} busca={busca} selecionados={bancosSelecionados}/>
      )}
      {!visaoComBNB && catalogoPronto && (
        <Accordion type="multiple" className="space-y-2.5">
          {gruposUnificados.map(grupo => {
            if (grupo.tipo === "bnb") {
              const { materia, todos, assuntos } = grupo;
            const iniciados = todos.filter(a=>etapaDoAssunto(etapas,a.id)!=="Pendente").length;
            const progresso = todos.length ? Math.round(iniciados/todos.length*100) : 0;
            return (
              <AccordionItem key={materia.numero} value={"bnb-"+materia.numero}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <AccordionTrigger className="gap-3 px-4 py-4 hover:no-underline sm:px-5 [&>svg]:h-4 [&>svg]:w-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:corMateriaBnb(materia.categoria)}}/>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground sm:text-base"><span className="mr-1 text-xs font-semibold text-red-600 dark:text-red-400">BNB ·</span> {materia.titulo_central}</span>
                        <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">{iniciados}/{todos.length} assuntos</span>
                      </div>
                      <Progress value={progresso} className="mt-2 h-1"/>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/70 px-3 pb-2 pt-1 sm:px-4">
                  <ul className="divide-y divide-border/50">
                    {assuntos.map(a => {
                      const etapa = etapaDoAssunto(etapas,a.id);
                      return (
                        <li key={a.id} className="flex min-w-0 flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 flex-1 items-start gap-2.5">
                            <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:corMateriaBnb(materia.categoria)}}/>
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <span className="block break-words text-sm font-medium leading-relaxed text-foreground">
                                <span className="mr-1.5 font-mono text-xs text-muted-foreground">{a.numero_edital}</span>{a.topico_central}
                              </span>
                              <Badge variant="outline" className={"pointer-events-none w-fit rounded-full px-2 py-0.5 text-[10px] "+
                                (a.comum?"border-emerald-500/30 text-emerald-600 dark:text-emerald-400":"border-red-500/30 text-red-600 dark:text-red-400")}>
                                {a.comum ? "Em comum com BB/Caixa" : "Específico do BNB"}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className={"pointer-events-none w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold "+statusStyles[etapa]}>
                            {etapa}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
            }
            const { materia, todos, assuntos } = grupo;
            const iniciados = todos.filter(a => etapaDoAssunto(etapas,a.id) !== "Pendente").length;
            const pct = todos.length ? Math.round(iniciados/todos.length*100) : 0;
            return (
              <AccordionItem key={materia.numero} value={String(materia.numero)}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <AccordionTrigger className="gap-3 px-4 py-4 hover:no-underline sm:px-5 [&>svg]:h-4 [&>svg]:w-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <IndicadoresEditais titulo={materia.titulo_central} escopo={assuntos.some(a => a.escopo === "Comum (Caixa + BB)") ? "Comum (Caixa + BB)" : materia.escopo} filtro={escopo} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground sm:text-base">{materia.numero}. <NomesDosEditais item={materia} filtro={escopo} /></span>
                        <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground">{iniciados}/{todos.length} assuntos</span>
                      </div>
                      <Progress value={pct} className="mt-2 h-1" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/70 px-3 pb-2 pt-1 sm:px-4">
                  <ul className="divide-y divide-border/50">
                    {assuntos.map(a => {
                      const etapa = etapaDoAssunto(etapas,a.id);
                      return (
                        <li key={a.id} className="flex min-w-0 flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          <div className="flex min-w-0 flex-1 items-center gap-2.5">
                            <IndicadoresEditais titulo={materia.titulo_central} escopo={a.escopo} filtro={escopo} />
                            <span className="min-w-0 flex-1 break-words text-sm font-medium leading-relaxed text-foreground">{(escopo === "Só Caixa" || escopo === "Só BB" ? nomeNoEdital(a, escopo) : a.topico_central?.trim()) || a.topico_central?.trim() || "Assunto sem título"}</span>
                            <EscopoBadge escopo={a.escopo} />
                          </div>
                          <Badge variant="outline" className={"pointer-events-none w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold " + statusStyles[etapa]}>
                            {etapa}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          {!gruposUnificados.length && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum assunto encontrado neste filtro.</Card>}
        </Accordion>
      )}
      {catalogoPronto && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          As etapas avançam apenas quando você vincula um assunto no Bora Estudar e conclui suas revisões. Os registros antigos sem assunto identificado não são atribuídos automaticamente.
        </p>
      )}
    </main>
  );
}
