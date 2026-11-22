import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { AVATAR_ACCEPT, uploadPersonalPhoto, removePersonalPhoto, validatePersonalPhoto } from "@/lib/personal-avatar-api";
import type { Profile } from "@/lib/planner-api";

export function PersonalPhotoSettings({ profile }: { profile?: Profile | null }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const savedUrl = profile?.avatar_url ?? null;

  useEffect(() => {
    if (!selected) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);

  const change = useMutation({
    mutationFn: (file: File | null) => file ? uploadPersonalPhoto(file) : removePersonalPhoto(),
    onSuccess: result => {
      qc.setQueryData<Profile | null>(["profile"], previous =>
        previous ? { ...previous, avatar_url: result.url } : previous
      );
      void qc.invalidateQueries({ queryKey: ["profile"] });
      setSelected(null);
      toast.success(result.url ? "Foto pessoal atualizada." : "Foto pessoal removida.");
      if (result.cleanupError) toast.warning("Foto atualizada, mas o arquivo anterior não pôde ser excluído.");
    },
    onError: error => {
      setSelected(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a foto.");
    },
  });

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    try {
      validatePersonalPhoto(file);
      setSelected(file);
      change.mutate(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Formato de foto inválido.");
    }
  };

  return (
    <Card className="card-elevated space-y-4 rounded-lg p-5 sm:p-6" aria-labelledby="personal-photo-title">
      <h2 id="personal-photo-title" className="text-lg font-semibold">Foto pessoal</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0 self-start" aria-busy={change.isPending}>
          <UserAvatar name={profile?.display_name} src={previewUrl ?? savedUrl} className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background" />
          {change.isPending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70" aria-label="Enviando foto">
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP · Até 5 MB · Imagem pública</p>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            aria-label="Selecionar foto pessoal"
            disabled={!profile || change.isPending}
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = "";
              chooseFile(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button" size="sm" variant="outline"
              disabled={!profile || change.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {savedUrl ? "Alterar foto" : "Adicionar foto"}
            </Button>
            {savedUrl && (
              <Button
                type="button" size="sm" variant="ghost"
                disabled={!profile || change.isPending}
                onClick={() => change.mutate(null)}
              >
                <Trash2 className="h-4 w-4" /> Remover foto
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
