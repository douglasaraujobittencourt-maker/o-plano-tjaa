import {createFileRoute} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
import {BookOpenCheck,Flame,ChevronRight} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Progress} from "@/components/ui/progress";
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from "@/components/ui/accordion";
import {BankExamSelector,useBankExam} from "@/components/bank-exam-provider";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {filteredEditalGroups,filteredEditalDetails} from "@/lib/edital-view-filter";
import {cleanGoNames,cleanGoTitle,cleanGoContinuation} from "@/lib/tjgo-clean-syllabus";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});

function EditalPage(){
 const {bank}=useBankExam();
 const [search,setSearch]=useState("");
 const [onlyHigh,setOnlyHigh]=useState(false);
 const [open,setOpen]=useState<Set<number>>(new Set());
 const toggle=(id:number)=>setOpen(p=>{const n=new Set(p);if(n.has(id))n.delete(id);else n.add(id);return n;});
 const catalog=useQuery({queryKey:["edital-catalog"],queryFn:getEditalCatalog,staleTime:0,refetchInterval:5000});
 const progress=useQuery({queryKey:["edital-auto-progresso"],queryFn:getEtapasAutomaticasEdital,refetchInterval:10000,refetchOnWindowFocus:true});
 const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const query=normalize(search.trim());
 const groups=(catalog.data?filteredEditalGroups(catalog.data,bank):[])
 .filter(g=>bank!=="bb"||cleanGoNames[g.m.numero]!==undefined)
 .map(g=>{
  const name=bank!=="caixa"?(cleanGoNames[g.m.numero]??g.m.titulo_central):g.m.titulo_central;
  let parentHigh=false;
  const topics=g.all.map(a=>{const literal=bank!=="caixa"?cleanGoTitle(g.m.numero,a.id):undefined;const continuation=literal!==undefined&&cleanGoContinuation.has(a.id);
    // Alta incidência = tema de maior percentual da matéria no Mapa (Instituto Verbena); subtópicos herdam do tópico.
    const highDetails=filteredEditalDetails(g.m.numero,a,name,bank).filter(d=>d.bank==="verbena"&&d.highTheme);
    const own=highDetails.length>0;
    const subs=[...new Map(highDetails.flatMap(d=>d.subtopics).map(x=>[x.key,x])).values()];
    const high=own||(continuation&&parentHigh);if(!continuation)parentHigh=own;
    return {...a,displayTitle:literal??a.topico_central,continuation,high,subs};})
   .filter(a=>!query||normalize(name+" "+a.displayTitle+" "+a.topico_central).includes(query))
   .filter(a=>!onlyHigh||a.high);
  return {...g,m:{...g.m,titulo_central:name},topics};
 }).filter(g=>g.topics.length>0);
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
  <header><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpenCheck className="text-primary"/> Edital Verticalizado</h1>
  <p className="text-sm text-muted-foreground">{bank==="bb"?"TJGO 2021 · Analista Judiciário – Área de Apoio Judiciário e Administrativo":bank==="caixa"?"TJDFT 2022 · Técnico Judiciário – Área Administrativa":"TJGO 2021 · Analista Judiciário – Área de Apoio Judiciário e Administrativo | TJDFT 2022 · Técnico Judiciário – Área Administrativa"}</p></header>
  <BankExamSelector/>
  <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar matéria ou assunto..." aria-label="Buscar assuntos"/>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro de incidência">
   <Button size="sm" variant={onlyHigh?"outline":"default"} onClick={()=>setOnlyHigh(false)}>Todos os assuntos</Button>
   <Button size="sm" variant={onlyHigh?"default":"outline"} onClick={()=>setOnlyHigh(true)}><Flame className="size-4"/>Somente Alta Incidência</Button>
  </div>
  <p className="text-sm text-muted-foreground">{new Set(groups.flatMap(g=>g.topics.map(a=>a.id))).size} assuntos distintos exibidos · referências compartilhadas com um único registro de progresso</p>
  {catalog.isPending&&<p>Carregando edital...</p>}{catalog.isError&&<p role="alert">Erro ao carregar o catálogo.</p>}
  {progress.isError&&<p role="alert" className="text-destructive text-sm">Não foi possível carregar o progresso. {String(progress.error)}</p>}
  <Accordion type="multiple" className="space-y-3">
   {groups.map(({m,topics,progressRows})=>{const count=progressRows.filter(a=>etapaDoAssunto(progress.data??{},a.id)!=="Pendente").length;
    return <AccordionItem key={m.numero} value={String(m.numero)} className="rounded-xl border bg-card px-4">
     <AccordionTrigger className="hover:no-underline"><div className="w-full text-left pr-4">
     <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.titulo_central}</span><span className="text-xs text-muted-foreground">{count}/{progressRows.length}</span></div>
     <Progress className="mt-2 h-1" value={progressRows.length?100*count/progressRows.length:0}/></div></AccordionTrigger>
     <AccordionContent><ul className="divide-y divide-border/60">
      {topics.map(a=>{
       return <li key={a.id} className="flex flex-wrap justify-between gap-2 py-3">
        <div className={`min-w-[min(180px,100%)] flex-1 ${a.continuation?"pl-4":""}`}>
         {a.subs.length>0?<button type="button" onClick={()=>toggle(a.id)} aria-expanded={open.has(a.id)} className="flex w-full items-start gap-1 text-left text-sm"><ChevronRight className={`mt-0.5 size-4 shrink-0 transition-transform ${open.has(a.id)?"rotate-90":""}`}/><span>{a.displayTitle}{a.high&&<span title="Alta incidência — Instituto Verbena" className="ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-destructive"><Flame className="size-3"/>Alta incidência - Instituto Verbena</span>}</span></button>:<p className="text-sm">{a.displayTitle}{a.high&&<span title="Alta incidência — Instituto Verbena" className="ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-destructive"><Flame className="size-3"/>Alta incidência - Instituto Verbena</span>}</p>}
         {a.subs.length>0&&open.has(a.id)&&<ul className="mt-2 space-y-1 border-l-2 border-destructive/40 pl-3">{a.subs.map(x=><li key={x.key} className="text-xs"><span className="font-medium">{x.title}</span><span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-destructive/10 px-1.5 text-[10px] font-semibold text-destructive"><Flame className="size-3"/>Alta incidência - Instituto Verbena</span>{x.description&&<p className="text-muted-foreground">{x.description}</p>}</li>)}</ul>}
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
