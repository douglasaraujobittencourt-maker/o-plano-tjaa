import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, LogOut, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/external-client";

type ProfileMenuProps = { name: string; src?: string | null };

export function ProfileMenu({ name, src }: ProfileMenuProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Até já!");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu do perfil"
          className="flex max-w-full items-center gap-2.5 rounded-full bg-[#BFFF29] px-1.5 py-1 text-[#0B1320] transition-colors hover:bg-[#BFFF29] hover:text-[#0B1320] active:bg-[#BFFF29] active:text-[#0B1320] data-[state=open]:bg-[#BFFF29] data-[state=open]:text-[#0B1320] focus-visible:bg-[#BFFF29] focus-visible:text-[#0B1320] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1320]"
          style={{ backgroundColor: "#BFFF29", color: "#0B1320" }}
        >
          <UserAvatar name={name} src={src} className="h-[52px] w-[52px] shrink-0 border-primary/70" />
          <span className="hidden max-w-36 truncate text-sm font-medium text-[#0B1320] lg:inline">{name.trim().split(/\s+/)[0]}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#0B1320]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-44 border-border bg-popover text-popover-foreground shadow-lg"
        style={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
      >
        <DropdownMenuItem asChild>
          <Link to="/app/settings" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { void signOut(); }} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
