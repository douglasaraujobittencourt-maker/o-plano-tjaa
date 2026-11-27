import {createFileRoute} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {BookOpenCheck} from "lucide-react";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Progress} from "@/components/ui/progress";
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from "@/components/ui/accordion";
import {BankExamSelector,useBankExam} from "@/components/bank-exam-provider";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {scopeLabel} from "@/lib/tribunal-catalog";
import {filteredEditalGroups,filteredEditalDetails,strictMarkedDetails} from "@/lib/edital-view-filter";
import {originFromDetails} from "@/lib/tjgo-edital-audit";
import {incidencePresentation} from "@/lib/edital-incidence";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});

function EditalPage(){
 const {bank}=useBankExam();
 const [search,setSearch]=useState("");
 const catalog=useQuery({queryKey:["edital-catalog"],queryFn:getEditalCatalog,staleTime:0,refetchInterval:5000});
 const progress=useQuery({queryKey:["edital-auto-progresso"],queryFn:getEtapasAutomaticasEdital,refetchInterval:10000,refetchOnWindowFocus:true});
 const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const query=normalize(search.trim());
 const groups=(catalog.data?filteredEditalGroups(catalog.data,bank):[]).map(g=>{
  const topics=g.all.filter(a=>!query||normalize(g.m.titulo_central+" "+a.topico_central+" "+(a.originalTitle??"")).includes(query));
  return {...g,topics};
 }).filter(g=>g.topics.length>0);
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
  <header><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpenCheck className="text-primary"/> Edital Verticalizado</h1>
  <p className="text-sm text-muted-foreground">TJGO 2021 · Analista — Apoio Judiciário e Administrativo (prioridade) | TJDFT 2022 · Técnico — Área Administrativa.</p>
  <p className="text-xs text-muted-foreground">Referências históricas pré-edital. Leis revogadas e versões antigas constam para auditoria; estudar legislação vigente. A discursiva é um treino adicional, não conteúdo programático literal.</p></header>
  <BankExamSelector/>
  <p className="text-xs text-muted-foreground">{bank==="caixa"?"TJDFT: assuntos na sequência do edital.":bank==="bb"?"TJGO: assuntos na sequência do Anexo IV.":"TJGO: sequência do Anexo IV, seguida dos conteúdos exclusivos do TJDFT, sem duplicação."}</p>
  <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar matéria ou assunto..." aria-label="Buscar assuntos"/>
  <p className="text-sm text-muted-foreground">{new Set(groups.flatMap(g=>g.topics.map(a=>a.id))).size} assuntos distintos exibidos · referências compartilhadas com um único registro de progresso</p>
  {catalog.isPending&&<p>Carregando edital...</p>}{catalog.isError&&<p role="alert">Erro ao carregar o catálogo.</p>}
  {progress.isError&&<p role="alert" className="text-destructive text-sm">Não foi possível carregar o progresso. {String(progress.error)}</p>}
  <Accordion type="multiple" className="space-y-3">
   {groups.map(({m,all,topics,progressRows})=>{const count=progressRows.filter(a=>etapaDoAssunto(progress.data??{},a.id)!=="Pendente").length;
    return <AccordionItem key={m.numero} value={String(m.numero)} className="rounded-xl border bg-card px-4">
     <AccordionTrigger className="hover:no-underline"><div className="w-full text-left pr-4">
     <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.titulo_central}</span><span className="text-xs text-muted-foreground">{count}/{progressRows.length}</span></div>
     <div className="text-xs text-muted-foreground">{m.ciclo==="Ciclo 1"?"Ciclo inicial":"Fila de espera"} · {scopeLabel(m.escopo)}</div><Progress className="mt-2 h-1" value={progressRows.length?100*count/progressRows.length:0}/></div></AccordionTrigger>
     <AccordionContent>{!all.length&&<p className="text-xs text-muted-foreground py-2">Nenhum assunto cadastrado. Adicione assuntos em Bora Estudar.</p>}{m.numero===205&&<p className="text-xs text-muted-foreground py-2">{bank==="bnb"?"A Constituição do Estado de Goiás também integra esta disciplina; consulte sua linha única em Direito Constitucional.":"A Constituição do Estado de Goiás aparece nas duas disciplinas do Anexo IV. A referência abaixo usa o mesmo ID e não cria outro registro de progresso."}</p>}<ul className="divide-y divide-border/60">
      {topics.map(a=>{
       const scope=a.reference?"Referência oficial compartilhada":a.custom?"Personalizado":a.supplemental?`Complemento TJGO · ${scopeLabel(a.escopo)}`:scopeLabel(a.escopo);
       const rawDetails=filteredEditalDetails(m.numero,a,m.titulo_central,bank);
       const details=rawDetails;
       const marked= strictMarkedDetails(m.numero,a,details);
       const origin=originFromDetails(marked);
       const marker=origin?incidencePresentation[origin]:null;
       const note=a.missingRegistration?"Item oficial sem cadastro ativo nesta conta; histórico vinculado ao ID original.":a.originalTitle?"Título personalizado preservado no cadastro: "+a.originalTitle:a.reference?"Mesmo registro de Direito Constitucional.":a.supplemental?"Não é item expresso no programa TJGO de 2021.":undefined;
       return <li key={a.id} className="flex flex-wrap justify-between gap-2 py-3">
        <div className="min-w-[min(180px,100%)] flex-1">
         <p className={marker?`text-sm font-semibold ${marker.text}`:"text-sm"}>{a.topico_central}{marker&&<span className={`ml-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${marker.badge}`}>{marker.label}</span>}</p>
         <Badge variant="outline" className="mt-1">{scope}</Badge>
         {note&&<p className="mt-1 text-xs text-muted-foreground">{note}</p>}
         {details.length>0&&<details className="mt-2 text-xs"><summary className="cursor-pointer font-medium text-muted-foreground">Temas e subtópicos do mapa de incidência</summary>
          <div className="mt-2 space-y-2">{details.map(d=>{
           const themeOrigin=originFromDetails(details.filter(x=>x.sourceMatter===d.sourceMatter&&x.theme===d.theme));
           const themeMarker=themeOrigin?incidencePresentation[themeOrigin]:null;
           return <div key={d.key} className="rounded-md border p-2">
           {d.sourceMatter!==m.numero&&<p className="text-muted-foreground">Referência de Legislação Complementar</p>}
           <p className={themeMarker?`font-semibold ${themeMarker.text}`:"font-semibold"}>{d.theme} · {d.approximate?"≈ ":""}{d.percent}% do tema{themeMarker&&<span className={`ml-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${themeMarker.badge}`}>{themeMarker.label}</span>}</p>
           {d.subtopics.map(s=>{
            const subOrigin=originFromDetails(details.filter(x=>x.sourceMatter===d.sourceMatter&&x.subtopics.some(y=>y.title===s.title)));
            const subMarker=subOrigin?incidencePresentation[subOrigin]:null;
            return <div key={s.key} className="mt-2"><p className={subMarker?`font-medium ${subMarker.text}`:"font-medium"}>{s.title}{subMarker&&<span className={`ml-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${subMarker.badge}`}>{subMarker.label}</span>}</p><p className="text-muted-foreground">{s.description}</p></div>;
           })}
          </div>})}</div>
         </details>}
        </div>
        <span className="text-xs text-muted-foreground">{progress.isError?"Indisponível":etapaDoAssunto(progress.data??{},a.id)}</span>
       </li>;
      })}
     </ul></AccordionContent>
    </AccordionItem>})}
  </Accordion>
  {!catalog.isPending&&!groups.length&&<Card className="p-4 text-sm text-muted-foreground">Nenhum assunto encontrado.</Card>}
 </main>;
}
