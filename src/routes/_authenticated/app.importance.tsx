import {createFileRoute} from "@tanstack/react-router";
import {Card} from "@/components/ui/card";
import {tribunalGroups} from "@/lib/tribunal-catalog";
import {ProgressTribunalDot,ProgressTribunalDots} from "@/components/tribunal-progress-colors";
import {PROGRESS_TRIBUNAL_LEGEND,subjectMatchesExam,type ProgressCategory} from "@/lib/tribunal-subject-source";
import type {BankExam} from "@/lib/bank-exams";

export const Route=createFileRoute("/_authenticated/app/importance")({
 head:()=>({meta:[{title:"Raio-X do Edital — O Plano"}]}),
 component:ImportancePage,
});
type Row={key:string;name:string;questions:number|string;points:number|string;hours:number|string;subtotal?:boolean;category?:ProgressCategory};
const objectiveGO:Row[]=tribunalGroups.filter(g=>g.questions).map(g=>({key:String(g.id),name:g.name,questions:g.questions!,points:g.points!,hours:g.hours}));
const writing=tribunalGroups.find(g=>g.id===214)!;
const hours=(id:number)=>tribunalGroups.find(g=>g.id===id)!.hours;
const dash="—";
const rowsGO:Row[]=[
 ...objectiveGO,
 {key:"go-total",name:"Total da prova objetiva",questions:60,points:100,hours:11,subtotal:true},
 {key:"go-writing",name:writing.name,questions:dash,points:100,hours:writing.hours},
];
// O edital do TJDFT (item 9.5.6) informa a quantidade por bloco,
// exceto Língua Portuguesa. Não atribuir números individuais inexistentes.
const dfSubject=(id:number,questions:number|string= dash,points:number|string=dash):Row=>{
 const g=tribunalGroups.find(g=>g.id===id)!;
 return {key:String(id),name:g.name,questions,points,hours:g.hours};
};
const dfSpecificIds=[201,203,204,207,209,211,212,213];
const rowsDF:Row[]=[
 ...dfSpecificIds.map(id=>dfSubject(id)),
 {key:"df-specific",name:"Subtotal — Conhecimentos Específicos",questions:40,points:40,hours:dash,subtotal:true,category:"dfSpecific"},
 dfSubject(202,10,10),
 dfSubject(208),
 dfSubject(210),
 {key:"df-other-basic",name:"Subtotal — Ética e legislação institucional",questions:10,points:10,hours:dash,subtotal:true,category:"dfBasic"},
 {key:"df-total",name:"Total da prova objetiva",questions:60,points:60,hours:11,subtotal:true},
 {key:"df-writing",name:writing.name,questions:"1 redação",points:30,hours:writing.hours},
];
function ExamLegend({bank}:{bank:BankExam}){
 const categories:ProgressCategory[]=bank==="bb"?["goBasic","goSpecific","writing"]:["dfBasic","dfSpecific","writing"];
 return <div role="group" aria-label="Legenda das categorias" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
  {categories.map(category=><span key={category} className="inline-flex items-center gap-1.5"><ProgressTribunalDot category={category}/>{PROGRESS_TRIBUNAL_LEGEND[category].label}</span>)}
 </div>;
}
function ImportanceTable({title,source,bank,rows,note}:{title:string;source:string;bank:BankExam;rows:Row[];note:string}){
 return <section className="space-y-2">
  <h2 className="text-lg font-bold">{title}</h2>
  <p className="text-sm text-muted-foreground">{source}</p>
  <Card className="p-4 space-y-3">
   <ExamLegend bank={bank}/>
   <div className="overflow-auto">
    <table className="w-full text-sm">
     <thead><tr><th scope="col" className="text-left">Matéria</th><th scope="col">Questões</th><th scope="col">Pontos</th><th scope="col">Horas iniciais</th></tr></thead>
     <tbody>{rows.map(row=><tr key={row.key} className={row.subtotal?"border-t bg-muted/40 font-semibold":"border-t"}>
      <td className="py-2"><div className="flex items-center gap-2">
       {row.category?<ProgressTribunalDot category={row.category}/>:!row.subtotal&&subjectMatchesExam({name:row.name},bank)?<ProgressTribunalDots subject={{name:row.name}} bank={bank}/>:null}
       <span>{row.name}</span>
      </div></td>
      <td className="text-center">{row.questions}</td>
      <td className="text-center">{row.points}</td>
      <td className="text-center">{row.hours}</td>
     </tr>)}</tbody>
    </table>
   </div>
   <p className="mt-3 text-sm">{note}</p>
  </Card>
 </section>;
}
function ImportancePage(){
 return <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
  <header><h1 className="text-2xl font-bold">Raio-X do Edital</h1>
   <p className="text-sm text-muted-foreground">TJGO prioritário · TJDFT em seguida. Referências históricas, não previsão dos próximos editais.</p>
  </header>
  <ImportanceTable title="Grau de Importância — TJ Goiás" source="TJGO 02/2021 · Analista Judiciário — Apoio Judiciário e Administrativo · Quadro 3 e Anexo IV." bank="bb" rows={rowsGO} note="As quatro matérias iniciais somam 45 questões e 75/100 pontos. Discursiva: 100 pontos, mínimo 60. As horas representam a carga inicial do ciclo compartilhado, não uma meta adicional."/>
  <ImportanceTable title="Grau de Importância — TJDFT" source="TJDFT 01/2022 · Técnico Judiciário — Área Administrativa, sem especialidade · itens 9.5.2, 9.5.6, 9.5.16 e 9.6.2; Anexo I." bank="caixa" rows={rowsDF} note="O edital não individualiza as 40 questões específicas nem as 10 de Ética e legislação institucional: — significa quantidade ou pontuação individual não informada. Administração Pública e Gestão de Pessoas/AFO são partes da disciplina oficial Noções de Administração de Recursos Humanos e Gestão Pública, separadas no planner. Mínimo objetivo: 20 acertos específicos e 30 no total. Redação: 30 pontos, mínimo 15. As horas iniciais são as mesmas do ciclo compartilhado; não devem ser somadas às horas da tabela TJGO."/>
 </main>;
}
