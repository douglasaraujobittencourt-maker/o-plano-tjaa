import {useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogFooter} from "@/components/ui/dialog";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {Pencil,Plus,Trash2} from "lucide-react";
import {toast} from "sonner";
import {ProgressTribunalDots} from "@/components/tribunal-progress-colors";
import {type Subject} from "@/lib/planner-api";
import {cycleTotals,formatCycleHours,type CycleSessions} from "@/lib/editable-cycle";
import {getEditableCycle,saveEditableCycle,cycleSaveError} from "@/lib/editable-cycle-api";

export function EditableCycleCard({subjects}:{subjects:Subject[]}){
 const qc=useQueryClient();
 const query=useQuery({queryKey:["editable-cycle"],queryFn:getEditableCycle,refetchInterval:5000});
 const [draft,setDraft]=useState<CycleSessions|null>(null);
 const [revision,setRevision]=useState("");
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const names=new Map(subjects.map(s=>[s.id,s]));
 const sessions=query.data?.sessions??[];
 const totals=cycleTotals(sessions);
 const draftTotals=cycleTotals(draft??[]);
 const addBlock=()=>({subjectId:"",minutes:30});
 const edit=()=>{if(!query.data)return;setRevision(query.data.revision);setDraft(sessions.map(s=>s.map(b=>({...b}))));setError("");};
 const changeBlock=(i:number,j:number,patch:Partial<CycleSessions[number][number]>)=>setDraft(prev=>prev?.map((s,k)=>k===i?s.map((b,l)=>l===j?{...b,...patch}:b):s)??null);
 const save=async()=>{
  if(!draft)return;setSaving(true);setError("");
  try{
   const result=await saveEditableCycle(draft,revision);
   await qc.cancelQueries({queryKey:["editable-cycle"]});qc.setQueryData(["editable-cycle"],result);
   setDraft(null);toast.success("Ciclo atualizado!");
   await Promise.all(["editable-cycle","cycle-slots","subjects","subjects-blocks","cycle","edital-catalog"].map(key=>qc.invalidateQueries({queryKey:[key]})));
  }catch(e){setError(cycleSaveError(e));void qc.invalidateQueries({queryKey:["editable-cycle"]});}
  finally{setSaving(false);}
 };
 const summary=(values:Map<string,number>)=>[...values].sort((a,b)=>b[1]-a[1]).map(([id,m])=>(names.get(id)?.name??"Selecione a matéria")+" "+formatCycleHours(m)).join(" · ")||"Nenhum bloco programado.";
 return <Card className="p-5 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="font-semibold">Ciclo de estudos · sessões alternadas</h2>
   <Button size="sm" variant="outline" disabled={!query.data||query.isError||saving} onClick={edit}><Pencil className="w-4 h-4 mr-1"/>Editar sessões</Button>
  </div>
  <p className="text-xs text-muted-foreground">Sessões flexíveis, sem dia fixo. Retome de onde parou. Revisões e questões dentro de cada bloco.</p>
  {query.isPending?<p className="text-sm text-muted-foreground">Carregando ciclo…</p>:query.isError?<p role="alert" className="text-sm text-destructive">Não foi possível carregar a programação. <Button size="sm" variant="link" onClick={()=>void query.refetch()}>Tentar novamente</Button></p>:<>
   {sessions.map((session,i)=><div key={i} className="flex flex-wrap items-center gap-2 text-sm border-b pb-2"><strong>Sessão {i+1}</strong>{session.map((block,j)=><span key={j} className="inline-flex items-center gap-1.5">{names.get(block.subjectId)&&<ProgressTribunalDots subject={names.get(block.subjectId)!} bank="bnb"/>}{names.get(block.subjectId)?.name??"Matéria"} · {block.minutes} min</span>)}<span className="ml-auto text-xs text-muted-foreground">{session.reduce((n,b)=>n+b.minutes,0)} min</span></div>)}
   <p className="text-sm">{summary(totals)}</p>
   <p className="text-xs text-muted-foreground">Total planejado: {formatCycleHours([...totals.values()].reduce((n,m)=>n+m,0))}. Ao concluir uma matéria objetiva, a próxima da fila assume sua posição e carga.</p>
  </>}
  <Dialog open={draft!==null} onOpenChange={open=>{if(!open&&!saving)setDraft(null);}}>
   <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Editar sessões do ciclo</DialogTitle></DialogHeader>
    <p className="text-xs text-muted-foreground">Selecione matérias do cadastro e informe o tempo em minutos. As matérias incluídas passam a integrar o ciclo; as retiradas voltam à fila, salvo as já concluídas. O histórico não é apagado.</p>
    {draft?.map((session,i)=><div key={i} className="rounded-lg border p-3 space-y-2">
     <div className="flex items-center justify-between gap-2"><strong className="text-sm">Sessão {i+1} · {session.reduce((n,b)=>n+(b.minutes||0),0)} min</strong><Button size="sm" variant="ghost" disabled={saving} onClick={()=>setDraft(prev=>prev?.filter((_,j)=>j!==i)??null)}><Trash2 className="w-4 h-4 mr-1 text-destructive"/>Remover sessão</Button></div>
     {session.map((block,j)=><div key={j} className="flex flex-wrap items-center gap-2">
      <Select value={block.subjectId} disabled={saving} onValueChange={subjectId=>changeBlock(i,j,{subjectId})}><SelectTrigger className="flex-1 min-w-[160px]" aria-label={"Matéria do bloco "+(j+1)+" da sessão "+(i+1)}><SelectValue placeholder="Selecione a matéria"/></SelectTrigger><SelectContent>{subjects.map(s=><SelectItem key={s.id} value={s.id}><span className="flex items-center gap-2"><ProgressTribunalDots subject={s} bank="bnb"/>{s.name}</span></SelectItem>)}</SelectContent></Select>
      <Input aria-label={"Minutos do bloco "+(j+1)+" da sessão "+(i+1)} type="number" min={1} max={1440} step={1} className="w-24" value={block.minutes||""} disabled={saving} onChange={e=>changeBlock(i,j,{minutes:Number(e.target.value)})}/>
      <span className="text-xs text-muted-foreground">min</span>
      <Button variant="ghost" size="icon" aria-label="Remover bloco" disabled={saving} onClick={()=>setDraft(prev=>prev?.map((s,k)=>k===i?s.filter((_,l)=>l!==j):s).filter(s=>s.length)??null)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
     </div>)}
     <Button size="sm" variant="outline" disabled={saving} onClick={()=>setDraft(prev=>prev?.map((s,k)=>k===i?[...s,addBlock()]:s)??null)}><Plus className="w-4 h-4 mr-1"/>Adicionar bloco</Button>
    </div>)}
    <Button variant="outline" disabled={saving} onClick={()=>setDraft(prev=>[...(prev??[]),[addBlock()]])}><Plus className="w-4 h-4 mr-1"/>Adicionar sessão</Button>
    <div className="rounded-lg bg-muted/40 p-3 text-sm"><strong>Resumo planejado · {formatCycleHours([...draftTotals.values()].reduce((n,m)=>n+m,0))}</strong><p className="mt-1 text-xs">{summary(draftTotals)}</p></div>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    <DialogFooter><Button variant="outline" disabled={saving} onClick={()=>setDraft(null)}>Cancelar</Button><Button disabled={saving} onClick={()=>void save()}>{saving?"Salvando…":"Salvar ciclo"}</Button></DialogFooter>
   </DialogContent>
  </Dialog>
 </Card>;
}
