import {createFileRoute} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {BookOpenCheck,TrendingUp} from "lucide-react";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Progress} from "@/components/ui/progress";
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from "@/components/ui/accordion";
import {BankExamSelector,useBankExam} from "@/components/bank-exam-provider";
import {bankTopicAllowed,bankTopicsForMatter} from "@/lib/bank-exams";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {scopeLabel,topicOrderLabel} from "@/lib/tribunal-catalog";
import {incidencePresentation,normalizeIncidenceTitle,type IncidenceOrigin} from "@/lib/edital-incidence";
import {auditGoMatters,auditGoTopics,auditedTopicDetails,originFromDetails,goMatterOrder,type AuditTopic,type AuditDetail} from "@/lib/tjgo-edital-audit";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});

function IncidenceTag({origin}:{origin:IncidenceOrigin}){
 const marker=incidencePresentation[origin];
 return <span className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${marker.badge}`} title="Incidência registrada nos levantamentos de provas cadastrados"><span aria-hidden="true">↗</span>{marker.label}</span>;
}
function PriorityButton({active,onToggle}:{active:boolean;onToggle:()=>void}){
 return <Button type="button" size="sm" variant={active?"default":"outline"} aria-pressed={active} onClick={onToggle}><TrendingUp aria-hidden="true" className="h-4 w-4"/> Maior incidência</Button>;
}
function TopicRow({id,title,scope,status,origin,details,highlight,note}:{id:number;title:string;scope:string;status:string;origin:IncidenceOrigin|null;details:AuditDetail[];highlight:boolean;note?:string}){
 const [priority,setPriority]=useState(false);
 const marker=origin?incidencePresentation[origin]:null;
 const hasChildren=details.some(d=>d.subtopics.length>0);
 const hasHigh=details.some(d=>d.subtopics.some(s=>s.high));
 return <AccordionItem value={String(id)} role="listitem" className={`border-b-0 transition-colors ${highlight?"rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/60 px-2":""}`}>
  <AccordionTrigger className="gap-2 py-3 hover:no-underline">
   <span className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2 pr-1">
    <span className="min-w-[min(180px,100%)] flex-1">
     <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={marker?`text-sm font-semibold ${marker.text}`:"text-sm font-normal"}>{title}</span>
      {origin&&<IncidenceTag origin={origin}/>}
      {highlight&&<span className="inline-flex items-center gap-1 rounded-md border border-primary/60 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-foreground"><TrendingUp className="h-3 w-3" aria-hidden="true"/> Prioridade</span>}
     </span>
     <Badge variant="outline" className="mt-1">{scope}</Badge>{note&&<span className="block text-xs text-muted-foreground mt-1">{note}</span>}
    </span>
    <span className="text-xs font-normal text-muted-foreground">{status}</span>
   </span>
  </AccordionTrigger>
  <AccordionContent className="space-y-3 pb-3 pl-3 pr-1">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <span className="text-xs font-semibold text-muted-foreground">Subtópicos do mapa de incidência</span>
    <PriorityButton active={priority} onToggle={()=>setPriority(v=>!v)}/>
   </div>
   {!hasChildren&&<p className="text-xs text-muted-foreground" role="status">Não há subtópicos com incidência mapeada para este assunto.</p>}
   {hasChildren&&priority&&<p className="text-xs text-muted-foreground" role="status">{hasHigh?"Destaque pelo maior peso cadastrado de cada banca. Sem percentual individual, a prioridade usa o percentual do tema (empates mantidos); não indica frequência individual.":"Não há subtópicos de alta incidência mapeados para este assunto."}</p>}
   {details.map(detail=><div key={detail.key} className="rounded-md border bg-muted/20 p-3 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <span className="text-xs font-semibold">{detail.contextOnly?"Tema de origem: ":""}{detail.theme}</span>
     <span className="flex flex-wrap items-center gap-2"><IncidenceTag origin={detail.bank}/><span className="text-xs tabular-nums text-muted-foreground">Tema: {detail.approximate?"≈ ":""}{detail.percent}%</span></span>
    </div>
    {detail.subtopics.map(sub=>{
      const same=details.filter(d=>d.subtopics.some(s=>normalizeIncidenceTitle(s.title)===normalizeIncidenceTitle(sub.title)));
      const subOrigin=same.some(d=>d.bank==="verbena")&&same.some(d=>d.bank==="fgv")?"both":detail.bank;
      return <div key={sub.key} className={`rounded-md border-l-2 p-2 transition-colors ${priority&&sub.high?"border-primary bg-primary/10 ring-1 ring-inset ring-primary/40":"border-border"}`}>
       <div className="flex flex-wrap items-center gap-1.5"><span className={`text-sm font-semibold ${incidencePresentation[subOrigin].text}`}>{sub.title}</span><IncidenceTag origin={subOrigin}/>{priority&&sub.high&&<span className="text-xs font-semibold text-foreground">Prioridade</span>}</div>
       <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub.description}</p>
       {(sub.percent!=null||sub.questions!=null)&&<p className="mt-1 text-xs tabular-nums text-muted-foreground">{sub.percent!=null?`${detail.approximate?"≈ ":""}${sub.percent}% do subtópico`:""}{sub.percent!=null&&sub.questions!=null?" · ":""}{sub.questions!=null?`${detail.approximate?"≈ ":""}${sub.questions} questões`:""}</p>}
      </div>;
    })}
   </div>)}
  </AccordionContent>
 </AccordionItem>;
}
function EditalPage(){
 const {bank}=useBankExam();
 const [search,setSearch]=useState("");
 const [priorityByMatter,setPriorityByMatter]=useState<Record<number,boolean>>({});
 const catalog=useQuery({queryKey:["edital-catalog"],queryFn:getEditalCatalog,staleTime:0,refetchInterval:5000});
 const progress=useQuery({queryKey:["edital-auto-progresso"],queryFn:getEtapasAutomaticasEdital,refetchInterval:10000,refetchOnWindowFocus:true});
 const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const query=normalize(search.trim());
 const groups=(catalog.data?auditGoMatters(catalog.data,bank):[]).map(m=>{
  const go=bank!=="caixa"&&goMatterOrder.some(id=>id===m.numero);
  const all:AuditTopic[]=go?auditGoTopics(m.numero,catalog.data!,bank):bankTopicsForMatter(m.numero,bank,catalog.data);
  const topics=all.filter(a=>!query||normalize(m.titulo_central+" "+a.topico_central+" "+(a.originalTitle??"")).includes(query));
  // Referências repetidas no edital e complementos fora do programa não alteram a métrica original.
  const progressRows=bankTopicsForMatter(m.numero,bank,catalog.data);
  return {m,all,topics,progressRows};
 }).filter(g=>g.topics.length||(!query&&bankTopicAllowed(g.m,bank)&&!(catalog.data?.assuntos??[]).some(a=>a.materia_numero===g.m.numero)));
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
  <header><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpenCheck className="text-primary"/> Edital Verticalizado</h1>
  <p className="text-sm text-muted-foreground">TJGO 2021 · Analista — Apoio Judiciário e Administrativo (prioridade) | TJDFT 2022 · Técnico — Área Administrativa.</p>
  <p className="text-xs text-muted-foreground">Referências históricas pré-edital. Leis revogadas e versões antigas constam para auditoria; estudar legislação vigente. A discursiva é um treino adicional, não conteúdo programático literal.</p></header>
  <BankExamSelector/>
  <p className="text-xs text-muted-foreground">{bank==="caixa"?topicOrderLabel(bank):"TJGO: disciplinas e assuntos na sequência do Anexo IV; complementos e personalizados ao final. Incidência conforme levantamento aproximado, não previsão de prova."}</p>
  <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar matéria ou assunto..." aria-label="Buscar assuntos"/>
  <p className="text-sm text-muted-foreground">{groups.reduce((n,g)=>n+g.topics.length,0)} assuntos exibidos · tópicos comuns com um único registro de progresso</p>
  {catalog.isPending&&<p>Carregando edital...</p>}{catalog.isError&&<p role="alert">Erro ao carregar o catálogo.</p>}
  {progress.isError&&<p role="alert" className="text-destructive text-sm">Não foi possível carregar o progresso. {String(progress.error)}</p>}
  <Accordion type="multiple" className="space-y-3">
   {groups.map(({m,all,topics,progressRows})=>{const count=progressRows.filter(a=>etapaDoAssunto(progress.data??{},a.id)!=="Pendente").length;
    const priority=!!priorityByMatter[m.numero];
    const rows=topics.map(a=>{const details=auditedTopicDetails(m.numero,a.id,m.titulo_central,a.topico_central,bank);return {a,details,origin:originFromDetails(details)};});
    const hasHigh=rows.some(r=>r.details.some(d=>d.highTheme));
    return <AccordionItem key={m.numero} value={String(m.numero)} className="rounded-xl border bg-card px-4">
     <AccordionTrigger className="hover:no-underline"><div className="w-full text-left pr-4">
     <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.titulo_central}</span><span className="text-xs text-muted-foreground">{count}/{progressRows.length}</span></div>
     <div className="text-xs text-muted-foreground">{m.ciclo==="Ciclo 1"?"Ciclo inicial":"Fila de espera"} · {scopeLabel(m.escopo)}</div><Progress className="mt-2 h-1" value={progressRows.length?100*count/progressRows.length:0}/></div></AccordionTrigger>
     <AccordionContent>{!all.length&&<p className="text-xs text-muted-foreground py-2">Nenhum assunto cadastrado. Adicione assuntos em Bora Estudar.</p>}{m.numero===205&&<p className="text-xs text-muted-foreground py-2">A Constituição do Estado de Goiás aparece nas duas disciplinas do Anexo IV. A referência abaixo usa o mesmo ID e não cria outro registro de progresso.</p>}<div className="flex flex-wrap items-center gap-2 pb-3">
      <PriorityButton active={priority} onToggle={()=>setPriorityByMatter(old=>({...old,[m.numero]:!old[m.numero]}))}/>
      {priority&&<p role="status" className="text-xs text-muted-foreground">{hasHigh?"Destaque dos assuntos vinculados ao tema de maior peso de cada banca.":"Não há subtópicos de alta incidência mapeados para esta matéria."}</p>}
      {!priority&&!rows.some(r=>r.details.length)&&<p className="text-xs text-muted-foreground">Não há subtópicos de alta incidência mapeados para esta matéria.</p>}
     </div>
     <Accordion type="multiple" role="list" className="divide-y divide-border/60">
      {rows.map(({a,details,origin})=><TopicRow key={a.id} id={a.id} title={a.topico_central} scope={a.reference?"Referência oficial compartilhada":a.custom?"Personalizado":a.supplemental?"Complemento — fora da sequência TJGO":scopeLabel(a.escopo)} note={a.missingRegistration?"Item oficial sem cadastro ativo nesta conta; histórico vinculado ao ID original.":a.originalTitle?"Título personalizado preservado no cadastro: "+a.originalTitle:a.reference?"Mesmo registro de Direito Constitucional.":a.supplemental?"Não é item expresso no programa TJGO de 2021.":undefined} status={progress.isError?"Indisponível":etapaDoAssunto(progress.data??{},a.id)} origin={origin} details={details} highlight={priority&&details.some(d=>d.highTheme)}/>)}
     </Accordion></AccordionContent>
    </AccordionItem>})}
  </Accordion>
  {!catalog.isPending&&!groups.length&&<Card className="p-4 text-sm text-muted-foreground">Nenhum assunto encontrado.</Card>}
 </main>;
}
