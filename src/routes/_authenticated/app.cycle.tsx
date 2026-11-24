import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/external-client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Repeat, Layers, CheckCircle2, ArrowRightCircle, Plus, Minus, PenTool, Play, Trophy, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { localDateStr, addDaysStr } from "@/lib/dates";

import { subjectBelongsToBank } from "@/lib/bank-exams";

import { tribunalStudyPlan } from "@/lib/tribunal-study-plan";
import { tribunalGroups } from "@/lib/tribunal-catalog";
import { completeTribunalSubject, announcePlannerProgress } from "@/lib/planner-api";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/app/cycle")({
  head: () => ({
    meta: [
      {"title": "Ciclo de estudos — O Plano"},
      {"name": "description", "content": "Organize as disciplinas e acompanhe seu ciclo de estudos."},
      {"property": "og:title", "content": "Ciclo de estudos — O Plano"},
      {"property": "og:description", "content": "Organize as disciplinas e acompanhe seu ciclo de estudos."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: CyclePage,
});

function CyclePage() {
  
  const qc = useQueryClient();

  // Fetch active cycle slots first to help map statuses if columns are missing
  const { data: cycle = [], refetch: refetchCycle } = useQuery({
    queryKey: ["cycle-slots"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cycle_slots")
        .select("*, subject:subjects(*)")
        .order("ord");
      return data ?? [];
    },
  });

  // Carrega somente as matérias bancárias reais cadastradas no planner.
  const { data: subjects = [], refetch: refetchSubjects } = useQuery({
    queryKey: ["subjects-blocks", "tribunais"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("ord");
      if (error) throw error;
      return (data ?? []).filter(s => subjectBelongsToBank(s.name, "bnb"))
        .map((s, index) => ({
          ...s,
          study_block: 1,
          queue_order: s.ord ?? index + 1,
          pages: s.pages ?? 0,
          pages_read: s.pages_read ?? 0,
          maintenance_questions_this_week: s.maintenance_questions_this_week ?? 0,
          maintenance_weekly_questions_goal: s.maintenance_weekly_questions_goal || 50,
          study_status: s.study_status ?? "pending",
        }));
    },
  });

  // Calculate current week sessions of kind "redacao"
  const now = new Date();
  const dow = now.getDay();
  const daysSinceMonday = (dow + 6) % 7;
  const weekStart = addDaysStr(-daysSinceMonday);
  const today = localDateStr();

  const { data: weekSessions = [] } = useQuery({
    queryKey: ["week-redacoes", weekStart, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("*, subject:subjects(*)")
        .eq("kind", "redacao")
        .gte("session_date", weekStart)
        .lte("session_date", today);
      return data ?? [];
    },
  });

  const activeSubjects = subjects.filter((s: any) => s.study_status === "active" && s.name !== "Redação (Prova Discursiva)");
  const finalizedSubjects = subjects.filter((s: any) => s.study_status === "finalized");
  const pendingSubjects = subjects.filter((s: any) => s.study_status === "pending" && s.name !== "Redação (Prova Discursiva)");

  const redactionSubject = subjects.find((s: any) => s.name === "Redação (Prova Discursiva)");
  const isRedactionActive = redactionSubject?.study_status === "active";
  const essaysWrittenThisWeek = weekSessions.filter(s=>s.minutes>0).length;

  // Finalize subject function
  const handleFinalize=async(subjectId:string,name:string)=>{
    if(!window.confirm("Concluir todos os assuntos de "+name+" (TJGO e TJDFT quando aplicável) e avançar a fila?"))return;
    try{const next=await completeTribunalSubject(subjectId);toast.success(next?name+" concluída. Próxima: "+next:name+" concluída.");await refetchSubjects();await refetchCycle();qc.invalidateQueries();}
    catch(e:any){toast.error(e.message??"Erro ao concluir matéria");}
  };

  // Adjust maintenance questions manually
  const adjustQuestions = async (subjectId: string, amount: number) => {
    const sub = finalizedSubjects.find((s: any) => s.id === subjectId);
    if (!sub) return;
    const newVal = Math.max(0, sub.maintenance_questions_this_week + amount);
    await supabase
      .from("subjects")
      .update({ maintenance_questions_this_week: newVal })
      .eq("id", subjectId);
    refetchSubjects();
  };

  const updateStatus=async(groupName:string,newStatus:string)=>{
    const s=subjects.find(s=>s.name===groupName);
    if(!s||s.name==="Redação (Prova Discursiva)")return;
    if(newStatus==="finalized"&&s.study_status==="active")return handleFinalize(s.id,s.name);
    toast.error("O ciclo mantém quatro matérias objetivas. Conclua uma matéria ativa para liberar a próxima.");
  };
  const validSlots=cycle.filter(s=>s.subject&&subjectBelongsToBank(s.subject.name,"bnb"));
  const slotNames=new Map(validSlots.map(s=>[s.ord,s.subject?.name??""]));
  const currentSessions=tribunalStudyPlan.sessions.map(session=>session.map(slot=>{
    const g=tribunalGroups.find(g=>g.name===slot.subject);
    const ord=g?.id===214?4:(g?.id??201)-201;
    const current=validSlots.find(s=>s.ord===ord);
    const initial=tribunalGroups.find(g=>g.id===(ord===4?214:201+ord));
    return {subject:slotNames.get(ord)||"Revisão / vaga",minutes:current&&initial?.hours?Math.round(slot.minutes*current.hours_per_cycle/initial.hours):slot.minutes};
  }));

  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Repeat className="w-6 h-6 text-primary" /> Panorama Geral do Ciclo de Estudos
          </h1>
          <p className="text-muted-foreground text-sm">
            TJGO prioritário · TJDFT em seguida · quatro matérias objetivas ativas e discursiva semanal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary-foreground border border-primary/30 px-3 py-1 text-xs">
            {activeSubjects.length} Matérias Ativas
          </Badge>
          <Badge className="bg-success/20 text-success-foreground border border-success/30 px-3 py-1 text-xs">
            {finalizedSubjects.length} Concluídas
          </Badge>
        </div>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Ciclo de estudos · sessões alternadas</h2>
        <p className="text-xs text-muted-foreground">Sessões flexíveis, sem dia fixo. Retome de onde parou. Revisões e questões dentro de cada bloco.</p>
        {currentSessions.map((session,i)=><div key={i} className="flex flex-wrap gap-2 text-sm border-b pb-2"><strong>Sessão {i+1}</strong>{session.map((slot,j)=><span key={j}>{slot.subject} · {slot.minutes} min</span>)}</div>)}
        <p className="text-sm">{cycle.filter(s=>s.subject&&subjectBelongsToBank(s.subject.name,"bnb")).map(s=>s.subject?.name+" "+s.hours_per_cycle.toLocaleString("pt-BR")+"h").join(" · ")}</p>
        <p className="text-xs text-muted-foreground">Quando uma matéria objetiva termina, passa a revisão e entra a próxima da fila. A próxima disciplina assume a posição e a carga da anterior.</p>
      </Card>
      {/* Redação Banner */}
      {isRedactionActive && (
        <Card className="p-5 border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card card-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <PenTool className="w-5 h-5" />
              <span>✍️ Redação da Semana (Meta Ativa)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Uma hora por ciclo: teoria e prática desde o começo; avance para uma discursiva semanal.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-sm font-semibold">{essaysWrittenThisWeek} de 1 redações</div>
              <div className="text-xs text-muted-foreground">esta semana (seg–dom)</div>
            </div>
            <Badge className={essaysWrittenThisWeek > 0 ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
              {essaysWrittenThisWeek > 0 ? "Meta Batida" : "Pendente"}
            </Badge>
            <Link
              to="/app/study"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Fazer Redação
            </Link>
          </div>
        </Card>
      )}

      {/* Active and Maintenance sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active subjects */}
        <Card className="p-5 card-elevated flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg mb-1 flex items-center gap-2 text-primary">
              <Play className="w-5 h-5 fill-primary" /> Modo Teoria
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Matérias que você está alternando no momento. Estude em blocos e finalize quando esgotar o edital.
            </p>
            {activeSubjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground italic text-sm">
                Nenhuma matéria ativa. Adicione matérias para iniciar os estudos do Bloco 1.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {activeSubjects.map((s: any) => {
                  const cycleSlot = cycle.find((slot: any) => slot.subject_id === s.id);
                  const pct = s.pages ? Math.min(100, Math.round(((s.pages_read ?? 0) / s.pages) * 100)) : 0;
                  return (
                    <div key={s.id} className="p-4 rounded-lg border border-border bg-card/60 flex flex-col justify-between border-l-4 hover:border-l-primary transition-all" style={{ borderLeftColor: s.color }}>
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-semibold text-sm line-clamp-1" title={s.name}>{s.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Progresso: {s.pages_read ?? 0}/{s.pages} pg ({pct}%)
                        </div>
                        <Progress value={pct} className="h-1 mt-1.5" />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {cycleSlot ? `${cycleSlot.done_hours}h líquidas` : "Aguardando"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs hover:bg-success/15 hover:text-success-foreground text-success-foreground font-semibold flex items-center gap-1"
                          onClick={() => handleFinalize(s.id, s.name)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Maintenance / Revision */}
        <Card className="p-5 card-elevated flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg mb-1 flex items-center gap-2 text-success">
              <Trophy className="w-5 h-5" /> Modo revisão
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Disciplinas finalizadas. Resolva questões periodicamente para manter a retenção dos assuntos.
            </p>
            {finalizedSubjects.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground italic flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg">
                <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
                <span>Nenhuma matéria concluída para manutenção.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {finalizedSubjects.map((s: any) => {
                  const pct = Math.min(100, Math.round((s.maintenance_questions_this_week / s.maintenance_weekly_questions_goal) * 100));
                  return (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/40 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                          <span className="font-medium text-xs truncate">{s.name}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-[10px] font-mono text-muted-foreground w-12 text-right">
                            {s.maintenance_questions_this_week}/{s.maintenance_weekly_questions_goal} q
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="outline" className="w-6 h-6" onClick={() => adjustQuestions(s.id, -5)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="outline" className="w-6 h-6" onClick={() => adjustQuestions(s.id, 5)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Badge className={`text-[9px] px-1.5 py-0.5 ${pct >= 100 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                          {pct >= 100 ? "Revisada" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Global workflow timeline - 4 columns block panorama */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRightCircle className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Fila Global e Sequência de Importância</h2>
        </div>

        <Card className="p-5 card-elevated">
          <div className="space-y-2">
            {subjects.map((s: any) => {
              let statusBadge = (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/20 text-muted-foreground border-border/40 shrink-0">
                  Pendente
                </Badge>
              );
              let itemBg = "bg-card/30 border-dashed";
              
              if (s.study_status === "active") {
                statusBadge = (
                  <Badge className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary-foreground border border-primary/30 animate-pulse shrink-0">
                    Em estudo
                  </Badge>
                );
                itemBg = "bg-primary/5 border-primary/20";
              } else if (s.study_status === "finalized") {
                statusBadge = (
                  <Badge className="text-[10px] px-2 py-0.5 bg-success/20 text-success-foreground border border-success/30 shrink-0">
                    Concluída
                  </Badge>
                );
                itemBg = "bg-success/5 border-success/15";
              }

              return (
                <div key={s.id} className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-4 ${itemBg}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="font-medium text-foreground leading-snug">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge}
                    <select
                      value={s.study_status}
                      disabled={s.study_status!=="active"||s.name==="Redação (Prova Discursiva)"}
                      onChange={(e) => updateStatus(s.name, e.target.value)}
                      className="bg-muted text-muted-foreground border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="pending" className="bg-card">Aguardando</option>
                      <option value="active" className="bg-card">Em estudo</option>
                      <option value="finalized" className="bg-card">Finalizada</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
