import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initialsFromName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0,2).map(part => part[0]?.toLocaleUpperCase("pt-BR")).join("") || "EP";
}

export function UserAvatar({ name, src, className }: {
  name?: string | null;
  src?: string | null;
  className?: string;
}) {
  const label = (name ?? "").trim() || "Estudante";
  return (
    <Avatar className={cn("h-10 w-10 border border-primary/30 bg-primary/10", className)} aria-label={`Foto de ${label}`}>
      <AvatarImage src={src || undefined} alt={`Foto de ${label}`} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-foreground">
        {initialsFromName(label)}
      </AvatarFallback>
    </Avatar>
  );
}
