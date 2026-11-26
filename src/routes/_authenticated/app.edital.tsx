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
import {bankTopicAllowed,bankTopicsForMatter} from "@/lib/bank-exams";
import {getEditalCatalog} from "@/lib/edital-catalog";
import {scopeLabel,topicOrderLabel} from "@/lib/tribunal-catalog";
import {auditGoMatters,auditGoTopics,goMatterOrder,type AuditTopic} from "@/lib/tjgo-edital-audit";
import {getEtapasAutomaticasEdital,etapaDoAssunto} from "@/lib/edital-auto-progress";
export const Route=createFileRoute("/_authenticated/app/edital")({head:()=>({meta:[{title:"Edital Verticalizado — TJGO e TJDFT | O Plano"}]}),component:EditalPage});

function EditalPage(){
 const {bank}=useBankExam();
 const [search,setSearch]=useState("");
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
  <p className="text-xs text-muted-foreground">{bank==="caixa"?topicOrderLabel(bank):"TJGO: disciplinas e assuntos na sequência do Anexo IV; complementos e personalizados ao final."}</p>
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
     <AccordionContent>{!all.length&&<p className="text-xs text-muted-foreground py-2">Nenhum assunto cadastrado. Adicione assuntos em Bora Estudar.</p>}{m.numero===205&&<p className="text-xs text-muted-foreground py-2">A Constituição do Estado de Goiás aparece nas duas disciplinas do Anexo IV. A referência abaixo usa o mesmo ID e não cria outro registro de progresso.</p>}<ul className="divide-y divide-border/60">
      {topics.map(a=>{
       const scope=a.reference?"Referência oficial compartilhada":a.custom?"Personalizado":a.supplemental?`Complemento TJGO · ${scopeLabel(a.escopo)}`:scopeLabel(a.escopo);
       const note=a.missingRegistration?"Item oficial sem cadastro ativo nesta conta; histórico vinculado ao ID original.":a.originalTitle?"Título personalizado preservado no cadastro: "+a.originalTitle:a.reference?"Mesmo registro de Direito Constitucional.":a.supplemental?"Não é item expresso no programa TJGO de 2021.":undefined;
       return <li key={a.id} className="flex flex-wrap justify-between gap-2 py-3">
        <div className="min-w-[min(180px,100%)] flex-1">
         <p className="text-sm">{a.topico_central}</p>
         <Badge variant="outline" className="mt-1">{scope}</Badge>
         {note&&<p className="mt-1 text-xs text-muted-foreground">{note}</p>}
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
