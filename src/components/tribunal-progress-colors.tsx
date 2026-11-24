import type {BankExam} from "@/lib/bank-exams";
import {PROGRESS_TRIBUNAL_LEGEND,subjectCategories,type ProgressCategory,type SubjectRef} from "@/lib/tribunal-subject-source";
export function ProgressTribunalDot({category}:{category:ProgressCategory}){
 const {label,color}=PROGRESS_TRIBUNAL_LEGEND[category];
 return <span role="img" aria-label={label} title={label} className="w-2.5 h-2.5 rounded-full shrink-0 aspect-square ring-1 ring-border/50" style={{backgroundColor:color}}/>;
}
export function ProgressTribunalDots({subject,bank}:{subject:SubjectRef;bank:BankExam}){
 return <span className="inline-flex shrink-0 items-center gap-1">{subjectCategories(subject,bank).map(category=><ProgressTribunalDot key={category} category={category}/>)}</span>;
}
export function ProgressTribunalLegend(){
 return <div role="group" aria-label="Legenda das categorias de matérias" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">{(Object.keys(PROGRESS_TRIBUNAL_LEGEND) as ProgressCategory[]).map(category=><span key={category} className="inline-flex items-center gap-1.5"><ProgressTribunalDot category={category}/><span>{PROGRESS_TRIBUNAL_LEGEND[category].label}</span></span>)}</div>;
}
