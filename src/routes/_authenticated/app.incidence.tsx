import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChartBar, ChevronDown, BookOpen, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { incidenceMaps, type Tribunal, type Banca, type Subject } from "@/lib/incidence-data";

export const Route = createFileRoute("/_authenticated/app/incidence")({
  head: () => ({ meta: [{ title: "Mapa de Incidência — O Plano" }] }),
  component: IncidencePage,
});

const tribunals = [{ id: "tjgo", label: "TJ Goiás" }, { id: "tjdft", label: "TJDFT" }] as const;
const banks: Record<Tribunal, { id: Banca; label: string }[]> = {
  tjgo: [{ id: "verbena", label: "Instituto Verbena (UFG)" }, { id: "fgv", label: "FGV" }],
  tjdft: [],
};
const format = (value: number) => value.toLocaleString("pt-BR");

function SubjectCard({ subject, approximate }: { subject: Subject; approximate: boolean }) {
  const prefix = approximate ? "≈ " : "";
  const themes = [...subject.themes].sort((a, b) => b.percent - a.percent);
  let accumulated = 0;
  return (
    <Card className="min-w-0 overflow-hidden p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-snug">{subject.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{subject.note}</p>
        </div>
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-right">
          <p className="text-lg font-bold tabular-nums">{prefix}{format(subject.total)}</p>
          <p className="text-xs text-muted-foreground">questões na matéria</p>
        </div>
      </div>
      <div className="space-y-2">
        {themes.map((theme, index) => {
          accumulated += theme.percent;
          const count = theme.questions ?? (approximate ? Math.round(subject.total * theme.percent / 100) : null);
          return (
            <details key={theme.title} className="group rounded-lg border bg-card">
              <summary className="flex cursor-pointer list-none items-start gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg [&::-webkit-details-marker]:hidden">
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold break-words">{theme.title}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums">{prefix}{theme.percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Incidência ${prefix}${theme.percent}%`}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${theme.percent}%` }} />
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <span>{count === null ? "Contagem não informada" : `${theme.questions == null ? "≈ " : prefix}${format(count)} questões`}</span>
                    <span>Acumulado: {prefix}{accumulated}%</span>
                  </div>
                </div>
                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-3 border-t px-4 py-3 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtópicos</p>
                {theme.subtopics.map(sub => (
                  <div key={sub.title} className="border-l-2 border-primary/60 pl-3">
                    <h3 className="text-sm font-semibold">{sub.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{sub.description}</p>
                    {(sub.questions != null || sub.percent != null) && <p className="mt-1 text-xs text-muted-foreground">{sub.questions != null ? `${prefix}${sub.questions} questões` : ""}{sub.questions != null && sub.percent != null ? " · " : ""}{sub.percent != null ? `${prefix}${sub.percent}%` : ""}</p>}
                  </div>
                ))}
                {theme.subtopics.every(s => s.questions == null && s.percent == null) && <p className="text-xs text-muted-foreground">O levantamento não informa contagens ou incidência individual dos subtópicos.</p>}
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
}

function IncidencePage() {
  const [tribunal, setTribunal] = useState<Tribunal>("tjgo");
  const [bank, setBank] = useState<Banca>("verbena");
  const available = banks[tribunal];
  const selected = available.find(item => item.id === bank) ?? available[0];
  const map = selected ? incidenceMaps[tribunal]?.[selected.id] : undefined;
  const subjectOrder = ["Língua Portuguesa", "Noções de Direito Administrativo", "Noções de Direito Constitucional", "Noções de Administração Pública", "História e Geografia de Goiás", "Legislação Complementar (TJGO e Estado de Goiás)"];
  const subjects = map ? [...map.subjects].sort((a,b) => {
    const rank = (name: string) => { const i = subjectOrder.indexOf(name); return i < 0 ? subjectOrder.length : i; };
    return rank(a.name) - rank(b.name);
  }) : [];
  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <header className="md:pr-16">
        <h1 className="text-2xl font-bold tracking-tight">Mapa de Incidência</h1>
        <p className="mt-1 text-sm text-muted-foreground">Priorize o estudo teórico pelos assuntos mais cobrados em cada matéria.</p>
      </header>
      <Card className="space-y-4 p-4">
        <div role="group" aria-label="Selecionar tribunal" className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Tribunal</p>
          <div className="flex flex-wrap gap-2">
            {tribunals.map(t => <Button key={t.id} type="button" variant={tribunal === t.id ? "default" : "outline"} aria-pressed={tribunal === t.id} onClick={() => setTribunal(t.id)}>{t.label}</Button>)}
          </div>
        </div>
        {available.length > 0 && (
          <div role="group" aria-label="Selecionar banca" className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Banca organizadora</p>
            <div className="flex flex-wrap gap-2">
              {available.map(b => <Button key={b.id} type="button" variant={selected?.id === b.id ? "default" : "outline"} aria-pressed={selected?.id === b.id} onClick={() => setBank(b.id)}>{b.label}</Button>)}
            </div>
          </div>
        )}
      </Card>
      {map ? (
        <div key={`${tribunal}-${selected?.id}`} className="space-y-4">
          <Card className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">TJ Goiás · {selected?.label}</h2>
              <span className="text-xs text-muted-foreground">Edital 2021 · Apoio Judiciário e Administrativo</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xl font-bold tabular-nums">{map.exams}</p><p className="text-xs text-muted-foreground">provas no acervo</p></div>
              <div className="rounded-lg bg-muted/50 p-3"><p className="text-xl font-bold tabular-nums">{subjects.length}</p><p className="text-xs text-muted-foreground">matérias mapeadas</p></div>
              <div className="col-span-2 rounded-lg bg-muted/50 p-3 sm:col-span-1"><p className="text-xl font-bold tabular-nums">{map.approximate ? "≈ " : ""}{format(subjects.reduce((sum,s) => sum+s.total,0))}</p><p className="text-xs text-muted-foreground">soma dos totais por matéria</p></div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p>{map.source}.</p>
                <p>Valores aproximados, não auditados. Quantidades por tema estimadas pelo percentual × total da matéria, com arredondamento; podem não somar exatamente o total. Não há contagens por subtópico na fonte.</p>
                <p>Os temas e descrições reproduzem o levantamento recebido, não uma validação de legislação vigente ou de aderência integral ao edital. Confira o edital e a lei atualizada antes de estudar. Incidência histórica não prevê a próxima prova.</p>
              </div>
            </div>
          </Card>
          {subjects.map(subject => <SubjectCard key={subject.name} subject={subject} approximate={map.approximate} />)}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 p-8 text-center" aria-live="polite">
          {tribunal === "tjdft" ? <BookOpen className="h-8 w-8 text-muted-foreground" /> : <ChartBar className="h-8 w-8 text-muted-foreground" />}
          <h2 className="font-bold">{tribunal === "tjdft" ? "Mapa do TJDFT em preparação" : `Mapa da ${selected?.label} em preparação`}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{tribunal === "tjdft" ? "As bancas e seus levantamentos serão adicionados posteriormente." : "Aguardando o levantamento de incidência desta banca. Nenhum dado foi estimado para preencher esta página."}</p>
        </Card>
      )}
    </section>
  );
}
