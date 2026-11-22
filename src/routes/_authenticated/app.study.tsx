import { localDateStr, addDaysStr } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubjects, getTodaySessions, logSession, updateSession, deleteSession, finalizeLesson, createSubject, markEditalTopicsStudied, announcePlannerProgress } from "@/lib/planner-api";
import { getEditalCatalog } from "@/lib/edital-catalog";
import { BankExamSelector, useBankExam } from "@/components/bank-exam-provider";
import { bankMatterNumbers, bankTopicAllowed, bankTopicsForMatter, subjectBelongsToBank, subjectMatterNumber, subjectTopicIds } from "@/lib/bank-exams";
import { idCanonicoAssunto } from "@/lib/edital-topic-equivalence";
import { loadBnbCatalog, corMateriaBnb } from "@/lib/edital-bnb-data";
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
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects });
  const { data: todaySessions = [] } = useQuery({ queryKey: ["today", today], queryFn: () => getTodaySessions(today) });
  const { data: editalCatalog } = useQuery({queryKey: ["edital-catalog"], queryFn: getEditalCatalog, staleTime: 60_000});
  const { data: bnbCatalog } = useQuery({queryKey: ["edital-bnb-catalog"], queryFn: loadBnbCatalog, staleTime: Infinity});

  const [subject, setSubject] = useState<string>("");
  const [kind, setKind] = useState<"leitura"|"video"|"questoes">("leitura");
  const [pages, setPages] = useState(0);
  const [videoMin, setVideoMin] = useState(0);
  const [q, setQ] = useState(0);
  const [qc2, setQc2] = useState(0);
  const [notes, setNotes] = useState("");
  const [editalMateria, setEditalMateria] = useState("");
  const [editalAssunto, setEditalAssunto] = useState("");
  const bankSubjects = subjects.filter(s => subjectBelongsToBank(s.name, bank));
  const bankMaterias = bankMatterNumbers(bank, editalCatalog, bnbCatalog);
  useEffect(() => {
    setSubject("");
    setEditalMateria("");
    setEditalAssunto("");
  }, [bank]);
  const materiaBnbSelecionada = bnbCatalog?.materias.find(m => String(m.numero) === editalMateria);
  const assuntosDoEdital = bankTopicsForMatter(Number(editalMateria), bank, editalCatalog, bnbCatalog)
    .sort((a,b) => a.id - b.id);
  const assuntoSelecionado = assuntosDoEdital.find(a => String(a.id) === editalAssunto);
  const selecionarMateriaDoEdital = (numero: string) => {
    setEditalMateria(numero);
    setEditalAssunto("");
    const materiaBnb = bnbCatalog?.materias.find(m => String(m.numero) === numero);
    if (materiaBnb) {
      const materiaExistente = subjects.find(s => s.name === "BNB: " + materiaBnb.titulo_central);
      setSubject(materiaExistente?.id ?? "");
      setIsSubjectFinished(materiaExistente?.study_status === "finalized");
    } else {
      // Evita registrar uma sessão BB/Caixa numa matéria BNB selecionada antes.
      const selecionada = subjects.find(s => s.id === subject);
      if (selecionada?.name.startsWith("BNB: ")) {
        setSubject("");
        setIsSubjectFinished(false);
      }
    }
  };
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [isSubjectFinished, setIsSubjectFinished] = useState(false);

  const handleSelectSubject = (val: string) => {
    setSubject(val);
    const selected = bankSubjects.find(s => s.id === val);
    const linked = selected ? subjectMatterNumber(selected.name, bank) : null;
    setEditalMateria(linked != null && bankMaterias.includes(linked) ? String(linked) : "");
    setEditalAssunto("");
    const sel = subjects.find((s) => s.id === val);
    if (sel) {
      const isFin = sel.study_status === "finalized";
      setIsSubjectFinished(isFin);
      if (isFin) {
        setKind("questoes");
      }
    } else {
      setIsSubjectFinished(false);
    }
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
      if (!assuntoSelecionado || !editalMateria || !bankMaterias.includes(Number(editalMateria))) {
        throw new Error("Selecione uma matéria e o assunto específico do concurso ativo para registrar o estudo.");
      }
      if (bank !== "bnb" && "escopo" in assuntoSelecionado &&
          !bankTopicAllowed(assuntoSelecionado, bank)) {
        throw new Error("Este assunto não pertence ao concurso ativo.");
      }
      if (subject && !bankSubjects.some(s => s.id === subject)) {
        throw new Error("A matéria do planner não pertence ao concurso selecionado.");
      }
      let materiaId: string | null = subject || null;
      // BNB: a matéria pode ser escolhida diretamente no edital, sem cadastro manual.
      // Só cria uma matéria do planner quando o usuário efetivamente registra a sessão.
      if (materiaBnbSelecionada) {
        const nome = "BNB: " + materiaBnbSelecionada.titulo_central;
        // Consulta a lista atual antes de criar, para não duplicar a matéria
        // se o usuário já a cadastrou em outra sessão ou dispositivo.
        const materiasAtuais = await getSubjects();
        const existente = materiasAtuais.find(s => s.name === nome);
        materiaId = existente?.id ?? await createSubject({name:nome,color:corMateriaBnb(materiaBnbSelecionada.categoria)});
      }
      if (assuntoSelecionado && !materiaId) throw new Error("Escolha a matéria do planner para vincular o assunto.");
      if (isSubjectFinished && materiaId) {
        const nomeMateria = subjects.find(s => s.id === materiaId)?.name ??
          (materiaBnbSelecionada ? "BNB: " + materiaBnbSelecionada.titulo_central : "");
        const topicos = subjectTopicIds(nomeMateria, bank, editalCatalog, bnbCatalog);
        if (!topicos.length) throw new Error("A matéria não possui assuntos mapeados neste edital.");
        await markEditalTopicsStudied(materiaId, topicos);
      } else if (isLessonFinished && materiaId && assuntoSelecionado) {
        await markEditalTopicsStudied(materiaId, [idCanonicoAssunto(assuntoSelecionado.id)]);
      }
      await logSession({
        subject_id: materiaId,
        edital_assunto_id: assuntoSelecionado ? idCanonicoAssunto(assuntoSelecionado.id) : null,
        topic: assuntoSelecionado?.topico_central,
        lesson: assuntoSelecionado?.topico_central ?? null,
        kind: kind === "video" ? "leitura" : kind,
        task: kind === "video" ? "Videoaula" : kind === "leitura" ? "Leitura de PDF" : "Questões",
        minutes,
        pages_read: pages,
        questions_done: q,
        questions_correct: qc2,
        notes,
        is_lesson_finished: isLessonFinished,
        is_subject_finished: materiaId ? isSubjectFinished : undefined,
      });
      return materiaId;
    },
    onSuccess: (materiaId) => {
      announcePlannerProgress();
      if (materiaBnbSelecionada && materiaId) setSubject(materiaId);
      if (isLessonFinished) {
        toast.success("Sessão registrada! Ciclo de revisões (7, 15, 30 e 60 dias) agendado com sucesso! 🎯");
      } else if (isSubjectFinished) {
        toast.success("Sessão registrada! Matéria atualizada para Modo Revisão 🎓");
      } else {
        toast.success("Sessão registrada! +XP ganho 🔥");
      }
      timer.reset();
      setPages(0); setVideoMin(0); setQ(0); setQc2(0); setNotes(""); setIsLessonFinished(false);
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Edit / delete sessions
  type EditState = { id: string; subject_id: string; kind: "leitura"|"video"|"questoes"; minutes: number; pages_read: number; questions_done: number; questions_correct: number; notes: string };
  const [editSession, setEditSession] = useState<EditState | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const updateSess = useMutation({
    mutationFn: async () => {
      if (!editSession) return;
      await updateSession(editSession.id, {
        subject_id: editSession.subject_id || null,
        kind: editSession.kind === "video" ? "leitura" : editSession.kind,
        task: editSession.kind === "video" ? "Videoaula" : editSession.kind === "leitura" ? "Leitura de PDF" : "Questões",
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
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>Matéria</Label>
            <Select value={subject} onValueChange={handleSelectSubject}>
              <SelectTrigger><SelectValue placeholder="Escolha a matéria" /></SelectTrigger>
              <SelectContent>
                {bankSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color || "#0284C7" }} />
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
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Matéria do Edital Verticalizado</Label>
            <Select value={editalMateria} onValueChange={selecionarMateriaDoEdital}>
              <SelectTrigger><SelectValue placeholder="Selecionar matéria do concurso" /></SelectTrigger>
              <SelectContent>
                {bank === "bnb"
                  ? (bnbCatalog?.materias ?? []).filter(m => bankMaterias.includes(m.numero)).map(m => (
                      <SelectItem key={m.numero} value={String(m.numero)}>
                        BNB · {m.titulo_central}
                      </SelectItem>
                    ))
                  : (editalCatalog?.materias ?? []).filter(m => bankMaterias.includes(m.numero)).map(m => (
                      <SelectItem key={m.numero} value={String(m.numero)}>
                        {m.titulo_central.replace(/^\d+\.\s*/, "")}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Assunto específico do edital (obrigatório)</Label>
            <Select value={editalAssunto} onValueChange={setEditalAssunto} disabled={!editalMateria || (!subject && !materiaBnbSelecionada)}>
              <SelectTrigger><SelectValue placeholder="Selecionar assunto obrigatório" /></SelectTrigger>
              <SelectContent>
                {assuntosDoEdital.map(a=><SelectItem key={a.id} value={String(a.id)}>{a.topico_central}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground md:col-span-2">O banco ativo restringe as matérias e os assuntos. Vincule sempre o assunto exato: o progresso é sincronizado pelo ID canônico também nos editais equivalentes.</p>
        </div>
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
              onCheckedChange={(checked) => setIsSubjectFinished(!!checked)}
              className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <div className="space-y-0.5 leading-none">
              <Label htmlFor="subjectFinished" className="text-sm font-semibold cursor-pointer text-foreground flex items-center gap-1.5">
                Matéria finalizada (Teoria 100% concluída)? 🎓
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca a matéria inteira como concluída e a transfere para o <strong>Modo Revisão</strong> (foco em questões semanais).
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending || timer.elapsed < 5} className="w-full">
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
              <span className="w-2 h-2 rounded-full" style={{ background: s.subject?.color ?? "#666" }} />
              <span className="flex-1">{s.subject?.name ?? "Sem matéria"} · <span className="text-muted-foreground">{s.task === "Videoaula" ? "Videoaula" : s.kind === "leitura" ? "Leitura" : s.kind === "questoes" ? "Questões" : s.kind}</span></span>
              <span className="text-muted-foreground text-xs">{s.minutes} min · {s.pages_read} pg · {s.questions_correct}/{s.questions_done} q</span>
              <Button size="icon" variant="ghost" onClick={() => setEditSession({
                id: s.id, subject_id: s.subject_id ?? "", kind: s.task === "Videoaula" ? "video" : s.kind === "questoes" ? "questoes" : "leitura", minutes: s.minutes,
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
                  <Select value={editSession.subject_id} onValueChange={(v) => setEditSession({ ...editSession, subject_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sem matéria" /></SelectTrigger>
                    <SelectContent>{bankSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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

