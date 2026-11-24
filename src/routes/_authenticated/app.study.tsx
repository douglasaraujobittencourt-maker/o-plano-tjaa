import { localDateStr, addDaysStr } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubjects, getTodaySessions, logSession, updateSession, deleteSession, finalizeLesson, createSubject, markEditalTopicsStudied, announcePlannerProgress } from "@/lib/planner-api";
import {selectPlannerSubjects,topicsForSubject,isWritingSubject,subjectMatchesExam} from "@/lib/tribunal-subject-source";
import {ProgressTribunalDots,ProgressTribunalLegend} from "@/components/tribunal-progress-colors";
import {TribunalTopicEditor} from "@/components/tribunal-topic-editor";
import { BankExamSelector, useBankExam } from "@/components/bank-exam-provider";
import { idCanonicoAssunto } from "@/lib/edital-topic-equivalence";
import { scopeLabel } from "@/lib/tribunal-catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { PlayCircle, Pause, RotateCcw, Save, Pencil, Trash2, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStudyTimer } from "@/hooks/use-study-timer";
import { playAlarm } from "@/lib/alarm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


export const Route = createFileRoute("/_authenticated/app/study")({
  head: () => ({
    meta: [
      {"title": "Bora Estudar — O Plano"},
      {"name": "description", "content": "Registre suas sessões e acompanhe o tempo dedicado aos estudos."},
      {"property": "og:title", "content": "Bora Estudar — O Plano"},
      {"property": "og:description", "content": "Registre suas sessões e acompanhe o tempo dedicado aos estudos."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: StudyPage,
});

function StudyPage() {
  const { bank } = useBankExam();
  const qc = useQueryClient();
  const today = localDateStr();
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects, refetchInterval: 5000 });
  const { data: todaySessions = [] } = useQuery({ queryKey: ["today", today], queryFn: () => getTodaySessions(today) });

  const [subject, setSubject] = useState<string>("");
  const [kind, setKind] = useState<"leitura"|"video"|"questoes"|"redacao">("leitura");
  const [pages, setPages] = useState(0);
  const [videoMin, setVideoMin] = useState(0);
  const [q, setQ] = useState(0);
  const [qc2, setQc2] = useState(0);
  const [notes, setNotes] = useState("");
  const [editalAssunto,setEditalAssunto]=useState("");
  const [isLessonFinished,setIsLessonFinished]=useState(false);
  const [isSubjectFinished,setIsSubjectFinished]=useState(false);
  const [editingTopics,setEditingTopics]=useState(false);
  const bankSubjects=selectPlannerSubjects(subjects,bank);
  const selectedSubject=bankSubjects.find(s=>s.id===subject);
  const assuntosDoEdital=topicsForSubject(selectedSubject,bank);
  const assuntoSelecionado=assuntosDoEdital.find(a=>String(a.id)===editalAssunto);
  useEffect(()=>{
    if(subject&&!selectedSubject){setSubject("");setEditalAssunto("");setIsSubjectFinished(false);setIsLessonFinished(false);setKind("leitura");setEditingTopics(false);}
    else if(editalAssunto&&!assuntoSelecionado){setEditalAssunto("");setIsLessonFinished(false);setIsSubjectFinished(false);}
  },[subject,selectedSubject?.id,editalAssunto,assuntoSelecionado?.id]);
  const handleSelectSubject=(id:string)=>{
    const next=bankSubjects.find(s=>s.id===id);
    setSubject(id);setEditalAssunto("");setIsSubjectFinished(false);setIsLessonFinished(false);
    if(next&&isWritingSubject(next))setKind("redacao");
    else if(next?.study_status==="finalized")setKind("questoes");
    else if(kind==="redacao")setKind("leitura");
  };

  const timer = useStudyTimer();
  const [durationMin, setDurationMin] = useState<string>(String(Math.round(timer.duration / 60)));
  useEffect(() => { setDurationMin(String(Math.round(timer.duration / 60))); }, [timer.duration]);

  const applyDuration = () => {
    const n = Math.max(1, Math.min(24 * 60, Math.round(Number(durationMin) || 0)));
    timer.setDuration(n * 60);
  };

  // Alarme quando a contagem chega a zero
  const beepedRef = useRef(false);
  useEffect(() => {
    if (timer.remaining > 0) { beepedRef.current = false; return; }
    if (!timer.running || beepedRef.current) return;
    beepedRef.current = true;
    toast.success("Tempo esgotado! Registre sua sessão. ⏰");
    playAlarm();
  }, [timer.remaining, timer.running]);

  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
  const ss = String(timer.remaining % 60).padStart(2, "0");
  const pct = Math.min(100, Math.round((timer.elapsed / Math.max(1, timer.duration)) * 100));

  const save = useMutation({
    mutationFn: async () => {
      const timerMin = Math.max(1, Math.round(timer.elapsed / 60));
      const minutes = kind === "video" && videoMin > 0 ? videoMin : timerMin;
      const fresh=selectPlannerSubjects(await getSubjects(),bank);
      const chosen=fresh.find(s=>s.id===subject);
      const topic=topicsForSubject(chosen,bank).find(a=>String(a.id)===editalAssunto);
      if(!chosen||!topic)throw new Error("Selecione uma matéria e um assunto vinculado que ainda esteja cadastrado.");
      const materiaId=chosen.id;
      if((kind==="redacao")!==isWritingSubject(chosen))throw new Error("Selecione o tipo de estudo adequado à matéria.");
      if(isSubjectFinished&&(chosen.study_status!=="active"||isWritingSubject(chosen)))throw new Error("Somente uma matéria objetiva ativa pode avançar na fila.");
      await logSession({
        subject_id: materiaId,
        edital_assunto_id: idCanonicoAssunto(topic.id),
        topic: topic.topico_central,
        lesson: topic.topico_central,
        kind: kind === "video" ? "leitura" : kind,
        task: kind === "redacao" ? "Redação" : kind === "video" ? "Videoaula" : kind === "leitura" ? "Leitura de PDF" : "Questões",
        minutes,
        pages_read: pages,
        questions_done: q,
        questions_correct: qc2,
        notes,
        is_lesson_finished: isLessonFinished,
        is_subject_finished: isSubjectFinished || undefined,
      });
      return materiaId;
    },
    onSuccess: (materiaId) => {
      announcePlannerProgress();
      if (materiaId) setSubject(materiaId);
      if (isLessonFinished) {
        toast.success("Sessão registrada! Ciclo de revisões (7, 15, 30 e 60 dias) agendado com sucesso! 🎯");
      } else if (isSubjectFinished) {
        toast.success("Sessão registrada! Matéria atualizada para Modo Revisão 🎓");
      } else {
        toast.success("Sessão registrada! +XP ganho 🔥");
      }
      timer.reset();
      setPages(0); setVideoMin(0); setQ(0); setQc2(0); setNotes(""); setIsLessonFinished(false);setIsSubjectFinished(false);
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Edit / delete sessions
  type EditState = { id: string; subject_id: string; kind: "leitura"|"video"|"questoes"|"redacao"; minutes: number; pages_read: number; questions_done: number; questions_correct: number; notes: string };
  const [editSession, setEditSession] = useState<EditState | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const updateSess = useMutation({
    mutationFn: async () => {
      if (!editSession) return;
      await updateSession(editSession.id, {
        subject_id: editSession.subject_id || null,
        kind: editSession.kind === "video" ? "leitura" : editSession.kind,
        task: editSession.kind === "redacao" ? "Redação" : editSession.kind === "video" ? "Videoaula" : editSession.kind === "leitura" ? "Leitura de PDF" : "Questões",
        minutes: Math.max(1, editSession.minutes),
        pages_read: editSession.pages_read,
        questions_done: editSession.questions_done,
        questions_correct: editSession.questions_correct,
        notes: editSession.notes || null,
      });
    },
    onSuccess: () => { toast.success("Sessão atualizada"); setEditSession(null); announcePlannerProgress(); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });

  const delSess = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => { toast.success("Sessão excluída"); setDeleteSessionId(null); announcePlannerProgress(); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });


  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Bora Estudar
        </h1>
        <p className="text-muted-foreground text-sm">Cronômetro regressivo — você define o tempo. Continua rodando em 2º plano ao navegar entre as abas.</p>
      </div>

      <Card className="p-6 card-elevated text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Label className="text-xs text-muted-foreground">Duração (min)</Label>
          <Input
            type="number"
            min={1}
            className="w-24 h-8 text-center"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            onBlur={applyDuration}
            onKeyDown={(e) => { if (e.key === "Enter") applyDuration(); }}
            disabled={timer.running}
          />
          <Button size="sm" variant="outline" onClick={applyDuration} disabled={timer.running}>Definir</Button>
        </div>
        <div className="font-display text-7xl font-bold tabular-nums gradient-text">{mm}:{ss}</div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-4">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">Tempo estudado: {Math.floor(timer.elapsed/60)}min {timer.elapsed%60}s</div>
        <div className="flex justify-center gap-3 mt-4">
          <Button onClick={() => (timer.running ? timer.pause() : timer.start())} size="lg" variant={timer.running ? "outline" : "default"}>
            {timer.running ? <><Pause className="w-4 h-4 mr-1" /> Pausar</> : <><PlayCircle className="w-4 h-4 mr-1" /> {timer.elapsed > 0 ? "Retomar" : "Iniciar"}</>}
          </Button>
          <Button onClick={timer.reset} size="lg" variant="ghost"><RotateCcw className="w-4 h-4 mr-1" /> Zerar</Button>
        </div>
      </Card>

      <Card className="p-6 card-elevated space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Detalhes da sessão</h2>
          <BankExamSelector />
        </div>
        <ProgressTribunalLegend />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Matéria</Label>
            <Select value={subject} onValueChange={handleSelectSubject}>
              <SelectTrigger><SelectValue placeholder="Escolha a matéria" /></SelectTrigger>
              <SelectContent>
                {bankSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <ProgressTribunalDots subject={s} bank={bank} />
                      <span>{s.name}</span>
                      {s.study_status === "finalized" && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                          🎓 Modo Revisão
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {subject && (() => {
              const sel = subjects.find((s) => s.id === subject);
              return sel ? (
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>📖 Lido: <strong className="text-foreground">{sel.pages_read}</strong> de {sel.pages || 0} pgs</span>
                  <span className={sel.study_status === "finalized" ? "font-semibold text-primary" : "font-semibold text-secondary dark:text-foreground"}>
                    {sel.study_status === "finalized" ? "🎓 Teoria Finalizada" : "📘 Modo Teoria"}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <Label>Tipo de Estudo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leitura">Leitura / Teoria</SelectItem>
                <SelectItem value="video">Videoaulas / Teoria</SelectItem>
                <SelectItem value="questoes">Revisão / Questões</SelectItem>
                <SelectItem value="redacao">Discursiva / Redação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind === "video" ? (
            <div><Label>Minutos de videoaula assistidos</Label><Input type="number" min={0} value={videoMin || ""} placeholder="Usa o tempo do cronômetro" onChange={(e) => setVideoMin(+e.target.value)} /></div>
          ) : (
            <div><Label>Páginas lidas</Label><Input type="number" min={0} value={pages} onChange={(e) => setPages(+e.target.value)} /></div>
          )}
          <div><Label>Questões feitas</Label><Input type="number" min={0} value={q} onChange={(e) => setQ(+e.target.value)} /></div>
          <div><Label>Questões corretas</Label><Input type="number" min={0} value={qc2} onChange={(e) => setQc2(+e.target.value)} /></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2"><Label>Assunto / Conteúdo (obrigatório)</Label>{selectedSubject&&<Button type="button" variant="outline" size="sm" onClick={()=>setEditingTopics(true)}>Gerenciar assuntos</Button>}</div>
          <Select value={editalAssunto} onValueChange={v=>{setEditalAssunto(v);setIsLessonFinished(false);}} disabled={!selectedSubject||!assuntosDoEdital.length}>
            <SelectTrigger><SelectValue placeholder={!selectedSubject?"Escolha a matéria primeiro":!assuntosDoEdital.length?"Nenhum assunto cadastrado":"Selecione o assunto"} /></SelectTrigger>
            <SelectContent>{assuntosDoEdital.map(a=><SelectItem key={a.id} value={String(a.id)}>{a.topico_central} · {scopeLabel(a.escopo)}</SelectItem>)}</SelectContent>
          </Select>
          {selectedSubject&&!assuntosDoEdital.length&&<p className="text-xs text-muted-foreground">Cadastre um assunto antes de registrar a sessão.</p>}
          <p className="text-xs text-muted-foreground">Assuntos filtrados pela matéria e pelo tribunal ativo, na mesma base dos quadros de PDFs e videoaulas.</p>
        </div>
        {selectedSubject&&<TribunalTopicEditor open={editingTopics} onOpenChange={setEditingTopics} subject={selectedSubject}/>}
        <div>
          <Label>Aula / Tópico / Notas</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Aula 02 - Atos Administrativos ou pág. 45 a 70"
          />
        </div>

        <div className="pt-3 border-t border-border/50 space-y-2.5">
          {/* Opção 1: Aula finalizada */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Checkbox
              id="lessonFinished"
              checked={isLessonFinished}
              onCheckedChange={(checked) => setIsLessonFinished(!!checked)}
              className="mt-0.5"
            />
            <div className="space-y-0.5 leading-none">
              <Label htmlFor="lessonFinished" className="text-sm font-semibold cursor-pointer text-foreground">
                Aula / Conteúdo finalizado?
              </Label>
              <p className="text-xs text-muted-foreground">
                Inicia a automação de revisões espaçadas para esta aula em <strong>7, 15, 30 e 60 dias</strong>.
              </p>
            </div>
          </div>

          {/* Opção 2: Matéria inteira finalizada */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <Checkbox
              id="subjectFinished"
              checked={isSubjectFinished}
              disabled={selectedSubject?.study_status!=="active" || (!!selectedSubject&&isWritingSubject(selectedSubject))}
              onCheckedChange={(checked) => setIsSubjectFinished(!!checked)}
              className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="space-y-0.5 leading-none">
              <Label htmlFor="subjectFinished" className="text-sm font-semibold cursor-pointer text-foreground flex items-center gap-1.5">
                Matéria finalizada (Teoria 100% concluída)? 🎓
              </Label>
              <p className="text-xs text-muted-foreground">
                Confirme apenas quando tiver concluído todos os assuntos dos dois tribunais desta matéria. Ela vai para revisão e a próxima da fila assume sua carga.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending || timer.elapsed < 5 || !selectedSubject || !assuntoSelecionado} className="w-full">
          <Save className="w-4 h-4 mr-1" /> Registrar sessão ({Math.max(1, Math.round(timer.elapsed/60))} min)
        </Button>
      </Card>

      <Card className="p-5 card-elevated">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Sessões de hoje ({todaySessions.length})</h2>
          {todaySessions.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              📖 {todaySessions.reduce((acc: number, s: any) => acc + (s.pages_read ?? 0), 0)} páginas lidas hoje
            </span>
          )}
        </div>
        {todaySessions.length === 0 && <p className="text-sm text-muted-foreground">Nada registrado ainda hoje.</p>}
        <ul className="space-y-2">
          {todaySessions.map((s: any) => (
            <li key={s.id} className="flex items-center gap-3 text-sm p-2 rounded-md border border-border/50">
              {(()=>{const live=subjects.find(m=>m.id===s.subject_id)??s.subject;return live?<ProgressTribunalDots subject={live} bank={subjectMatchesExam(live,bank)?bank:"bnb"}/>:null;})()}
              <span className="flex-1">{subjects.find(m=>m.id===s.subject_id)?.name??s.subject?.name??"Sem matéria"} · <span className="text-muted-foreground">{s.task === "Videoaula" ? "Videoaula" : s.kind === "leitura" ? "Leitura" : s.kind === "questoes" ? "Questões" : s.kind}</span>{s.lesson&&<span className="block text-xs text-muted-foreground">{subjects.flatMap(m=>topicsForSubject(m,"bnb")).find(a=>a.id===s.edital_assunto_id)?.topico_central??s.lesson}</span>}</span>
              <span className="text-muted-foreground text-xs">{s.minutes} min · {s.pages_read} pg · {s.questions_correct}/{s.questions_done} q</span>
              <Button size="icon" variant="ghost" onClick={() => setEditSession({
                id: s.id, subject_id: s.subject_id ?? "", kind: s.kind === "redacao" ? "redacao" : s.task === "Videoaula" ? "video" : s.kind === "questoes" ? "questoes" : "leitura", minutes: s.minutes,
                pages_read: s.pages_read, questions_done: s.questions_done, questions_correct: s.questions_correct,
                notes: s.notes ?? "",
              })}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setDeleteSessionId(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={!!editSession} onOpenChange={(o) => !o && setEditSession(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar sessão</DialogTitle></DialogHeader>
          {editSession && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Matéria</Label>
                  <Select value={editSession.subject_id} disabled>
                    <SelectTrigger><SelectValue placeholder="Sem matéria" /></SelectTrigger>
                    <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}><span className="flex items-center gap-2"><ProgressTribunalDots subject={s} bank={subjectMatchesExam(s,bank)?bank:"bnb"}/>{s.name}</span></SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Estudo</Label>
                  <Select value={editSession.kind} onValueChange={(v) => setEditSession({ ...editSession, kind: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leitura">Leitura / Teoria</SelectItem>
                      <SelectItem value="video">Videoaulas / Teoria</SelectItem>
                      <SelectItem value="questoes">Revisão / Questões</SelectItem>
                      <SelectItem value="redacao">Discursiva / Redação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Minutos</Label><Input type="number" min={1} value={editSession.minutes} onChange={(e) => setEditSession({ ...editSession, minutes: +e.target.value })} /></div>
                <div><Label>Páginas lidas</Label><Input type="number" min={0} value={editSession.pages_read} onChange={(e) => setEditSession({ ...editSession, pages_read: +e.target.value })} /></div>
                <div><Label>Questões feitas</Label><Input type="number" min={0} value={editSession.questions_done} onChange={(e) => setEditSession({ ...editSession, questions_done: +e.target.value })} /></div>
                <div><Label>Questões corretas</Label><Input type="number" min={0} value={editSession.questions_correct} onChange={(e) => setEditSession({ ...editSession, questions_correct: +e.target.value })} /></div>
              </div>
              <div><Label>Notas</Label><Input value={editSession.notes} onChange={(e) => setEditSession({ ...editSession, notes: e.target.value })} /></div>
              <Button onClick={() => updateSess.mutate()} disabled={updateSess.isPending} className="w-full">Salvar alterações</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSessionId} onOpenChange={(o) => !o && setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSessionId && delSess.mutate(deleteSessionId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

