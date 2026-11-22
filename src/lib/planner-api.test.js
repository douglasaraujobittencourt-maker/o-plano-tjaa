import { beforeEach, expect, mock, test } from "bun:test";
const rows = [
  { id: "atendimento", name: "Atendimento bancário", color: "#15803D", ord: 0 },
  { id: "portugues", name: "Português", color: "#0284C7", ord: 1 }
];
let stored = rows.map((row) => ({ ...row }));
let writeError = null;
mock.module("@/integrations/supabase/external-client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "owner" } } }) },
    from: (table) => ({
      select: () => ({
        order: async () => ({ data: stored.map((row) => ({ ...row })), error: null }),
        limit: async () => ({ data: stored.map((row) => ({ id: row.id })), error: null }),
        eq: () => ({ maybeSingle: async () => ({ data: { id: "owner" }, error: null }) })
      }),
      update: (patch) => ({
        eq: async (_column, id) => {
          expect(table).toBe("subjects");
          if (!writeError)
            stored = stored.map((row) => row.id === id ? { ...row, ...patch } : row);
          return { error: writeError };
        }
      })
    })
  }
}));
const { updateSubject, getSubjects, ensureUserBootstrap } = await import("./planner-api");
beforeEach(() => {
  stored = rows.map((row) => ({ ...row }));
  writeError = null;
});
test("Atendimento bancário saves orange and reads it unchanged after reopening", async () => {
  await updateSubject("atendimento", { color: "#F97316" });
  await ensureUserBootstrap();
  const reloaded = await getSubjects();
  expect(stored.find((row) => row.id === "atendimento")?.color).toBe("#F97316");
  expect(reloaded.find((row) => row.id === "atendimento")?.color).toBe("#F97316");
  expect(reloaded.find((row) => row.id === "portugues")?.color).toBe("#0284C7");
});
test("Português preserves the exact chosen blue rather than recalculating its shade", async () => {
  await updateSubject("portugues", { color: "#1D4ED8" });
  await ensureUserBootstrap();
  const reloaded = await getSubjects();
  expect(reloaded.find((row) => row.id === "portugues")?.color).toBe("#1D4ED8");
  expect(reloaded.map((row) => row.name)).toEqual(["Atendimento bancário", "Português"]);
});
test("a rejected database update surfaces an error instead of claiming the color was saved", async () => {
  writeError = { message: "write rejected" };
  await expect(updateSubject("atendimento", { color: "#F97316" })).rejects.toEqual(writeError);
  expect(stored.find((row) => row.id === "atendimento")?.color).toBe("#15803D");
});
