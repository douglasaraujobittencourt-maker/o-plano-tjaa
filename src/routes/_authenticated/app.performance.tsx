import { localDateStr, addDaysStr } from "@/lib/dates";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSubjects, getSessionsBetween, getAllSessions } from "@/lib/planner-api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, CheckCircle2, Target, BarChart2, BookOpen, Layers } from "lucide-react";
import { Fragment, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { aggregateTopicPerformance } from "@/lib/topic-performance";
import { idCanonicoAssunto } from "@/lib/edital-topic-equivalence";
import { sumStudyMinutes, studyMinutesBy } from "@/lib/study-metrics";
import { ProgressTribunalDots, ProgressTribunalLegend } from "@/components/tribunal-progress-colors";
import { performanceFilters, performanceTribunalLabel, visiblePerformanceRows, type PerformanceFilter, type PerformanceSort } from "@/lib/individual-performance";
import { isWritingSubject, topicsForSubject } from "@/lib/tribunal-subject-source";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/app/performance")({
  head: () => ({
    meta: [
      {"title": "Desempenho — O Plano"},
      {"name": "description", "content": "Acompanhe horas estudadas, questões resolvidas e acertos por disciplina."},
      {"property": "og:title", "content": "Desempenho — O Plano"},
      {"property": "og:description", "content": "Acompanhe horas estudadas, questões resolvidas e acertos por disciplina."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const today = localDateStr();
  const from = addDaysStr(-29);
  const now = new Date();
  const currentYear = now.getFullYear();

  // Time filter: "all" (Todo o período) | "30d" (Últimos 30 dias)
  const [timeRange, setTimeRange] = useState<"all" | "30d">("all");
  const [subjectFilter,setSubjectFilter]=useState<PerformanceFilter>("all");
  const [subjectSort,setSubjectSort]=useState<PerformanceSort>("name");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => new Set());
  const toggleSubject = (id: string) => setExpandedSubjects(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Mesmas consultas e histórico das demais telas; a atualização periódica
  // cobre mudanças entre dispositivos mesmo quando Realtime não estiver habilitado.
  const { data: subjects = [], isPending: subjectsLoading, isError: subjectsError } = useQuery({ queryKey: ["subjects"], queryFn: getSubjects, refetchInterval: 5000 });
  const { data: sessions30d = [], isPending: recentLoading, isError: recentError } = useQuery({ queryKey: ["perf", from, today], queryFn: () => getSessionsBetween(from, today), refetchInterval: 5000 });
  const { data: allSessions = [], isPending: historyLoading, isError: historyError } = useQuery({ queryKey: ["all-sessions"], queryFn: getAllSessions, refetchInterval: 5000 });
  const tableLoading=subjectsLoading||(timeRange==="30d"?recentLoading:historyLoading);
  const tableError=subjectsError||(timeRange==="30d"?recentError:historyError);

  const activeSessions = timeRange === "30d" ? sessions30d : allSessions;

  // Hours per day (last 14 days)
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = addDaysStr(-i);
    dailyMap.set(d, 0);
  }
  const dailyMinutes = studyMinutesBy(sessions30d, "session_date");
  dailyMap.forEach((_, day) => dailyMap.set(day, (dailyMinutes[day] ?? 0) / 60));
  const dailyData = Array.from(dailyMap.entries()).map(([d, h]) => ({ day: d.slice(5), horas: +h.toFixed(1) }));

  // Individualized metrics per subject
  const subjectStats = subjects.map((s) => {
    const subSessions = activeSessions.filter((x: any) => x.subject_id === s.id || x.subject?.id === s.id);
    const minutes = sumStudyMinutes(subSessions);
    const hours = +(minutes / 60).toFixed(1);
    const qDone = subSessions.reduce((acc: number, x: any) => acc + (x.questions_done || 0), 0);
    const qCorrect = subSessions.reduce((acc: number, x: any) => acc + (x.questions_correct || 0), 0);
    const accuracy = qDone > 0 ? Math.round((qCorrect / qDone) * 100) : 0;

    return {
      ...s,
      minutes,
      hours,
      qDone,
      qCorrect,
      accuracy,
      sessionsCount: subSessions.length,
      topicStats: aggregateTopicPerformance(topicsForSubject(s, "bnb"), subSessions, idCanonicoAssunto),
    };
  });

  const visibleStats=visiblePerformanceRows(subjectStats,subjectFilter,subjectSort);

  // Totais gerais com base no filtro
  const totalHours = +(sumStudyMinutes(activeSessions) / 60).toFixed(1);
  const totalQ = subjectStats.reduce((a, s) => a + s.qDone, 0);
  const totalC = subjectStats.reduce((a, s) => a + s.qCorrect, 0);
  const overallAccuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

  // Radar per subject accuracy
  const radar = subjects.map((s) => {
    const stat = subjectStats.find((item) => item.id === s.id);
    return {
      subject: s.name.split(" ").slice(0, 2).join(" "),
      acerto: stat?.accuracy || 0,
      fullSubject: s.name,
    };
  });

  // Horas acumuladas por ano (2026+)
  const yearlyHours: Record<number, number> = {};
  for (let yr = 2026; yr <= 2032; yr++) {
    yearlyHours[yr] = 0;
  }
  allSessions.forEach((s: any) => {
    if (s.session_date) {
      const yr = new Date(s.session_date).getFullYear();
      if (yearlyHours[yr] !== undefined) {
        yearlyHours[yr] += (s.minutes ?? 0) / 60;
      }
    }
  });
  const totalAllTimeHours = sumStudyMinutes(allSessions) / 60;

  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-6xl mx-auto space-y-6">
      {/* Header com seletor de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-primary" /> Desempenho
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Métricas individualizadas por matéria e assunto: horas estudadas, questões feitas e taxa de acerto.
          </p>
        </div>

        {/* Toggle de Período */}
        <div className="inline-flex p-1 rounded-xl bg-muted border border-border/60 shrink-0">
          <button
            onClick={() => setTimeRange("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === "all"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todo o Histórico
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timeRange === "30d"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Últimos 30 dias
          </button>
        </div>
      </div>

      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 card-elevated border-l-4 border-l-primary flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" /> Horas Estudadas
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{totalHours}h</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {timeRange === "all" ? "Tempo total acumulado" : "Nos últimos 30 dias"}
            </p>
          </div>
        </Card>

        <Card className="p-4 card-elevated border-l-4 border-l-secondary dark:border-l-primary flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Target className="w-4 h-4 text-secondary dark:text-primary" /> Questões Feitas
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{totalQ}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Exercícios resolvidos
            </p>
          </div>
        </Card>

        <Card className="p-4 card-elevated border-l-4 border-l-emerald-500 flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Questões Corretas
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{totalC}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Acertos confirmados
            </p>
          </div>
        </Card>

        <Card className="p-4 card-elevated border-l-4 border-l-violet-500 flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-violet-500" /> Taxa de Acerto Geral
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">{overallAccuracy}%</div>
            <Progress value={overallAccuracy} className="h-1.5 mt-1.5" />
          </div>
        </Card>
      </div>

      {/* SEÇÃO PRINCIPAL: DESEMPENHO INDIVIDUALIZADO POR MATÉRIA */}
      <Card className="p-6 card-elevated space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Desempenho Individual por Matéria e Assunto
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Horas estudadas, questões feitas, acertos e taxa de aproveitamento por disciplina ({timeRange === "all" ? "Histórico Completo" : "Últimos 30 dias"}).
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {subjectsLoading?"Carregando matérias…":subjectsError?"Cadastro indisponível":subjects.length+" matérias cadastradas"}
          </Badge>
        </div>

        <ProgressTribunalLegend />
        <p className="text-xs text-muted-foreground">Clique na seta ao lado de uma matéria para consultar o desempenho de todos os seus assuntos.</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filtrar matérias" className="flex flex-wrap gap-1.5">
            {performanceFilters.map(filter=><button key={filter.value} type="button"
              aria-pressed={subjectFilter===filter.value}
              onClick={()=>setSubjectFilter(filter.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${subjectFilter===filter.value?"border-primary/50 bg-primary/10 text-foreground":"border-border bg-card text-muted-foreground hover:text-foreground"}`}>
              {filter.label}
            </button>)}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="individual-performance-sort" className="text-xs text-muted-foreground whitespace-nowrap">Ordenar por</label>
            <select id="individual-performance-sort" value={subjectSort} onChange={e=>setSubjectSort(e.target.value as PerformanceSort)}
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
              <option value="name">Nome (A–Z)</option>
              <option value="hours">Horas estudadas (maior primeiro)</option>
              <option value="accuracy">Taxa de acerto (maior primeiro)</option>
            </select>
          </div>
        </div>
        {!subjectsLoading&&!subjectsError&&<p className="text-xs text-muted-foreground" aria-live="polite">
          Exibindo {visibleStats.length} de {subjects.length} matérias cadastradas. Matérias comuns aparecem uma única vez, com os registros compartilhados.
          {subjectFilter!=="all"&&" O total geral permanece referente a todas as matérias no período selecionado."}
        </p>}
        {tableLoading&&<p role="status" className="text-xs text-muted-foreground">Carregando desempenho…</p>}
        {tableError&&<p role="alert" className="text-sm text-destructive">Não foi possível atualizar todos os dados de desempenho. Tente novamente ao recarregar a página.</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold text-xs">
                <th className="py-3 px-3">Matéria</th>
                <th className="py-3 px-3 text-right">Horas Estudadas</th>
                <th className="py-3 px-3 text-right">Questões Feitas</th>
                <th className="py-3 px-3 text-right">Acertos</th>
                <th className="py-3 px-3 text-right">Taxa de Acerto (%)</th>
                <th className="py-3 px-3 text-center">Status / Modo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!tableLoading&&!tableError&&visibleStats.length===0&&<tr><td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">Nenhuma matéria neste filtro.</td></tr>}
              {!tableLoading&&visibleStats.map((row) => {
                // Color formatting for accuracy
                let accColor = "text-muted-foreground";
                if (row.qDone > 0) {
                  if (row.accuracy >= 80) accColor = "text-emerald-600 dark:text-emerald-400 font-bold";
                  else if (row.accuracy >= 65) accColor = "text-amber-600 dark:text-amber-400 font-bold";
                  else accColor = "text-destructive font-bold";
                }

                return (
                  <Fragment key={row.id}>
                  <tr className="hover:bg-muted/30 transition">
                    {/* Nome da Matéria */}
                    <td className="py-3 px-3 font-semibold">
                      <div className="flex items-center gap-2.5">
                        <button type="button" onClick={() => toggleSubject(row.id)} aria-expanded={expandedSubjects.has(row.id)} aria-label={`${expandedSubjects.has(row.id) ? "Recolher" : "Expandir"} assuntos de ${row.name}`} className="p-1 rounded hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary shrink-0">
                          {expandedSubjects.has(row.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <ProgressTribunalDots subject={row} bank="bnb" />
                        <div className="min-w-0">
                          <span className="block">{row.name}</span>
                          <span className="block text-[10px] font-normal text-muted-foreground">{performanceTribunalLabel(row)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Horas Estudadas */}
                    <td className="py-3 px-3 text-right font-medium">
                      <span className="font-semibold text-foreground">{row.hours}h</span>
                      {row.sessionsCount > 0 && (
                        <span className="text-[11px] text-muted-foreground block">
                          {row.sessionsCount} {row.sessionsCount === 1 ? "sessão" : "sessões"}
                        </span>
                      )}
                    </td>

                    {/* Questões Feitas */}
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {row.qDone > 0 ? row.qDone : "—"}
                    </td>

                    {/* Questões Corretas */}
                    <td className="py-3 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {row.qDone > 0 ? row.qCorrect : "—"}
                    </td>

                    {/* Taxa de Acerto */}
                    <td className="py-3 px-3 text-right">
                      {row.qDone > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className={accColor}>{row.accuracy}%</span>
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${
                                row.accuracy >= 80
                                  ? "bg-emerald-500"
                                  : row.accuracy >= 65
                                  ? "bg-amber-500"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${row.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-xs"><span className="block">—</span><span>Sem questões</span></div>
                      )}
                    </td>

                    {/* Status / Modo */}
                    <td className="py-3 px-3 text-center">
                      {row.study_status === "finalized" ? (
                        <Badge variant="secondary" className="bg-primary/15 text-[10px] font-bold text-foreground">
                          🎓 Modo Revisão
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-secondary/30 text-[10px] text-secondary dark:border-primary/40 dark:text-primary">
                          {isWritingSubject(row)?"✍️ Discursiva":"📘 Modo Teoria"}
                        </Badge>
                      )}
                      {row.study_status==="pending"&&<span className="block text-[10px] text-muted-foreground">Na fila de espera</span>}
                    </td>
                  </tr>
                  {expandedSubjects.has(row.id) && (row.topicStats.length === 0 ? (
                    <tr className="bg-muted/20"><td colSpan={6} className="py-3 px-9 text-xs text-muted-foreground">Nenhum assunto cadastrado nesta matéria.</td></tr>
                  ) : row.topicStats.map(topic => {
                    const color = topic.accuracy === null ? "text-muted-foreground" : topic.accuracy >= 80 ? "text-emerald-600 dark:text-emerald-400 font-bold" : topic.accuracy >= 65 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-destructive font-bold";
                    return <tr key={topic.id ?? "unlinked"} className="bg-muted/20 hover:bg-muted/40">
                      <td className="py-2 pl-10 pr-3 text-xs font-medium break-words">{topic.name}</td>
                      <td className="py-2 px-3 text-right text-muted-foreground">—</td>
                      <td className="py-2 px-3 text-right tabular-nums">{topic.qDone}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{topic.qCorrect}</td>
                      <td className="py-2 px-3 text-right">{topic.accuracy === null ? <span className="text-xs text-muted-foreground">—<span className="block">Sem questões</span></span> : <div className="flex flex-col items-end"><span className={color}>{topic.accuracy}%</span><div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden mt-1"><div className={`h-full rounded-full ${topic.accuracy >= 80 ? "bg-emerald-500" : topic.accuracy >= 65 ? "bg-amber-500" : "bg-destructive"}`} style={{ width: `${Math.min(100, Math.max(0, topic.accuracy))}%` }} /></div></div>}</td>
                      <td className="py-2 px-3"></td>
                    </tr>;
                  }))}
                  </Fragment>
                );
              })}

              {/* Linha de Total */}
              <tr className="bg-muted/60 font-bold border-t text-sm">
                <td className="py-3 px-3">TOTAL GERAL</td>
                <td className="py-3 px-3 text-right text-primary">{totalHours}h</td>
                <td className="py-3 px-3 text-right text-foreground">{totalQ>0?totalQ:"—"}</td>
                <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">{totalQ>0?totalC:"—"}</td>
                <td className="py-3 px-3 text-right text-violet-600 dark:text-violet-400">{totalQ>0?`${overallAccuracy}%`:<span className="text-xs text-muted-foreground">—<span className="block font-normal">Sem questões</span></span>}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gráficos Comparativos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gráfico 1: Horas por dia (últimos 14 dias) */}
        <Card className="p-5 card-elevated space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Horas por Dia (Últimos 14 dias)
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val}h`, "Horas Estudadas"]}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar dataKey="horas" fill="#0284C7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico 2: Radar de Acerto por Matéria */}
        <Card className="p-5 card-elevated space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Aproveitamento por Matéria (% de Acerto)
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="oklch(1 0 0 / 10%)" />
                <PolarAngleAxis dataKey="subject" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
                <Radar
                  dataKey="acerto"
                  name="Taxa de Acerto (%)"
                  stroke="#7C3AED"
                  fill="#7C3AED"
                  fillOpacity={0.35}
                />
                <Tooltip formatter={(v: any) => [`${v}%`, "Acerto"]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Horas Acumuladas por Ano */}
      <Card className="p-5 card-elevated space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Horas Acumuladas por Ano (2026+)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground font-semibold text-xs">
                <th className="py-2.5 px-3">Ano</th>
                <th className="py-2.5 px-3 text-right">Horas Acumuladas (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(yearlyHours).map(([yr, h]) => (
                <tr
                  key={yr}
                  className={`hover:bg-muted/30 transition ${
                    +yr === currentYear ? "font-bold bg-primary/5" : ""
                  }`}
                >
                  <td className="py-2 px-3 flex items-center gap-2">
                    {yr} {+yr === currentYear && <Badge variant="secondary" className="text-[10px]">Ano Atual</Badge>}
                  </td>
                  <td className="py-2 px-3 text-right font-medium">{h.toFixed(1)}h</td>
                </tr>
              ))}
              <tr className="bg-muted/60 font-bold border-t">
                <td className="py-3 px-3">TOTAL GERAL HISTÓRICO</td>
                <td className="py-3 px-3 text-right text-primary">{totalAllTimeHours.toFixed(1)}h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

