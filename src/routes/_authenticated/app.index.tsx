import { localDateStr, addDaysStr } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import tribunaisHeaderEmblem from "@/assets/tribunais-header-emblem.svg";
import { ProfileMenu } from "@/components/profile-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, getSubjects, getDueReviews, completeReview, deleteReview, clearAllPendingReviews, getReviewLayerLabel, getSessionsBetween, getAllSessions, updateSubject, createSubject, deleteSubject, updateProfile, getTodaySessions } from "@/lib/planner-api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Brain, TrendingUp, Pencil, Clock, BarChart3, BookOpen, Plus, Trash2, Check, CheckCircle2, RefreshCw, Award, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ProgressCarousel } from "@/components/progress-carousel";
import { BankExamSelector, useBankExam } from "@/components/bank-exam-provider";
import {selectPlannerSubjects,categoryChoices} from "@/lib/tribunal-subject-source";
import {ProgressTribunalDots,ProgressTribunalLegend} from "@/components/tribunal-progress-colors";
import {archiveTribunalSubject} from "@/lib/planner-api";
import { sumStudyMinutes, studyMinutesBy } from "@/lib/study-metrics";
import { corBolinhaVisaoGeral } from "@/lib/caixa-subject-colors";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      {"title": "Visão geral — O Plano"},
      {"name": "description", "content": "Acompanhe seu progresso, suas metas e seus estudos para concursos."},
      {"property": "og:title", "content": "Visão geral — O Plano"},
      {"property": "og:description", "content": "Acompanhe seu progresso, suas metas e seus estudos para concursos."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: Dashboard,
});

function daysUntil(dateStr?: string | null) {
  if (!dateStr || dateStr === "Pré-edital" || dateStr === "pre-edital") return null;
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getSubjectSigla(name: string): string {
  if (!name) return "";
  const cleaned = name.trim();
  if (cleaned.length <= 2) return cleaned.toUpperCase();

  const map: Record<string, string> = {
    "Português": "PT",
    "Língua Portuguesa": "PT",
    "Direito Constitucional": "DC",
    "Direito Administrativo": "DA",
    "Raciocínio Lógico": "RL",
    "Raciocínio Lógico Matemático": "RL",
    "Auditoria": "AU",
    "Auditoria Fiscal": "AF",
    "Tecnologia da Informação": "TI",
    "Conhecimentos Gerais": "CG",
    "Conhecimentos Específicos": "CE",
    "Legislação Específica": "LE",
    "Direito Tributário": "DT",
    "Contabilidade Geral": "CG",
    "Contabilidade Avançada": "CA",
    "Redação": "RE",
    "Finanças Públicas": "FP",
  };

  if (map[cleaned]) return map[cleaned];

  const words = cleaned.split(/\s+/).filter((w) => !/^(de|e|da|do|dos|das|para|com|a|o)$/i.test(w));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.substring(0, 2).toUpperCase();
}

function Dashboard() {
  const { bank } = useBankExam();
  const today = localDateStr();
  const now = new Date();
  const dow = now.getDay();
  const daysSinceMonday = (dow + 6) % 7;
  const weekStart = addDaysStr(-daysSinceMonday);
  const monthStart = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));

  const qc = useQueryClient();

  const refreshAllData = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["subjects"] }),
      qc.invalidateQueries({ queryKey: ["edital-catalog"] }),
      qc.invalidateQueries({ queryKey: ["all-sessions"] }),
      qc.invalidateQueries({ queryKey: ["week"] }),
      qc.invalidateQueries({ queryKey: ["month"] }),
      qc.invalidateQueries({ queryKey: ["sessions"] }),
      qc.invalidateQueries({ queryKey: ["profile"] }),
      qc.invalidateQueries({ queryKey: ["reviews-due"] }),
      qc.invalidateQueries({ queryKey: ["all-reviews"] }),
      qc.invalidateQueries({ queryKey: ["cards-due"] }),
      qc.invalidateQueries({ queryKey: ["cards-all"] }),
      qc.invalidateQueries({ queryKey: ["subjects-list"] }),
      qc.invalidateQueries({ queryKey: ["subjects-blocks"] }),
      qc.invalidateQueries({ queryKey: ["cycle"] }),
      qc.invalidateQueries({ queryKey: ["cycle-slots"] }),
      qc.invalidateQueries({ queryKey: ["today"] }),
      qc.invalidateQueries({ queryKey: ["perf"] }),
      qc.invalidateQueries({ queryKey: ["week-redacoes"] }),
    ]);
  };

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const { user } = Route.useRouteContext();
  const greetingName = profile?.display_name?.trim() ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] || "Estudante";
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects, refetchInterval: 5000 });
  const { data: dueReviews = [] } = useQuery({ queryKey: ["reviews-due", today], queryFn: () => getDueReviews(today) });
  const { data: weekSessions = [] } = useQuery({ queryKey: ["week", weekStart, today], queryFn: () => getSessionsBetween(weekStart, today) });
  const { data: monthSessions = [] } = useQuery({ queryKey: ["month", monthStart, today], queryFn: () => getSessionsBetween(monthStart, today) });
  const { data: allSessions = [] } = useQuery({ queryKey: ["all-sessions"], queryFn: getAllSessions });

  const doneReview = useMutation({
    mutationFn: ({ id, layer }: { id: string; layer: number }) => completeReview(id, layer),
    onSuccess: () => {
      toast.success("Revisão concluída! 🧠✨");
      qc.invalidateQueries({ queryKey: ["reviews-due"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao concluir revisão"),
  });

  const delReview = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      toast.success("Revisão descartada.");
      qc.invalidateQueries({ queryKey: ["reviews-due"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao descartar revisão"),
  });

  const clearOldReviews = useMutation({
    mutationFn: () => clearAllPendingReviews(),
    onSuccess: () => {
      toast.success("Revisões pendentes limpas com sucesso!");
      qc.invalidateQueries({ queryKey: ["reviews-due"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao limpar revisões"),
  });

  const yesterday = addDaysStr(-1);
  const { data: yesterdaySessions = [] } = useQuery({ queryKey: ["sessions", yesterday], queryFn: () => getTodaySessions(yesterday) });
  const { data: todaySessions = [] } = useQuery({ queryKey: ["sessions", today], queryFn: () => getTodaySessions(today) });

  // Estatísticas de horas
  const todayMinutes = sumStudyMinutes(todaySessions);
  const todayHours = +(todayMinutes / 60).toFixed(1);

  const yesterdayMinutes = sumStudyMinutes(yesterdaySessions);
  const yesterdayHours = +(yesterdayMinutes / 60).toFixed(1);

  const weekMinutes = sumStudyMinutes(weekSessions);
  const weekHours = +(weekMinutes / 60).toFixed(1);
  const monthHours = +(sumStudyMinutes(monthSessions) / 60).toFixed(1);

  const goalH = profile?.weekly_goal_hours ?? 28;
  const daysLeft = daysUntil(profile?.exam_date);

  // Horas por matéria
  const weekHoursBySubject = Object.fromEntries(
    Object.entries(studyMinutesBy(weekSessions, "subject_id")).map(([id, minutes]) => [id, minutes / 60]),
  );

  const readingHoursBySubject: Record<string, number> = {};
  const videoHoursBySubject: Record<string, number> = {};
  allSessions.filter((s: any) => s.kind === "leitura").forEach((s: any) => {
    if (!s.subject_id) return;
    const target = s.task === "Videoaula" ? videoHoursBySubject : readingHoursBySubject;
    target[s.subject_id] = (target[s.subject_id] ?? 0) + (s.minutes ?? 0) / 60;
  });

  // Um único filtro rege PDFs, videoaulas, horas semanais e o gráfico.
  const bankSubjects = selectPlannerSubjects(subjects,bank);
  // Horas semanais por matéria
  const weeklySubjectData = bankSubjects.map((s) => {
    const planejado = s.planned_hours_per_week ?? 0;
    const feito = +(weekHoursBySubject[s.id] ?? 0).toFixed(1);
    const restante = Math.max(0, +(planejado - feito).toFixed(1));
    const sigla = getSubjectSigla(s.name);
    return { ...s, sigla, planejado, feito, restante };
  });

  const totalWeeklyPlanned = weeklySubjectData.reduce((a, s) => a + s.planejado, 0);
  const totalWeeklyDone = +weeklySubjectData.reduce((a, s) => a + s.feito, 0).toFixed(1);
  const totalWeeklyRemaining = +weeklySubjectData.reduce((a, s) => a + s.restante, 0).toFixed(1);

  // Tabela: Progresso de Leitura de PDFs
  const pdfProgressData = bankSubjects.map((s) => {
    const totalPages = s.pages || 0;
    const pagesRead = s.pages_read || 0;
    const pagesRemaining = Math.max(0, totalPages - pagesRead);
    const pct = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
    const readingHours = +(readingHoursBySubject[s.id] ?? 0).toFixed(1);
    const videoHours = +(videoHoursBySubject[s.id] ?? 0).toFixed(1);
    const pagsPerHour = readingHours > 0 && pagesRead > 0 ? +(pagesRead / readingHours).toFixed(1) : 0;
    const hoursRemaining = pagsPerHour > 0 ? +(pagesRemaining / pagsPerHour).toFixed(1) : 0;

    return {
      ...s,
      totalPages,
      pagesRead,
      pagesRemaining,
      pct,
      readingHours,
      videoHours,
      pagsPerHour,
      hoursRemaining,
    };
  });

  const totalPdfPages = pdfProgressData.reduce((a, s) => a + s.totalPages, 0);
  const totalPdfPagesRead = pdfProgressData.reduce((a, s) => a + s.pagesRead, 0);
  const totalPdfPagesRemaining = pdfProgressData.reduce((a, s) => a + s.pagesRemaining, 0);
  const videoProgressData = bankSubjects.map((s: any) => {
    const totalMin = s.video_minutes_total || 0;
    const watchedMin = s.video_minutes_watched || 0;
    const remainingMin = Math.max(0, totalMin - watchedMin);
    const pct = totalMin > 0 ? Math.min(100, Math.round((watchedMin / totalMin) * 100)) : 0;
    return { ...s, totalMin, watchedMin, remainingMin, pct };
  });
  const totalVideoMin = videoProgressData.reduce((a, s) => a + s.totalMin, 0);
  const totalVideoWatched = videoProgressData.reduce((a, s) => a + s.watchedMin, 0);
  const totalVideoRemaining = videoProgressData.reduce((a, s) => a + s.remainingMin, 0);
  const totalVideoPct = totalVideoMin > 0 ? Math.min(100, Math.round((totalVideoWatched / totalVideoMin) * 100)) : 0;
  const fmtH = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
  const totalPdfPct = totalPdfPages > 0 ? Math.round((totalPdfPagesRead / totalPdfPages) * 100) : 0;
  const totalPdfReadingHours = +pdfProgressData.reduce((a, s) => a + s.readingHours, 0).toFixed(1);
  const totalPdfPagsPerHour = totalPdfReadingHours > 0 && totalPdfPagesRead > 0 ? +(totalPdfPagesRead / totalPdfReadingHours).toFixed(1) : 0;
  const totalPdfHoursRemaining = totalPdfPagsPerHour > 0 ? +(totalPdfPagesRemaining / totalPdfPagsPerHour).toFixed(1) : 0;

  // Modais de Edição
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0284C7");
  const [plannedHours, setPlannedHours] = useState("4");
  const [pages, setPages] = useState("0");
  const [pagesRead, setPagesRead] = useState("0");
  const [videoTotalH, setVideoTotalH] = useState("0");
  const [videoWatchedH, setVideoWatchedH] = useState("0");

  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalHoursInput, setGoalHoursInput] = useState(String(goalH));

  const [isEditingExamDate, setIsEditingExamDate] = useState(false);
  const [examDateInput, setExamDateInput] = useState(profile?.exam_date || "");

  // Edição rápida de horas planejadas na própria tabela
  const [inlinePlannedHours, setInlinePlannedHours] = useState<Record<string, string>>({});

  const handleInlinePlannedChange = (id: string, val: string) => {
    setInlinePlannedHours((prev) => ({ ...prev, [id]: val }));
  };

  const handleInlinePlannedSave = async (s: any) => {
    const valStr = inlinePlannedHours[s.id];
    if (valStr === undefined) return;
    const num = Number(valStr);
    if (isNaN(num) || num < 0) return;

    try {
      await updateSubject(s.id, { planned_hours_per_week: num });
      await refreshAllData();
      toast.success(`Horas planejadas de ${s.name} atualizadas para ${num}h!`);
    } catch (e: any) {
      toast.error("Erro ao salvar horas planejadas");
    }
  };

  const [editMode, setEditMode] = useState<"all" | "pdf" | "video">("all");
  const [newCategory,setNewCategory]=useState("both-specific");

  const openEditSubject = (s: any, mode: "all" | "pdf" | "video" = "all") => {
    setEditMode(mode);
    setEditingSubject(s);
    setName(s.name);
    // A cor mostrada no editor deve ser a mesma da bolinha exibida na Visão geral.
    setColor(corBolinhaVisaoGeral(s.name, s.color));
    setPlannedHours(String(s.planned_hours_per_week ?? 0));
    setPages(String(s.pages || 0));
    setPagesRead(String(s.pages_read || 0));
    setVideoTotalH(String(+((s.video_minutes_total || 0) / 60).toFixed(2)));
    setVideoWatchedH(String(+((s.video_minutes_watched || 0) / 60).toFixed(2)));
  };

  const saveSubjectChanges = async () => {
    if (!editingSubject) return;
    try {
      const planned = Math.max(0, Number(plannedHours) || 0);
      if(!name.trim()||subjects.some(s=>s.id!==editingSubject.id&&s.name.toLocaleLowerCase("pt-BR")===name.trim().toLocaleLowerCase("pt-BR")))throw new Error("Informe um nome único para a matéria.");
      await updateSubject(editingSubject.id, {
        name: name.trim(),
        color,
        planned_hours_per_week: planned,
        ...(editMode !== "video" ? {
          pages: Number(pages) || 0,
          pages_read: Number(pagesRead) || 0,
        } : {}),
        ...(editMode !== "pdf" ? {
          video_minutes_total: Math.round((Number(videoTotalH.replace(",", ".")) || 0) * 60),
          video_minutes_watched: Math.round((Number(videoWatchedH.replace(",", ".")) || 0) * 60),
        } : {}),
      });
      await refreshAllData();
      toast.success("Alterações salvas!");
      setEditingSubject(null);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar matéria");
    }
  };

  const handleDeleteSubject=async(id:string)=>{if(!window.confirm("Remover a matéria das listas? O histórico será preservado; a matéria sairá do ciclo."))return;try{await archiveTribunalSubject(id);await refreshAllData();setEditingSubject(null);toast.success("Matéria removida.");}catch(e:any){toast.error(e.message);}};

  const handleCreateSubject = async () => {
    if(subjects.some(s=>s.name===name.trim())){toast.error("Esta matéria já está cadastrada.");return;}
    if (!name.trim()) {
      toast.error("Insira o nome da matéria");
      return;
    }
    try {
      const planned = Math.max(0, Number(plannedHours) || 0);
      const selected=categoryChoices.find(c=>c.value===newCategory);
      if(!selected)throw new Error("Selecione uma categoria.");
      await createSubject({
        categories:selected.categories,
        name: name.trim(),
        color,
        planned_hours_per_week: planned,
        pages: Number(pages) || 0,
        pages_read: Number(pagesRead) || 0,
        video_minutes_total: Math.round((Number(videoTotalH.replace(",", ".")) || 0) * 60),
        video_minutes_watched: Math.round((Number(videoWatchedH.replace(",", ".")) || 0) * 60),
      });
      await refreshAllData();
      toast.success("Nova matéria criada!");
      setIsAddingSubject(false);
      setName("");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar matéria");
    }
  };

  const saveGoal = async () => {
    try {
      await updateProfile({ weekly_goal_hours: Number(goalHoursInput) || 28 });
      await refreshAllData();
      toast.success("Meta semanal atualizada!");
      setIsEditingGoal(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar meta");
    }
  };

  const saveExamDate = async () => {
    try {
      await updateProfile({ exam_date: examDateInput || null });
      await refreshAllData();
      toast.success("Data da prova atualizada!");
      setIsEditingExamDate(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar data da prova");
    }
  };

  const COLORS = ["#0284C7", "#7C3AED", "#15803D", "#D97706", "#DC2626", "#059669", "#4F46E5", "#DB2777"];

  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="min-w-0">
          <h1 className="min-w-0 break-words text-2xl font-bold leading-tight sm:text-3xl">
            Olá, {greetingName} 👋
          </h1>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
            <img src={tribunaisHeaderEmblem} alt="Emblema dos Tribunais" className="h-[36px] w-auto max-w-20 shrink-0 object-contain" />
            <span className="min-w-0 break-words">{profile?.exam_name || "TJGO + TJDFT"}</span>
          </p>
        </div>
        <div className="hidden shrink-0 md:col-start-2 md:row-start-1 md:block xl:col-start-3">
          <ProfileMenu name={greetingName} src={profile?.avatar_url} />
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center md:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:self-center">
          <Button
            variant="outline"
            onClick={() => {
              setName("");
              setColor("#0284C7");
              setPlannedHours("8");
              setPages("100");
              setPagesRead("0");
              setVideoTotalH("0");
              setVideoWatchedH("0");
              setIsAddingSubject(true);
            }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 text-primary" /> Nova Matéria
          </Button>
          <Link to="/app/study" className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-sm text-sm w-full sm:w-auto">
            <Clock className="w-4 h-4" /> Registrar Estudo
          </Link>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-3 justify-between items-center"><div><h2 className="flex items-center gap-3 mb-2" aria-label="Plano TJGO + TJDFT"><img src="/logos/tjgo.webp" alt="TJ Goiás" width={68} height={68} className="h-[68px] w-[68px] shrink-0 rounded-full object-cover ring-1 ring-border/50" /><img src="/logos/tjdft.webp" alt="TJDFT" width={68} height={68} className="h-[68px] w-[68px] shrink-0 rounded-full object-cover ring-1 ring-border/50" /></h2><p className="text-sm text-muted-foreground">Quatro matérias objetivas · discursiva semanal · fila por prioridade</p></div><Link to="/app/cycle" className="inline-flex items-center justify-center rounded-full border border-secondary bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 dark:rounded-none dark:border-transparent dark:bg-transparent dark:p-0 dark:text-primary dark:hover:bg-transparent dark:focus-visible:ring-primary">Abrir ciclo de estudos</Link></Card>
      {/* QUADRO DE DESTAQUE PRINCIPAL (CAMPOS SOLICITADOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Percentual Coberto do Edital */}
        <Card className="p-5 card-elevated border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-secondary dark:text-primary" /> % Coberto do Edital
            </span>
            <Badge variant="secondary" className="text-xs font-bold">
              {totalPdfPagesRead}/{totalPdfPages} pgs
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-secondary dark:text-foreground">{totalPdfPct}%</div>
            <Progress value={totalPdfPct} className="h-2 mt-2" />
          </div>
        </Card>

        {/* 2. Horas Estudadas no Dia */}
        <Card className="p-5 card-elevated border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-secondary dark:text-primary" /> Horas Estudadas Hoje
            </span>
            <Badge variant="outline" className="text-[10px]">
              {todaySessions.length} sessões
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-secondary dark:text-foreground">{todayHours}h</div>
            <p className="text-[11px] text-muted-foreground mt-1">Registradas hoje</p>
          </div>
        </Card>

        {/* 3. Horas Estudadas na Semana */}
        <Card className="p-5 card-elevated border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-secondary dark:text-primary" /> Horas na Semana
            </span>
            <Badge variant="outline" className="text-[10px]">
              Meta: {goalH}h
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold tracking-tight text-secondary dark:text-foreground">{weekHours}h</div>
            <Progress value={Math.min(100, (weekHours / goalH) * 100)} className="h-2 mt-2" />
          </div>
        </Card>

        <Card className="p-5 card-elevated border-l-4 border-l-secondary flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 shrink-0 text-secondary dark:text-primary" /> Horas Estudadas no Mês
          </span>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-secondary dark:text-foreground">{monthHours}h</div>
            <p className="text-[11px] text-muted-foreground mt-1">Mês atual</p>
          </div>
        </Card>

        {/* Quantidade de Dias para a Prova */}
        <Card
          onClick={() => {
            setExamDateInput(profile?.exam_date || "Pré-edital");
            setIsEditingExamDate(true);
          }}
          className="p-5 card-elevated border-l-4 border-l-secondary flex flex-col justify-between cursor-pointer hover:border-primary/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-secondary dark:text-primary" /> Dias para a Prova
            </span>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight break-words text-secondary dark:text-foreground">
              {profile?.exam_date === "Pré-edital" || profile?.exam_date === "pre-edital" || !profile?.exam_date ? (
                "Pré-edital"
              ) : daysLeft !== null ? (
                daysLeft >= 0 ? `${daysLeft} dias` : "Prova realizada!"
              ) : (
                "Pré-edital"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {profile?.exam_date && profile.exam_date !== "Pré-edital" && profile.exam_date !== "pre-edital" && !isNaN(new Date(profile.exam_date + "T00:00:00").getTime())
                ? new Date(profile.exam_date + "T00:00:00").toLocaleDateString("pt-BR")
                : "Fase Pré-edital"}
            </p>
          </div>
        </Card>
      </div>

      {/* SEÇÃO: REVISÕES DO DIA (Ciclo Espaçado: 7, 15, 30 e 60 dias) */}
      <Card className="p-5 card-elevated border-l-4 border-l-primary space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Revisões do Dia
                {dueReviews.length > 0 && (
                  <Badge variant="default" className="text-xs">
                    {dueReviews.length} {dueReviews.length === 1 ? "pendente" : "pendentes"}
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Revisões programadas para hoje pelo ciclo espaçado (7, 15, 30 e 60 dias).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dueReviews.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Deseja apagar todas as revisões pendentes?")) {
                    clearOldReviews.mutate();
                  }
                }}
                disabled={clearOldReviews.isPending}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 h-7"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar todas
              </Button>
            )}
            <Link
              to="/app/reviews"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        {dueReviews.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueReviews.map((r: any) => {
              const layerLabel = getReviewLayerLabel(r.layer);
              return (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border bg-card/60 hover:bg-muted/30 transition flex flex-col justify-between space-y-3 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: corBolinhaVisaoGeral(r.subject?.name, r.subject?.color) }}
                        />
                        <span className="truncate">{r.subject?.name}</span>
                      </span>
                      <Badge variant="secondary" className="text-[11px] font-bold shrink-0">
                        {layerLabel}
                      </Badge>
                    </div>
                    {r.topic && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        📝 {r.topic}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground">
                      Data: {r.next_review_date}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => delReview.mutate(r.id)}
                        disabled={delReview.isPending}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Descartar revisão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => doneReview.mutate({ id: r.id, layer: r.layer })}
                        disabled={doneReview.isPending}
                        className="h-7 text-xs flex items-center gap-1 px-2.5 font-medium hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Fiz
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 px-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-500/80 mb-1" />
            <p className="text-sm font-semibold text-foreground">Não há revisões a serem feitas</p>
            <p className="text-xs text-muted-foreground">
              Você está em dia com todas as revisões do cronograma de hoje! Novas revisões aparecerão automaticamente quando chegar o dia.
            </p>
          </div>
        )}
      </Card>

      {/* Tabela: Progresso de Leitura de PDFs */}
      <ProgressCarousel>
      <section className="h-full min-w-0 space-y-4 py-4 sm:py-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 shrink-0 text-primary" />
              Progresso de Leitura de PDFs
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tabela sincronizada em tempo real com todos os dados das matérias.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {totalPdfPct}% Concluído ({totalPdfPagesRead}/{totalPdfPages} pgs)
          </Badge>
        </div>

        <BankExamSelector />
        <ProgressTribunalLegend />
        <div className="overflow-x-auto" data-progress-table>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-3 px-3">Matéria</th>
                <th className="py-3 px-3 text-right">Páginas Totais</th>
                <th className="py-3 px-3 text-right">Páginas Lidas</th>
                <th className="py-3 px-3 text-right">Páginas Restantes</th>
                <th className="py-3 px-3 text-right">Progresso (%)</th>
                <th className="py-3 px-3 text-right">Horas Leitura (h)</th>
                <th className="py-3 px-3 text-right">Págs/h Total</th>
                <th className="py-3 px-3 text-right">Horas Restantes (h)</th>
                <th className="py-3 px-3 text-center">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pdfProgressData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition">
                  <td className="py-2.5 px-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <ProgressTribunalDots subject={row} bank={bank} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">{row.totalPages}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{row.pagesRead}</td>
                  <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">{row.pagesRemaining}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{row.pct}%</td>
                  <td className="py-2.5 px-3 text-right">{row.readingHours.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{row.pagsPerHour > 0 ? row.pagsPerHour : "—"}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{row.hoursRemaining > 0 ? `${row.hoursRemaining}h` : "—"}</td>
                  <td className="py-2.5 px-3 text-center">
                    <Button size="icon" variant="ghost" onClick={() => openEditSubject(row, "pdf")} className="h-7 w-7" aria-label={`Editar ${row.name}`}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/60 font-bold border-t">
                <td className="py-3 px-3">TOTAL</td>
                <td className="py-3 px-3 text-right">{totalPdfPages}</td>
                <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{totalPdfPagesRead}</td>
                <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{totalPdfPagesRemaining}</td>
                <td className="py-3 px-3 text-right text-primary">{totalPdfPct}%</td>
                <td className="py-3 px-3 text-right">{totalPdfReadingHours.toFixed(1)}</td>
                <td className="py-3 px-3 text-right font-mono">{totalPdfPagsPerHour > 0 ? totalPdfPagsPerHour : "—"}</td>
                <td className="py-3 px-3 text-right font-mono text-primary">{totalPdfHoursRemaining > 0 ? `${totalPdfHoursRemaining}h` : "—"}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabela: Progresso de Videoaulas */}
      <section className="h-full min-w-0 space-y-4 py-4 sm:py-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6 shrink-0 text-primary" />
              Progresso de Videoaulas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Horas assistidas vs. carga horária total. Sessões de videoaula abatem o saldo automaticamente.
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {totalVideoPct}% Concluído ({fmtH(totalVideoWatched)}/{fmtH(totalVideoMin)})
          </Badge>
        </div>
        <Progress value={totalVideoPct} className="h-2" />
        <BankExamSelector />
        <ProgressTribunalLegend />
        <div className="overflow-x-auto" data-progress-table>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-3 px-3">Matéria</th>
                <th className="py-3 px-3 text-right">Carga Total</th>
                <th className="py-3 px-3 text-right">Assistido</th>
                <th className="py-3 px-3 text-right">Restante</th>
                <th className="py-3 px-3 min-w-[140px]">Progresso (%)</th>
                <th className="py-3 px-3 text-center">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {videoProgressData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition">
                  <td className="py-2.5 px-3 font-semibold">
                    <div className="flex items-center gap-2">
                      <ProgressTribunalDots subject={row} bank={bank} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{fmtH(row.totalMin)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{fmtH(row.watchedMin)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">{fmtH(row.remainingMin)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <Progress value={row.pct} className="h-1.5 flex-1" />
                      <span className="font-bold w-10 text-right">{row.pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Button size="icon" variant="ghost" onClick={() => openEditSubject(row, "video")} className="h-7 w-7" aria-label={`Editar ${row.name}`}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/60 font-bold border-t">
                <td className="py-3 px-3">TOTAL</td>
                <td className="py-3 px-3 text-right font-mono">{fmtH(totalVideoMin)}</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{fmtH(totalVideoWatched)}</td>
                <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">{fmtH(totalVideoRemaining)}</td>
                <td className="py-3 px-3 text-primary">{totalVideoPct}%</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      </ProgressCarousel>

      {/* Grid: Horas Semanais & Gráfico */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 card-elevated lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Horas Semanais por Matéria
              </h2>
              <p className="text-xs text-muted-foreground">
                Edite as horas planejadas diretamente nas células ou clique no lápis ✏️.
              </p>
            </div>
            <Badge variant="outline">Meta: {totalWeeklyPlanned}h / sem</Badge>
          </div>

          <BankExamSelector compact />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Matérias</th>
                  <th className="py-2.5 px-3 text-right">Planejadas (h)</th>
                  <th className="py-2.5 px-3 text-right">Feitas (h)</th>
                  <th className="py-2.5 px-3 text-right">Restantes (h)</th>
                  <th className="py-2.5 px-3 text-center">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {weeklySubjectData.map((row) => {
                  const val = inlinePlannedHours[row.id] ?? String(row.planejado);
                  return (
                    <tr key={row.id} className="hover:bg-muted/30 transition">
                      <td className="py-2.5 px-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 aspect-square" style={{ background: corBolinhaVisaoGeral(row.name, row.color) }} />
                          <span>{row.name} <span className="text-xs text-muted-foreground font-mono">({row.sigla})</span></span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={val}
                            onChange={(e) => handleInlinePlannedChange(row.id, e.target.value)}
                            onBlur={() => handleInlinePlannedSave(row)}
                            onKeyDown={(e) => e.key === "Enter" && handleInlinePlannedSave(row)}
                            className="w-16 h-8 text-right font-medium text-xs px-1.5 py-0 border-muted"
                          />
                          <span className="text-xs text-muted-foreground">h</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{row.feito.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">{row.restante.toFixed(1)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => openEditSubject(row)} className="p-1 rounded hover:bg-muted" aria-label="Editar">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/60 font-bold border-t">
                  <td className="py-3 px-3">TOTAL</td>
                  <td className="py-3 px-3 text-right">{totalWeeklyPlanned.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{totalWeeklyDone.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">{totalWeeklyRemaining.toFixed(1)}</td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Gráfico Comparativo Planejadas vs Feitas */}
        <Card className="p-5 card-elevated flex flex-col justify-between">
          <h3 className="text-base font-bold flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Planejado vs. Feito
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySubjectData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="sigla" tick={{ fontSize: 11, fontWeight: "600" }} interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value}h`, name]}
                  labelFormatter={(sigla: any, items: any[]) => {
                    const item = items && items[0] && items[0].payload;
                    return item ? `${item.name} (${sigla})` : sigla;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="planejado" name="Planejado" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="feito" name="Feito" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Modais de Edição */}
      <Dialog open={!!editingSubject} onOpenChange={(o) => !o && setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Matéria — {editingSubject?.name}</DialogTitle>
            <DialogDescription>
              Altere os dados da matéria. Todos os quadros serão sincronizados automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="subName">Nome da Matéria</Label>
              <Input id="subName" value={name} onChange={e=>setName(e.target.value)} readOnly={!editingSubject?.tribunal_data} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subHours">Horas Planejadas / Semana (h)</Label>
                <Input id="subHours" type="number" min={0} value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="subColor">Cor Visual</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input id="subColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                  <span className="text-xs font-mono">{color}</span>
                </div>
              </div>
            </div>

            {editMode !== "video" && (<div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <Label htmlFor="pdfPages">Páginas Totais (PDF)</Label>
                <Input id="pdfPages" type="number" min={0} value={pages} onChange={(e) => setPages(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pdfPagesRead">Páginas Lidas até o momento</Label>
                <Input id="pdfPagesRead" type="number" min={0} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} className="mt-1" />
              </div>
            </div>)}
            {editMode !== "pdf" && (<div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <Label htmlFor="pdfVideoTotal">Carga Horária Total em Videoaulas (h)</Label>
                <Input id="pdfVideoTotal" type="number" min={0} step="0.5" value={videoTotalH} onChange={(e) => setVideoTotalH(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pdfVideoWatched">Horas Assistidas até o momento</Label>
                <Input id="pdfVideoWatched" type="number" min={0} step="0.5" value={videoWatchedH} onChange={(e) => setVideoWatchedH(e.target.value)} className="mt-1" />
              </div>
            </div>)}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <Button variant="destructive" size="sm" onClick={() => handleDeleteSubject(editingSubject.id)} className="flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingSubject(null)}>Cancelar</Button>
              <Button onClick={saveSubjectChanges}>Salvar Alterações</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Matéria */}
      <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Matéria</DialogTitle>
            <DialogDescription>
              Cadastre uma nova matéria para o seu planner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newName">Nome da Matéria</Label>
              <Input id="newName" placeholder="Ex: Direito Administrativo" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              <Label htmlFor="newCategory">Categoria do tribunal</Label><select id="newCategory" className="w-full mt-1 rounded-md border bg-background p-2 text-sm" value={newCategory} onChange={e=>setNewCategory(e.target.value)}>{categoryChoices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newHours">Horas Planejadas / Semana (h)</Label>
                <Input id="newHours" type="number" min={0} value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newColor">Cor Visual</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input id="newColor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
                  <span className="text-xs font-mono">{color}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <Label htmlFor="newPages">Páginas Totais (PDF)</Label>
                <Input id="newPages" type="number" min={0} value={pages} onChange={(e) => setPages(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newPagesRead">Páginas Lidas</Label>
                <Input id="newPagesRead" type="number" min={0} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <Label htmlFor="newVideoTotal">Carga Total Videoaulas (h)</Label>
                <Input id="newVideoTotal" type="number" min={0} step="0.5" value={videoTotalH} onChange={(e) => setVideoTotalH(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newVideoWatched">Horas Assistidas</Label>
                <Input id="newVideoWatched" type="number" min={0} step="0.5" value={videoWatchedH} onChange={(e) => setVideoWatchedH(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSubject(false)}>Cancelar</Button>
            <Button onClick={handleCreateSubject}>Criar Matéria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Meta Semanal */}
      <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta Semanal de Horas</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="goalInput">Meta de Horas por Semana (h)</Label>
            <Input id="goalInput" type="number" min={1} max={168} value={goalHoursInput} onChange={(e) => setGoalHoursInput(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingGoal(false)}>Cancelar</Button>
            <Button onClick={saveGoal}>Salvar Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Data da Prova */}
      <Dialog open={isEditingExamDate} onOpenChange={setIsEditingExamDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data da Prova / Fase do Concurso</DialogTitle>
            <DialogDescription>
              Defina a data prevista da prova ou marque como Pré-edital caso o edital ainda não tenha sido publicado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={examDateInput === "Pré-edital" || !examDateInput ? "default" : "ghost"}
                size="sm"
                onClick={() => setExamDateInput("Pré-edital")}
                className="flex-1 text-xs"
              >
                Pré-edital
              </Button>
              <Button
                type="button"
                variant={examDateInput !== "Pré-edital" && examDateInput ? "default" : "ghost"}
                size="sm"
                onClick={() => setExamDateInput(localDateStr())}
                className="flex-1 text-xs"
              >
                Data Definida
              </Button>
            </div>

            {examDateInput !== "Pré-edital" && examDateInput ? (
              <div>
                <Label htmlFor="examDateInput">Data da Prova</Label>
                <Input
                  id="examDateInput"
                  type="date"
                  value={examDateInput}
                  onChange={(e) => setExamDateInput(e.target.value)}
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary font-medium flex items-center gap-2">
                <span>📌 Status: <strong>Pré-edital</strong> (sem data marcada).</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingExamDate(false)}>Cancelar</Button>
            <Button onClick={saveExamDate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
