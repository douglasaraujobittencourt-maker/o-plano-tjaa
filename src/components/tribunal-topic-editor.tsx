import {useEffect,useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {Dialog,DialogContent,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {changeTribunalTopic,type Subject} from "@/lib/planner-api";
import {subjectDefinition,scopeOptions,type TopicScope} from "@/lib/tribunal-subject-source";
import {scopeLabel} from "@/lib/tribunal-catalog";
export function TribunalTopicEditor({subject,open,onOpenChange}:{subject:Subject;open:boolean;onOpenChange:(v:boolean)=>void}){
 const qc=useQueryClient();const [id,setId]=useState<number|undefined>();const [title,setTitle]=useState("");
 const options=scopeOptions(subject);const [scope,setScope]=useState<TopicScope>(options[0]??"Comum (Caixa + BB)");const [busy,setBusy]=useState(false);
 const definition=subjectDefinition(subject);
 useEffect(()=>{setId(undefined);setTitle("");setScope(scopeOptions(subject)[0]??"Comum (Caixa + BB)");},[subject.id,open]);
 const reset=()=>{setId(undefined);setTitle("");setScope(options[0]??"Comum (Caixa + BB)");};
 const save=async(removeId?:number)=>{
  setBusy(true);try{
   await changeTribunalTopic(subject.id,removeId!==undefined?{id:removeId,remove:true}:{id,title,scope});
   await Promise.all([qc.invalidateQueries({queryKey:["subjects"]}),qc.invalidateQueries({queryKey:["edital-catalog"]})]);
   reset();toast.success(removeId!==undefined?"Assunto removido.":"Assunto salvo.");
  }catch(e:any){toast.error(e.message??"Não foi possível alterar o assunto.");await qc.invalidateQueries({queryKey:["subjects"]});}finally{setBusy(false);}
 };
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Assuntos · {subject.name}</DialogTitle></DialogHeader>
 <p className="text-xs text-muted-foreground">Alterações valem para sua conta. Registros antigos permanecem no histórico.</p>
 {!subject.tribunal_data&&<p className="text-xs text-muted-foreground">A edição fica disponível após aplicar a migração do catálogo no Supabase.</p>}
 <div className="space-y-2">{definition?.topics.map(t=><div key={t.id} className="flex items-center justify-between gap-2 border-b py-2"><div className="min-w-0 text-sm">{t.title}<div className="text-xs text-muted-foreground">{scopeLabel(t.scope)}</div></div><div className="flex gap-1"><Button type="button" variant="ghost" size="sm" disabled={busy||!subject.tribunal_data} onClick={()=>{setId(t.id);setTitle(t.title);setScope(t.scope);}}>Editar</Button><Button type="button" variant="ghost" size="sm" disabled={busy||!subject.tribunal_data} onClick={()=>{if(window.confirm("Remover este assunto? O histórico será preservado."))void save(t.id);}}>Excluir</Button></div></div>)}</div>
 <div className="space-y-2 border-t pt-3"><label className="text-sm font-medium" htmlFor="tribunal-topic-title">{id===undefined?"Novo assunto":"Editar assunto"}</label><Input id="tribunal-topic-title" value={title} onChange={e=>setTitle(e.target.value)} disabled={busy||!subject.tribunal_data}/><label className="text-sm font-medium" htmlFor="tribunal-topic-scope">Tribunal</label><select id="tribunal-topic-scope" className="w-full rounded-md border bg-background p-2 text-sm" value={scope} disabled={busy||!subject.tribunal_data} onChange={e=>setScope(e.target.value as TopicScope)}>{options.map(s=><option value={s} key={s}>{scopeLabel(s)}</option>)}</select><div className="flex gap-2"><Button disabled={busy||!title.trim()||!subject.tribunal_data} onClick={()=>void save()}>{id===undefined?"Adicionar assunto":"Salvar assunto"}</Button>{id!==undefined&&<Button variant="outline" onClick={reset}>Cancelar edição</Button>}</div></div>
 </DialogContent></Dialog>;
}
