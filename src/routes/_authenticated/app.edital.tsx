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
import {bankTopicAllowed} from "@/lib/bank-exams";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {scopeLabel} from "@/lib/tribunal-catalog";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});
function EditalPage(){
 const {bank}=useBankExam();
 const [search,setSearch]=useState("");
 const catalog=useQuery({queryKey:["edital-catalog"],queryFn:getEditalCatalog,staleTime:Infinity});
 const progress=useQuery({queryKey:["edital-auto-progresso"],queryFn:getEtapasAutomaticasEdital,refetchInterval:10000,refetchOnWindowFocus:true});
 const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const query=normalize(search.trim());
 const groups=(catalog.data?.materias??[]).map(m=>{
  const all=(catalog.data?.assuntos??[]).filter(a=>a.materia_numero===m.numero&&bankTopicAllowed(a,bank));
  const topics=all.filter(a=>!query||normalize(m.titulo_central+" "+a.topico_central).includes(query));
  return {m,all,topics};
 }).filter(g=>g.topics.length);
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 pb-24 sm:px-6 md:pb-8">
  <header><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpenCheck className="text-primary"/> Edital Verticalizado</h1>
  <p className="text-sm text-muted-foreground">TJGO 2021 · Analista — Apoio Judiciário e Administrativo (prioridade) | TJDFT 2022 · Técnico — Área Administrativa.</p>
  <p className="text-xs text-muted-foreground">Referências históricas pré-edital. Leis revogadas e versões antigas constam para auditoria; estudar legislação vigente. A discursiva é um treino adicional, não conteúdo programático literal.</p></header>
  <BankExamSelector/>
  <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar matéria ou assunto..." aria-label="Buscar assuntos"/>
  <p className="text-sm text-muted-foreground">{groups.reduce((n,g)=>n+g.topics.length,0)} assuntos exibidos · tópicos comuns com um único registro de progresso</p>
  {catalog.isPending&&<p>Carregando edital...</p>}{catalog.isError&&<p role="alert">Erro ao carregar o catálogo.</p>}
  {progress.isError&&<p role="alert" className="text-destructive text-sm">Não foi possível carregar o progresso. {String(progress.error)}</p>}
  <Accordion type="multiple" className="space-y-3">
   {groups.map(({m,all,topics})=>{const count=all.filter(a=>etapaDoAssunto(progress.data??{},a.id)!=="Pendente").length;
    return <AccordionItem key={m.numero} value={String(m.numero)} className="rounded-xl border bg-card px-4">
     <AccordionTrigger className="hover:no-underline"><div className="w-full text-left pr-4">
     <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.titulo_central}</span><span className="text-xs text-muted-foreground">{count}/{all.length}</span></div>
     <div className="text-xs text-muted-foreground">{m.ciclo==="Ciclo 1"?"Ciclo inicial":"Fila de espera"} · {scopeLabel(m.escopo)}</div><Progress className="mt-2 h-1" value={100*count/all.length}/></div></AccordionTrigger>
     <AccordionContent>{m.numero===205&&<p className="text-xs text-muted-foreground py-2">A Constituição do Estado de Goiás, também exigida nesta disciplina, está vinculada uma única vez em Direito Constitucional.</p>}<ul className="divide-y divide-border/60">{topics.map(a=><li key={a.id} className="py-3 flex flex-wrap justify-between gap-2">
      <div className="flex-1 min-w-[180px]"><p className="text-sm">{a.topico_central}</p><Badge variant="outline" className="mt-1">{scopeLabel(a.escopo)}</Badge></div>
      <span className="text-xs text-muted-foreground">{progress.isError?"Indisponível":etapaDoAssunto(progress.data??{},a.id)}</span></li>)}</ul></AccordionContent>
    </AccordionItem>})}
  </Accordion>
  {!catalog.isPending&&!groups.length&&<Card className="p-4 text-sm text-muted-foreground">Nenhum assunto encontrado.</Card>}
 </main>;
}
