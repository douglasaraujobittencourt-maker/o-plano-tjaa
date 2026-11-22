import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Catalog } from "@/lib/edital-caixa-bb-data";
import type { BnbCatalog } from "@/lib/edital-bnb-data";
import { corMateriaBnb } from "@/lib/edital-bnb-data";
import { CORES_CAIXA } from "@/lib/caixa-subject-colors";
import { etapaDoAssunto, type EtapaEdital, type EtapasEdital } from "@/lib/edital-auto-progress";
import {
  montarMateriasTresBancos, filtrarMateriasTresBancos,
  type RefAssuntoTresBancos,
} from "@/lib/edital-three-banks";

const CORES_BB = { basica: "#0219c5", especifica: "#F7D200" } as const;

const statusStyles: Record<EtapaEdital, string> = {
  "Pendente": "border-border bg-muted/40 text-muted-foreground",
  "Teoria": "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "Revisão 7D": "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Revisão 15D": "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Revisão 30D": "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  "Revisão 60D": "border-primary/40 bg-primary/10 text-foreground",
  "Concluído": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const ORDEM: EtapaEdital[] = [
  "Pendente", "Teoria", "Revisão 7D", "Revisão 15D", "Revisão 30D", "Revisão 60D", "Concluído",
];

function bancosDoAssunto(referencias: RefAssuntoTresBancos[]) {
  return {
    caixa: referencias.some(r => r.origem === "caixa-bb" && r.escopo !== "Só BB"),
    bb: referencias.some(r => r.origem === "caixa-bb" && r.escopo !== "Só Caixa"),
    bnb: referencias.some(r => r.origem === "bnb"),
  };
}

function Dots({ tipo, bancos }: {
  tipo: "basica" | "especifica";
  bancos: {caixa: boolean; bb: boolean; bnb: boolean};
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" role="img"
      aria-label={[bancos.caixa && "Caixa", bancos.bb && "BB", bancos.bnb && "BNB"].filter(Boolean).join(", ")}>
      {bancos.caixa && <span title="Caixa" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: CORES_CAIXA[tipo]}}/>}
      {bancos.bb && <span title="Banco do Brasil" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: CORES_BB[tipo]}}/>}
      {bancos.bnb && <span title="Banco do Nordeste" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor: corMateriaBnb(tipo)}}/>}
    </span>
  );
}

function RotuloBancos({ bancos }: {bancos: {caixa: boolean; bb: boolean; bnb: boolean}}) {
  const rotulo = [bancos.bb && "BB", bancos.caixa && "Caixa", bancos.bnb && "BNB"]
    .filter(Boolean).join(" + ");
  return (
    <Badge variant="outline" className="pointer-events-none shrink-0 rounded-full border-primary/20 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {rotulo}
    </Badge>
  );
}

function StatusAssunto({ referencias, etapas }: {
  referencias: RefAssuntoTresBancos[];
  etapas: EtapasEdital;
}) {
  const etapasRef = referencias.map(ref => etapaDoAssunto(etapas, ref.id));
  const diferentes = new Set(etapasRef).size > 1;
  const indiceMin = Math.min(...etapasRef.map(e => ORDEM.indexOf(e)));
  const etapa = ORDEM[indiceMin] ?? "Pendente";
  const temBnb = referencias.some(r => r.origem === "bnb");
  const temBbCaixa = referencias.some(r => r.origem === "caixa-bb");
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {diferentes && temBnb && temBbCaixa && (
        <span title="A evolução permanece vinculada aos registros originais de cada banco."
          className="text-[10px] text-muted-foreground">Etapas individuais</span>
      )}
      <Badge variant="outline" title={diferentes ? "Etapa menos avançada entre os registros oficiais deste assunto" : undefined}
        className={"pointer-events-none whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold " + statusStyles[etapa]}>
        {etapa}
      </Badge>
    </div>
  );
}

type BancosSelecionados = {bb:boolean;caixa:boolean;bnb:boolean};
export function EditalTresBancos({ bbCaixa, bnb, etapas, busca, selecionados = {bb:true,caixa:true,bnb:true} }: {
  bbCaixa: Catalog;
  bnb: BnbCatalog;
  etapas: EtapasEdital;
  busca: string;
  selecionados?: BancosSelecionados;
}) {
  const visiveis = filtrarMateriasTresBancos(
    montarMateriasTresBancos(bbCaixa, bnb), busca, selecionados,
  );

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Todas as matérias dos concursos selecionados estão incluídas. Tópicos equivalentes aparecem numa única linha, enquanto os exclusivos continuam identificados pelo banco.
      </p>
      <Accordion type="multiple" className="space-y-2.5">
        {visiveis.map(grupo => {
          const refsOriginais = grupo.assuntos.flatMap(a => a.referencias);
          const escopoMateria = bancosDoAssunto(refsOriginais);
          const bancosDaMateria = {
            bb: escopoMateria.bb && selecionados.bb,
            caixa: escopoMateria.caixa && selecionados.caixa,
            bnb: escopoMateria.bnb && selecionados.bnb,
          };
          const iniciados = refsOriginais.filter(ref =>
            etapaDoAssunto(etapas,ref.id) !== "Pendente").length;
          const totalVisivel = refsOriginais.length;
          const progresso = totalVisivel
            ? Math.round(iniciados / totalVisivel * 100) : 0;
          return (
            <AccordionItem key={grupo.area} value={grupo.area} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <AccordionTrigger className="gap-3 px-4 py-4 hover:no-underline sm:px-5 [&>svg]:h-4 [&>svg]:w-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Dots tipo={grupo.tipo} bancos={bancosDaMateria}/>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground sm:text-base">{grupo.titulo}</span>
                      <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-muted-foreground">
                        {iniciados}/{totalVisivel} registros
                      </span>
                    </div>
                    <Progress value={progresso} className="mt-2 h-1"/>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border/70 px-3 pb-2 pt-1 sm:px-4">
                <ul className="divide-y divide-border/50">
                  {grupo.assuntos.map(assunto => {
                    const origem = bancosDoAssunto(assunto.referencias);
                    const bancos = {bb:origem.bb&&selecionados.bb,caixa:origem.caixa&&selecionados.caixa,bnb:origem.bnb&&selecionados.bnb};
                    return (
                      <li key={assunto.key} className="flex min-w-0 flex-col gap-2 px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                          <Dots tipo={grupo.tipo} bancos={bancos}/>
                          <span className="min-w-0 flex-1 break-words text-sm font-medium leading-relaxed text-foreground">
                            {assunto.nome}
                          </span>
                          <RotuloBancos bancos={bancos}/>
                        </div>
                        <StatusAssunto referencias={assunto.referencias} etapas={etapas}/>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        {!visiveis.length && <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum assunto encontrado.</Card>}
      </Accordion>
    </div>
  );
}
