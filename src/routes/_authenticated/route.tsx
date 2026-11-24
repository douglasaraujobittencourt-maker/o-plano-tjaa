import { createFileRoute, Outlet, Link, useRouter, useLocation, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/external-client";
import { LayoutDashboard, Clock, Layers, Brain, TrendingUp, BookOpenCheck, Settings2, LogOut, Menu } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile } from "@/lib/planner-api";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { FloatingTimer } from "@/components/floating-timer";
import { MotivationalPopup } from "@/components/motivational-popup";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { OPlanoWordmark } from "@/components/o-plano-wordmark";
import { ProfileMenu } from "@/components/profile-menu";
import { BankExamProvider } from "@/components/bank-exam-provider";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    try {
      const { ensureUserBootstrap } = await import("@/lib/planner-api");
      await ensureUserBootstrap();
    } catch (error) { console.error("Não foi possível inicializar o ciclo de tribunais:",error); }
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/app", label: "1 - Visão geral", icon: LayoutDashboard },
  { to: "/app/study", label: "2 - Bora Estudar", icon: Clock },
  { to: "/app/errors", label: "3 - Caderno de Erros", icon: Layers },
  { to: "/app/reviews", label: "4 - Revisões", icon: Brain },
  { to: "/app/edital", label: "5 - Edital Verticalizado", icon: BookOpenCheck },
  { to: "/app/cycle", label: "Ciclo de Estudos", icon: Layers },
  { to: "/app/importance", label: "Grau de Importância", icon: TrendingUp },
  { to: "/app/performance", label: "6 - Desempenho", icon: TrendingUp },
  { to: "/app/settings", label: "Configurações", icon: Settings2 },
] as const;

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center rounded-md border border-sidebar-border bg-sidebar/70 p-0.5">
      <button
        onClick={() => setTheme("light")}
        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
        aria-label="Tema claro"
      >
        LIGHT
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
        aria-label="Tema escuro"
      >
        DARK
      </button>
    </div>
  );
}

function AppShell() {
  const router = useRouter();
  const { pathname } = useLocation();
  const isOverview = pathname === "/app" || pathname === "/app/";
  const isEdital = pathname === "/app/edital" || pathname === "/app/edital/";
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const name = profile?.display_name?.trim() ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] || "Estudante";
  const avatarUrl = profile?.avatar_url ?? null;

  // Sincronização entre abas e dispositivos, quando Realtime estiver habilitado.
  useEffect(() => {
    const changed = () => {
      void qc.invalidateQueries({ queryKey: ["edital-auto-progresso"] });
      void qc.invalidateQueries({ queryKey: ["subjects"] });
      void qc.invalidateQueries({ queryKey: ["edital-catalog"] });
      void qc.invalidateQueries({ queryKey: ["subjects-blocks"] });
      void qc.invalidateQueries({ queryKey: ["cycle-slots"] });
      void qc.invalidateQueries({ queryKey: ["all-sessions"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
      void qc.invalidateQueries({ queryKey: ["sessions"] });
      void qc.invalidateQueries({ queryKey: ["week"] });
      void qc.invalidateQueries({ queryKey: ["month"] });
      void qc.invalidateQueries({ queryKey: ["reviews-due"] });
    };
    const storage = (event: StorageEvent) => { if (event.key === `o-plano:progress:${user.id}`) changed(); };
    window.addEventListener("storage", storage);
    const channel = supabase.channel(`o-plano-edital-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subjects", filter: `user_id=eq.${user.id}` }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions", filter: `user_id=eq.${user.id}` }, changed)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `user_id=eq.${user.id}` }, changed)
      .subscribe();
    return () => { window.removeEventListener("storage", storage); void supabase.removeChannel(channel); };
  }, [qc, user.id]);


  useEffect(() => {
    async function alignSubjectNames() {
      const { data: subjects } = await supabase.from("subjects").select("id, name");
      if (!subjects) return;

      let updatedAny = false;

      for (const s of subjects) {
        if (s.name === "Cuidados e Rotinas Administrativas") {
          await supabase.from("subjects").update({ name: "Atendimento e Rotinas Administrativas" }).eq("id", s.id);
          s.name = "Atendimento e Rotinas Administrativas";
          updatedAny = true;
        }

      }

      if (updatedAny) {
        qc.invalidateQueries({ queryKey: ["subjects"] });
        qc.invalidateQueries({ queryKey: ["cycle"] });
        qc.invalidateQueries({ queryKey: ["reviews-due"] });
        qc.invalidateQueries({ queryKey: ["cards-due"] });
      }
    }
    alignSubjectNames();
  }, [qc]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Até já!");
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <BankExamProvider userId={user.id}>
    <div className="min-h-screen flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0B1320] md:flex md:h-dvh">
        <div className="shrink-0 px-5 pt-3.5 pb-1.5 flex justify-center items-center">
          <OPlanoWordmark className="block h-6 w-auto md:h-7 lg:h-8 text-sidebar-foreground" />
        </div>
        <nav className="min-h-0 flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/app" }}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm bg-sidebar-primary text-sidebar-primary-foreground font-semibold" }}
            >
              <n.icon className="w-4 h-4 shrink-0" /> {n.label}
            </Link>
          ))}
          <div className="px-3 py-2.5">
            <ThemeToggle />
          </div>
        </nav>
        <div className="mt-auto shrink-0 border-t border-white/10 bg-[#0B1320] p-3">
          <button onClick={signOut} className="w-full rounded-md p-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive flex items-center gap-3 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>


      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[80vw] max-w-sm p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col">
          <div className="px-5 pt-4 pb-2.5 flex justify-center items-center w-full">
            <OPlanoWordmark className="block h-8 w-auto text-sidebar-foreground" />
            <SheetTitle className="sr-only">Menu</SheetTitle>
          </div>


          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setDrawerOpen(false)}
                activeOptions={{ exact: n.to === "/app" }}
                className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeProps={{ className: "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold bg-sidebar-primary text-sidebar-primary-foreground" }}
              >
                <n.icon className="w-4 h-4 shrink-0" /> {n.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-1">
            <div className="mb-3 px-4">
              <ThemeToggle />
            </div>
            <Link
              to="/app/settings"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Configurações
            </Link>
            <button
              onClick={() => { setDrawerOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>


      <main className="relative min-w-0 flex-1 md:ml-64">
        {/* Na Visão geral o avatar faz parte do próprio cabeçalho da página, sem faixa superior. */}
        {!isOverview && !isEdital && (
          <div className="absolute right-4 top-3 z-20 hidden items-center justify-end md:flex lg:right-6">
            <ProfileMenu name={name} src={avatarUrl} />
          </div>
        )}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-sidebar-border bg-sidebar px-3 py-2 md:hidden">
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="h-10 w-10 shrink-0 border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Abrir menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <UserAvatar name={name} src={avatarUrl} className="h-12 w-12 border-primary/70" />
        </header>
        <Outlet />
      </main>

      <FloatingTimer />
      <MotivationalPopup />
    </div>
    </BankExamProvider>
  );
}
