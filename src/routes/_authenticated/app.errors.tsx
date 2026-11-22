import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, CheckCircle2, Trash2, Undo2, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getErrorNotebookAccess } from "@/lib/error-notebook-access";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/app/errors")({
  head: () => ({
    meta: [
      { title: "Caderno de Erros — O Plano" },
      { name: "description", content: "Registre, filtre e revise seus erros por matéria e motivo." },
      { property: "og:title", content: "Caderno de Erros — O Plano" },
      { property: "og:description", content: "Registre, filtre e revise seus erros por matéria e motivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ErrorsPage,
  errorComponent: ErrorsRouteError,
});

function ErrorsRouteError({ error, reset }: { error: unknown; reset: () => void }) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-primary" /> Caderno de Erros
      </h1>
      <Card className="p-6 card-elevated text-center space-y-3">
        <p className="font-semibold">Não foi possível carregar o Caderno de Erros.</p>
        <p className="text-sm text-muted-foreground break-words">{message}</p>
        <Button onClick={reset}>Tentar novamente</Button>
      </Card>
    </div>
  );
}

const REASONS = [
  "Falta de atenção",
  "Pegadinha da banca",
  "Lapso de memória / Esquecimento",
  "Conteúdo não estudado",
] as const;

const schema = z.object({
  subject_id: z.string().min(1, "Escolha uma matéria finalizada"),
  topic: z.string().trim().min(1, "Informe o tópico").max(200),
  mistake: z.string().trim().min(1, "Descreva o erro").max(4000),
  reason: z.enum(REASONS, { message: "Escolha o motivo" }),
});

type ErrorRow = {
  id: string; subject_id: string | null; edital_materia_numero?: number | null; topic: string; mistake: string;
  reason: string; reviewed: boolean; created_at: string;
};

const db = supabase as any;

function ErrorsPage() {
  const qc = useQueryClient();
  const accessQuery = useQuery({
    queryKey: ["error-notebook-access"],
    queryFn: getErrorNotebookAccess,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name, color").order("ord");
      if (error) throw error;
      return data ?? [];
    },
    retry: 1,
  });
  const errorsQuery = useQuery({
    queryKey: ["error_log"],
    queryFn: async () => {
      const { data, error } = await db.from("error_log").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ErrorRow[];
    },
    retry: 1,
  });
  const subjects = subjectsQuery.data ?? [];
  const errors = errorsQuery.data ?? [];
  const loadError = (accessQuery.error ?? subjectsQuery.error ?? errorsQuery.error) as { message?: string } | null;
  const eligible = accessQuery.data?.options ?? [];
  const eligibleKeys = new Set(accessQuery.data?.eligibleKeys ?? []);
  const errorKey = (row: ErrorRow) => row.edital_materia_numero != null
    ? "edital:" + row.edital_materia_numero
    : row.subject_id ? "subject:" + row.subject_id : null;

  const [form, setForm] = useState({ subject_id: "", topic: "", mistake: "", reason: "" });
  const [fSubject, setFSubject] = useState("all");
  const [fReason, setFReason] = useState("all");

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      // Revalida na hora do envio, mesmo que a matéria tenha sido desmarcada em outra aba.
      const fresh = await getErrorNotebookAccess();
      if (!fresh.eligibleKeys.includes(parsed.data.subject_id)) {
        throw new Error("Esta matéria não está mais finalizada. Conclua-a novamente para registrar erros.");
      }
      const chosen = fresh.options.find(o => o.value === parsed.data.subject_id);
      if (!chosen) throw new Error("Matéria indisponível.");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada. Entre novamente.");
      const payload = {
        user_id: auth.user.id,
        subject_id: chosen.kind === "subject" ? chosen.subjectId : null,
        ...(chosen.kind === "edital" ? { edital_materia_numero: chosen.materiaNumero } : {}),
        topic: parsed.data.topic,
        mistake: parsed.data.mistake,
        reason: parsed.data.reason,
      };
      const { error } = await db.from("error_log").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Erro salvo");
      setForm({ subject_id: form.subject_id, topic: "", mistake: "", reason: "" });
      qc.invalidateQueries({ queryKey: ["error_log"] });
      qc.invalidateQueries({ queryKey: ["error-notebook-access"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (e: ErrorRow) => {
      const fresh = await getErrorNotebookAccess();
      const key = errorKey(e);
      if (!key || !fresh.eligibleKeys.includes(key)) throw new Error("Matéria bloqueada. Finalize-a para revisar este erro.");
      const { error } = await db.from("error_log").update({ reviewed: !e.reviewed }).eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["error_log"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const row = errors.find(e => e.id === id);
      const fresh = await getErrorNotebookAccess();
      const key = row && errorKey(row);
      if (!key || !fresh.eligibleKeys.includes(key)) throw new Error("Matéria bloqueada. Finalize-a para gerenciar este erro.");
      const { error } = await db.from("error_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Erro excluído"); qc.invalidateQueries({ queryKey: ["error_log"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
  const allowedErrors = errors.filter(e => {
    const key = errorKey(e);
    return key !== null && eligibleKeys.has(key);
  });
  const total = allowedErrors.length;
  const resolved = allowedErrors.filter((e) => e.reviewed).length;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const selectedFilter = fSubject === "all" || eligibleKeys.has(fSubject) ? fSubject : "all";
  const selectedFormSubject = eligibleKeys.has(form.subject_id) ? form.subject_id : "";
  const filtered = allowedErrors.filter(
    (e) => (selectedFilter === "all" || errorKey(e) === selectedFilter) &&
      (fReason === "all" || e.reason === fReason),
  );

  return (
    <div className="px-4 py-4 pb-24 sm:p-6 md:pb-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" /> Caderno de Erros
        </h1>
        <p className="text-muted-foreground text-sm">Cada erro registrado é um acerto garantido na prova.</p>
      </div>

      {loadError && (
        <Card className="p-4 card-elevated border-destructive space-y-2">
          <p className="font-semibold text-destructive">Não foi possível carregar os dados.</p>
          <p className="text-sm text-muted-foreground break-words">{loadError.message ?? "Erro inesperado"}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void accessQuery.refetch();
              void subjectsQuery.refetch();
              void errorsQuery.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </Card>
      )}

      {accessQuery.isPending && <Card className="p-6 card-elevated text-center text-muted-foreground">Verificando matérias finalizadas...</Card>}
      {!accessQuery.isPending && !loadError && eligible.length === 0 && (
        <Card className="p-8 card-elevated border-l-4 border-l-primary text-center space-y-4">
          <Lock className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold">Caderno de Erros bloqueado</h2>
          <p className="text-sm text-muted-foreground">Conclua pelo menos uma matéria para liberar o Caderno de Erros</p>
          <Button asChild><Link to="/app/edital">Ir ao Edital Verticalizado</Link></Button>
        </Card>
      )}
      {!accessQuery.isPending && !loadError && eligible.length > 0 && <>
      <Card className="p-4 sm:p-5 card-elevated space-y-3">
        <h2 className="font-semibold">Adicionar novo erro</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Matéria</Label>
            <Select value={selectedFormSubject} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
              <SelectTrigger><SelectValue placeholder="Escolha a matéria" /></SelectTrigger>
              <SelectContent>
                {eligible.map(o => <SelectItem key={o.value} value={o.value}>{o.name}{o.kind === "edital" ? " · Edital Verticalizado" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tópico / Assunto</Label>
            <Input value={form.topic} maxLength={200} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Ex: Inexigibilidade de Licitação" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>O que errei / Pegadinha</Label>
          <Textarea rows={4} maxLength={4000} value={form.mistake} onChange={(e) => setForm({ ...form, mistake: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Motivo do Erro</Label>
          <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
            <SelectTrigger><SelectValue placeholder="Escolha o motivo" /></SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !selectedFormSubject} className="w-full sm:w-auto">Salvar Erro</Button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 card-elevated">
          <div className="text-xs text-muted-foreground">Total de Erros Registrados</div>
          <div className="text-2xl font-bold">{total}</div>
        </Card>
        <Card className="p-4 card-elevated">
          <div className="text-xs text-muted-foreground">% resolvidos</div>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Filtrar por Matéria</Label>
          <Select value={selectedFilter} onValueChange={setFSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {eligible.map(o => <SelectItem key={o.value} value={o.value}>{o.name}{o.kind === "edital" ? " · Edital Verticalizado" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Filtrar por Motivo do erro</Label>
          <Select value={fReason} onValueChange={setFReason}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 card-elevated text-center text-muted-foreground">Nenhum erro encontrado.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const s: any = e.subject_id ? subjectMap.get(e.subject_id) : null;
            const matching = eligible.find(o => o.value === errorKey(e));
            return (
              <Card key={e.id} className={`p-4 card-elevated ${e.reviewed ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                  <Badge variant="outline">{matching?.name ?? s?.name ?? "Sem matéria"}</Badge>
                  <Badge variant="secondary">{e.reason}</Badge>
                  {e.reviewed && <Badge>Revisado</Badge>}
                </div>
                <p className="font-semibold text-sm">{e.topic}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{e.mistake}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" variant={e.reviewed ? "outline" : "default"} onClick={() => toggle.mutate(e)}>
                    {e.reviewed ? <><Undo2 className="w-4 h-4 mr-1" /> Desfazer</> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Revisado / Entendido</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Excluir este erro?")) del.mutate(e.id); }}>
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}
