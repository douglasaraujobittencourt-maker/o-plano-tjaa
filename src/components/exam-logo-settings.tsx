import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExamLogoImage } from "./exam-logo-image";
import { EXAM_LOGO_ACCEPT, validateExamLogo } from "@/lib/exam-logo";
import { removeExamLogoForSlot, uploadExamLogoForSlot, type ExamLogoSlot } from "@/lib/exam-logo-api";
import type { Profile } from "@/lib/planner-api";

function ExamLogoSlotCard({
  profile,
  slot,
  label,
}: {
  profile?: Profile | null;
  slot: ExamLogoSlot;
  label: string;
}) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const field = slot === "caixa" ? "exam_logo_url" : "exam_logo_bb_url";
  const savedUrl = profile?.[field] ?? null;

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const change = useMutation({
    mutationFn: (selected: File | null) =>
      selected ? uploadExamLogoForSlot(selected, slot) : removeExamLogoForSlot(slot),
    onSuccess: (result) => {
      qc.setQueryData<Profile | null>(["profile"], previous =>
        previous ? { ...previous, [field]: result.url } : previous
      );
      void qc.invalidateQueries({ queryKey: ["profile"] });
      setFile(null);
      toast.success(result.url ? `Logo ${label} salva.` : `Logo ${label} removida.`);
      if (result.cleanupError) toast.warning("A logo foi atualizada, mas o arquivo anterior não pôde ser excluído.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar a logo. Verifique a configuração do armazenamento."),
  });

  return (
    <div className="min-w-0 space-y-3 rounded-xl border border-border bg-card/60 p-4">
      <h3 className="text-sm font-semibold">{label}</h3>
      <div className="flex h-28 w-full items-center justify-center rounded-lg border border-border bg-muted/30 p-3">
        {preview || savedUrl
          ? <ExamLogoImage src={preview ?? savedUrl} name={label} className="max-h-full max-w-full object-contain" />
          : <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
      </div>
      <input
        ref={input} type="file" accept={EXAM_LOGO_ACCEPT}
        aria-label={`Selecionar ${label}`} className="hidden" disabled={change.isPending}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          try { validateExamLogo(selected); setFile(selected); }
          catch (error) { toast.error(error instanceof Error ? error.message : "Imagem inválida."); }
        }}
      />
      <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP · Imagem pública</p>
      {file && <p className="break-all text-xs text-foreground">{file.name}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={change.isPending || !profile} onClick={() => input.current?.click()}>
          <ImagePlus className="h-4 w-4" /> {savedUrl || file ? "Alterar imagem" : "Adicionar imagem"}
        </Button>
        {file && <>
          <Button size="sm" disabled={change.isPending} onClick={() => change.mutate(file)}>
            {change.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Salvar logo
          </Button>
          <Button variant="ghost" size="sm" disabled={change.isPending} onClick={() => setFile(null)}>
            <X className="h-4 w-4" /> Cancelar
          </Button>
        </>}
        {savedUrl && !file && <Button variant="outline" size="sm" disabled={change.isPending} onClick={() => change.mutate(null)}>
          {change.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remover logo
        </Button>}
      </div>
    </div>
  );
}

export function ExamLogoSettings({ profile }: { profile?: Profile | null }) {
  return (
    <section aria-labelledby="exam-logo-title" className="space-y-4 border-y border-border py-6">
      <h2 id="exam-logo-title" className="text-lg font-semibold">Logo do concurso</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ExamLogoSlotCard profile={profile} slot="caixa" label="Logo 1 — Caixa" />
        <ExamLogoSlotCard profile={profile} slot="bb" label="Logo 2 — Banco do Brasil (BB)" />
      </div>
    </section>
  );
}
