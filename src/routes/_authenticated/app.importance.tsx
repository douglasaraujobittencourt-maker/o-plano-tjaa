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
// Contagem temática do caderno oficial FGV, prova de 29/05/2022, Tipo 1 (branca).
// https://conhecimento.fgv.br/sites/default/files/concursos/tecnico_judiciario_-_area_administrativanm-aa_tipo_1.pdf
// 1–10 Português; 11–12 Ética; 13–20 Legislação institucional.
// 21–24 Gestão de Pessoas; 25–28 AFO/MCASP; 29–32 Constitucional;
// 33–36 Administrativo; 37–41 Civil; 42–48 Processual Civil;
// 49–54 Penal (inclui abuso de autoridade); 55–60 Processual Penal.
// Questões 21–28 agrupadas em 207 (Gestão de Pessoas e complementos de AFO),
// conforme o conteúdo mais específico do planner, sem dupla contagem em Administração Pública.
const dfSubject=(id:number,questions:number,category:ProgressCategory):Row=>{
 const g=tribunalGroups.find(g=>g.id===id)!;
 return {key:String(id),name:g.name,questions,points:questions,hours:g.hours,category};
};
const dfSpecificRows:Row[]=[
 dfSubject(201,0,"dfSpecific"),
 dfSubject(203,4,"dfSpecific"),
 dfSubject(204,4,"dfSpecific"),
 dfSubject(207,8,"dfSpecific"),
 dfSubject(209,7,"dfSpecific"),
 dfSubject(211,6,"dfSpecific"),
 dfSubject(212,6,"dfSpecific"),
 dfSubject(213,5,"dfSpecific"),
];
const dfBasicRows:Row[]=[
 dfSubject(202,10,"dfBasic"),
 dfSubject(208,2,"dfBasic"),
 dfSubject(210,8,"dfBasic"),
];
const rowsDF:Row[]=[
 ...dfSpecificRows,
 {key:"df-specific",name:"Subtotal — Conhecimentos Específicos",questions:40,points:40,hours:dash,subtotal:true,category:"dfSpecific"},
 ...dfBasicRows,
 {key:"df-basic",name:"Subtotal — Conhecimentos Básicos",questions:20,points:20,hours:dash,subtotal:true,category:"dfBasic"},
 {key:"df-total",name:"Total da prova objetiva",questions:60,points:60,hours:11,subtotal:true},
 {key:"df-writing",name:writing.name,questions:"1 redação",points:30,hours:writing.hours,category:"writing"},
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
  <ImportanceTable title="Grau de Importância — TJDFT" source="TJDFT 01/2022 · Técnico Judiciário — Área Administrativa, sem especialidade · itens 9.5.2, 9.5.6, 9.5.16 e 9.6.2; Anexo I." bank="caixa" rows={rowsDF} note="Distribuição por matéria observada na prova aplicada em 29/05/2022 (FGV, caderno Tipo 1 — branca), por classificação temática conforme as disciplinas do planner; não é previsão do próximo edital. As questões 21–28 foram atribuídas a Gestão de Pessoas e complementos de AFO (4 de gestão e 4 de orçamento/MCASP), sem duplicá-las em Administração Pública. Zero indica ausência de questão atribuída separadamente nessa classificação. Cada questão objetiva vale 1 ponto. Mínimo objetivo: 20 acertos específicos e 30 no total. Redação: 30 pontos, mínimo 15. As horas iniciais continuam sendo as mesmas do ciclo compartilhado."/>
 </main>;
}
