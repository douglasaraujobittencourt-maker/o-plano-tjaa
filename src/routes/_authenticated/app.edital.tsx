import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useState} from "react";
import {BookOpenCheck,ChevronDown} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {toast} from "sonner";
import {getSubjects,markEditalTopicsStudied,scheduleLessonReviews} from "@/lib/planner-api";
import {topicsForSubject,subjectDefinition} from "@/lib/tribunal-subject-source";
import {getGoStudyDetail,goStudyWeights} from "@/lib/tjgo-study-details";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Progress} from "@/components/ui/progress";
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from "@/components/ui/accordion";
import {BankExamSelector,useBankExam} from "@/components/bank-exam-provider";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {filteredEditalGroups} from "@/lib/edital-view-filter";
import {cleanGoNames,groupCleanSyllabus} from "@/lib/tjgo-clean-syllabus";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});

function EditalPage(){
 const {bank}=useBankExam();
 const qc=useQueryClient();
 const action=useMutation({
  mutationFn:async({matter,ids,kind}:{matter:number;ids:number[];kind:"complete"|"review"})=>{
   const subjects=await getSubjects();
   const targets=ids.map(id=>{
    const candidates=subjects.flatMap(s=>topicsForSubject(s,"bnb").filter(t=>t.id===id).map(t=>({subject:s,topic:t})));
    const target=candidates.find(x=>subjectDefinition(x.subject)?.number===matter)??candidates[0];
    if(!target)throw new Error("Assunto sem cadastro ativo no planner.");
    return target;
   });
   for(const {subject,topic} of targets){
    if(kind==="complete")await markEditalTopicsStudied(subject.id,[topic.id]);
    else await scheduleLessonReviews(subject.id,topic.topico_central,topic.id);
   }
  },onSuccess:async(_,v)=>{await qc.invalidateQueries();toast.success(v.kind==="complete"?"Assunto concluído.":"Revisões agendadas.");},onError:async(e)=>{await qc.invalidateQueries();toast.error(e instanceof Error?e.message:"Não foi possível atualizar o progresso.");}
 });
 const [search,setSearch]=useState("");
 const catalog=useQuery({queryKey:["edital-catalog"],queryFn:getEditalCatalog,staleTime:0,refetchInterval:5000});
 const progress=useQuery({queryKey:["edital-auto-progresso"],queryFn:getEtapasAutomaticasEdital,refetchInterval:10000,refetchOnWindowFocus:true});
 const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const query=normalize(search.trim());
 const groups=(catalog.data?filteredEditalGroups(catalog.data,bank):[])
 .filter(g=>bank!=="bb"||cleanGoNames[g.m.numero]!==undefined)
 .map(g=>{
  const name=bank!=="caixa"?(cleanGoNames[g.m.numero]??g.m.titulo_central):g.m.titulo_central;
  const topics=groupCleanSyllabus(g.m.numero,g.all,bank!=="caixa",true)
   .flatMap(a=>{const detail=bank!=="caixa"&&a.official?getGoStudyDetail(g.m.numero,a.id):undefined;const row={...a,viewKey:String(a.id),detail,displayTitle:detail?.title??a.displayTitle};if(g.m.numero!==203||a.id!==20312||!a.official||bank==="caixa")return [row];const competence=getGoStudyDetail(203,"20312:competencia");return [row,{...row,viewKey:"20312:competencia",detail:competence,displayTitle:competence?.title??"Competência administrativa"}];})
   .filter(a=>!query||normalize(name+" "+a.displayTitle+" "+a.searchText).includes(query));
  return {...g,m:{...g.m,titulo_central:name},topics};
 }).filter(g=>g.topics.length>0);
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
  <header><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpenCheck className="text-primary"/> Edital Verticalizado</h1>
  <p className="text-sm text-muted-foreground">{bank==="bb"?"TJGO 2021 · Analista Judiciário – Área de Apoio Judiciário e Administrativo":bank==="caixa"?"TJDFT 2022 · Técnico Judiciário – Área Administrativa":"TJGO 2021 · Analista Judiciário – Área de Apoio Judiciário e Administrativo | TJDFT 2022 · Técnico Judiciário – Área Administrativa"}</p></header>
  <BankExamSelector/>
  <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar matéria ou assunto..." aria-label="Buscar assuntos"/>
  {catalog.isPending&&<p>Carregando edital...</p>}{catalog.isError&&<p role="alert">Erro ao carregar o catálogo.</p>}
  {progress.isError&&<p role="alert" className="text-destructive text-sm">Não foi possível carregar o progresso. {String(progress.error)}</p>}
  <Accordion type="multiple" className="space-y-3">
   {groups.map(({m,topics,progressRows})=>{const count=progressRows.filter(a=>etapaDoAssunto(progress.data??{},a.id)!=="Pendente").length;
    return <AccordionItem key={m.numero} value={String(m.numero)} className="rounded-xl border bg-card px-4">
     <AccordionTrigger className="hover:no-underline"><div className="w-full text-left pr-4">
     <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.titulo_central}</span><span className="text-xs text-muted-foreground">{count}/{progressRows.length}</span></div>
     {bank!=="caixa"&&goStudyWeights[m.numero]&&<p className="mt-1 text-xs text-muted-foreground">{goStudyWeights[m.numero].questions} questões · Peso {goStudyWeights[m.numero].weight.toFixed(1).replace(".",",")} · {goStudyWeights[m.numero].points} pontos</p>}
     <Progress className="mt-2 h-1" value={progressRows.length?100*count/progressRows.length:0}/></div></AccordionTrigger>
     <AccordionContent><ul className="divide-y divide-border/60">
      {topics.map(a=>{
       const stages=a.ids.map(id=>etapaDoAssunto(progress.data??{},id));
       const distinct=[...new Set(stages)];
       const status=distinct.length===1?distinct[0]:distinct.map(stage=>`${stages.filter(s=>s===stage).length} ${stage}`).join(" · ");
       const completed=stages.every(stage=>stage==="Concluído");
       return <li key={a.viewKey} className="py-3">
        <details className="group">
         <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-sm text-sm [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 flex-1 items-start gap-2"><ChevronDown className="mt-0.5 size-4 shrink-0 -rotate-90 transition-transform group-open:rotate-0"/><span>{a.displayTitle}</span></span>
          <span className="shrink-0 text-xs text-muted-foreground">{progress.isError?"Indisponível":status}</span>
         </summary>
         <div className="mt-3 space-y-4 pl-6">
          {a.detail?<section className="space-y-2"><h3 className="text-xs font-semibold text-amber-800 dark:text-amber-300">Subtópico(s) de Maior Incidência</h3><ul className="list-disc space-y-1 pl-4 text-sm">{a.detail.subtopics.map((s,i)=><li key={i}>{s}</li>)}</ul></section>:bank!=="caixa"&&a.official?<p className="text-xs text-muted-foreground">Detalhes não disponíveis no trecho do documento recebido.</p>:null}
          <div className="flex flex-wrap items-center gap-3">
           <label className="flex items-center gap-2 text-sm"><Checkbox checked={completed} disabled={completed||progress.isPending||progress.isError||action.isPending} onCheckedChange={value=>{if(value===true)action.mutate({matter:m.numero,ids:a.ids,kind:"complete"});}}/>Concluído</label>
           <Button asChild size="sm" variant="outline"><Link to="/app/study">Bora Estudar</Link></Button>
           <Button size="sm" variant="outline" disabled={action.isPending} onClick={()=>action.mutate({matter:m.numero,ids:a.ids,kind:"review"})}>Agendar revisões</Button>
           <Button asChild size="sm" variant="outline"><Link to="/app/reviews">Revisões</Link></Button>
          </div>
          {a.detail?.charge&&<Card className="border-l-4 border-l-amber-400 bg-muted/30 p-3"><h3 className="mb-1 text-xs font-semibold">Detalhamento da Cobrança</h3><p className="whitespace-pre-line text-sm leading-relaxed">{a.detail.charge}</p></Card>}
         </div>
        </details>
       </li>;
      })}
     </ul></AccordionContent>
    </AccordionItem>})}
  </Accordion>
  {!catalog.isPending&&!groups.length&&<Card className="p-4 text-sm text-muted-foreground">Nenhum assunto encontrado.</Card>}
 </main>;
}
