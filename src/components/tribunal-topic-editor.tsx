import {useEffect,useRef,useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {changeTribunalTopic,tribunalTopicError,type Subject} from "@/lib/planner-api";
import {subjectDefinition,scopeOptions,type TopicScope} from "@/lib/tribunal-subject-source";
import {scopeLabel} from "@/lib/tribunal-catalog";
export function TribunalTopicEditor({subject,open,onOpenChange}:{subject:Subject;open:boolean;onOpenChange:(v:boolean)=>void}){
 const qc=useQueryClient();
 const [id,setId]=useState<number|undefined>();
 const [title,setTitle]=useState("");
 const options=scopeOptions(subject);
 const [scope,setScope]=useState<TopicScope>(options[0]??"Comum (Caixa + BB)");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);
 const definition=subjectDefinition(subject);
 const canAdd=!!subject.tribunal_data;
 useEffect(()=>{setId(undefined);setTitle("");setError("");setScope(scopeOptions(subject)[0]??"Comum (Caixa + BB)");},[subject.id,open]);
 const reset=()=>{setId(undefined);setTitle("");setError("");setScope(options[0]??"Comum (Caixa + BB)");};
 const save=async(removeId?:number)=>{
  setBusy(true);setError("");
  try{
   const updated=await changeTribunalTopic(subject.id,removeId!==undefined?{id:removeId,remove:true}:{id,title,scope});
   await qc.cancelQueries({queryKey:["subjects"]});
   qc.setQueryData<Subject[]>(["subjects"],old=>old?.map(s=>s.id===updated.id?updated:s));
   reset();toast.success(removeId!==undefined?"Assunto removido. O histórico foi preservado.":"Assunto salvo.");
   // A lista é atualizada imediatamente após a confirmação do servidor.
   void Promise.all([qc.invalidateQueries({queryKey:["subjects"]}),qc.invalidateQueries({queryKey:["edital-catalog"]}),qc.invalidateQueries({queryKey:["edital-auto-progresso"]})]);
  }catch(e){
   const message=tribunalTopicError(e);setError(message);toast.error(message);
   void qc.invalidateQueries({queryKey:["subjects"]});
  }finally{setBusy(false);}
 };
 const startEdit=(topic:{id:number;title:string;scope:TopicScope})=>{
  setId(topic.id);setTitle(topic.title);setScope(topic.scope);setError("");
  requestAnimationFrame(()=>{inputRef.current?.scrollIntoView({block:"center",behavior:"smooth"});inputRef.current?.focus({preventScroll:true});});
 };
 return <Dialog open={open} onOpenChange={v=>{if(!busy)onOpenChange(v);}}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Assuntos · {subject.name}</DialogTitle></DialogHeader>
 <p className="text-xs text-muted-foreground">Alterações valem para sua conta. Registros antigos permanecem no histórico.</p>
 {error&&<p role="alert" className="rounded-md border border-destructive/40 p-2 text-sm text-destructive">{error}</p>}
 <div className="space-y-2">
 {definition?.topics.map(t=><div key={t.id} className="flex items-center justify-between gap-2 border-b py-2">
 <div className="min-w-0 text-sm">{t.title}<div className="text-xs text-muted-foreground">{scopeLabel(t.scope)}</div></div>
 <div className="flex gap-1"><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>startEdit(t)}>Editar</Button>
 <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>{if(window.confirm("Excluir este assunto da lista? Sessões e revisões já registradas serão preservadas."))void save(t.id);}}>Excluir</Button></div></div>)}
 {!definition?.topics.length&&<p className="text-sm text-muted-foreground">Nenhum assunto cadastrado.</p>}
 </div>
 <div className="space-y-2 border-t pt-3">
 <label className="text-sm font-medium" htmlFor="tribunal-topic-title">{id===undefined?"Novo assunto":"Editar assunto"}</label>
 <Input ref={inputRef} id="tribunal-topic-title" value={title} onChange={e=>setTitle(e.target.value)} disabled={busy||(id===undefined&&!canAdd)}/>
 <label className="text-sm font-medium" htmlFor="tribunal-topic-scope">Tribunal</label>
 <select id="tribunal-topic-scope" className="w-full rounded-md border bg-background p-2 text-sm" value={scope} disabled={busy||(id===undefined&&!canAdd)} onChange={e=>setScope(e.target.value as TopicScope)}>{options.map(s=><option value={s} key={s}>{scopeLabel(s)}</option>)}</select>
 <div className="flex gap-2"><Button disabled={busy||!title.trim()||(id===undefined&&!canAdd)} onClick={()=>void save()}>{id===undefined?"Adicionar assunto":"Salvar assunto"}</Button>
 {id!==undefined&&<Button variant="outline" disabled={busy} onClick={reset}>Cancelar edição</Button>}</div>
 {id===undefined&&!canAdd&&<p className="text-xs text-muted-foreground">A inclusão de novos assuntos requer a estrutura de cadastro. Os botões Editar e Excluir acima estão disponíveis.</p>}
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>
 </DialogContent></Dialog>;
}
