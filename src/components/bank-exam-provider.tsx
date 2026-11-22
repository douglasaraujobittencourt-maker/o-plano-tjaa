import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { BANK_LABELS, BANK_OPTIONS, type BankExam } from "@/lib/bank-exams";

type BankContextValue = { bank: BankExam; setBank: (bank: BankExam) => void };
const BankContext = createContext<BankContextValue | null>(null);
const keyFor = (userId: string) => `o-plano:active-bank:${userId}`;
const validBank = (v: string | null): BankExam => BANK_OPTIONS.includes(v as BankExam)
  ? v as BankExam : "bb";
function storedBank(userId: string): BankExam {
  try { return validBank(window.localStorage.getItem(keyFor(userId))); }
  catch { return "bb"; }
}

export function BankExamProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [bank, updateBank] = useState<BankExam>(() => storedBank(userId));

  useEffect(() => { updateBank(storedBank(userId)); }, [userId]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === keyFor(userId)) updateBank(validBank(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [userId]);
  const setBank = useCallback((next: BankExam) => {
    updateBank(next);
    try { window.localStorage.setItem(keyFor(userId), next); }
    catch { /* A seleção continua no estado global desta sessão. */ }
  }, [userId]);

  return <BankContext.Provider value={{bank, setBank}}>{children}</BankContext.Provider>;
}
export function useBankExam(): BankContextValue {
  const state = useContext(BankContext);
  if (!state) throw new Error("BankExamProvider ausente");
  return state;
}

export function BankExamSelector({ compact = false }: { compact?: boolean }) {
  const { bank, setBank } = useBankExam();
  return (
    <div role="group" aria-label="Concurso bancário ativo"
      className="flex max-w-full flex-wrap items-center gap-1.5">
      {BANK_OPTIONS.map(option => (
        <button key={option} type="button" aria-pressed={bank === option}
          onClick={() => setBank(option)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${bank === option
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:border-primary/70 hover:bg-primary/10"}`}>
          {compact && option === "bb" ? "BB" : BANK_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
