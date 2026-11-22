import { supabase } from "@/integrations/supabase/external-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { validateQuestions, type Topic, type TopicDefinition } from "./edital";
// External schema extension: generated types must remain untouched until the owner applies SQL.
type EditalDatabase = Omit<Database, "public"> & { public: Omit<Database["public"], "Tables" | "Functions"> & {
  Tables: Database["public"]["Tables"] & { edital_topics: { Row: Topic; Insert: Partial<Topic> & { user_id: string }; Update: Partial<Topic>; Relationships: [] } };
  Functions: { save_edital_topic: { Args: { p_id: string; p_patch: Json }; Returns: undefined }; import_edital_topics: { Args: { p_topics: Json }; Returns: undefined } };
} };
export const editalClient = supabase as unknown as SupabaseClient<EditalDatabase>;
export async function getEditalTopics(): Promise<Topic[]> {
  const { data, error } = await editalClient.from("edital_topics").select("*").order("ord");
  if (error) throw error; return data ?? [];
}
export type TopicPatch = Partial<Pick<Topic, "status" | "theory" | "rev1" | "rev2" | "rev3" | "rev4" | "questions" | "correct" | "title" | "caixa" | "bb" | "block" | "scope" | "subject_id">>;
export async function saveEditalTopic(id: string, patch: TopicPatch) {
  if (patch.questions !== undefined && patch.correct !== undefined) validateQuestions(patch.questions, patch.correct);
  const { error } = await editalClient.rpc("save_edital_topic", { p_id: id, p_patch: patch }); if (error) throw error;
}
export async function importEditalTopics(topics: TopicDefinition[]) {
  const { error } = await editalClient.rpc("import_edital_topics", { p_topics: topics }); if (error) throw error;
}
export async function linkEditalGroup(group: string, subject: string | null) {
  const { error } = await editalClient.from("edital_topics").update({ subject_id: subject }).eq("group_key", group); if (error) throw error;
}
export async function readEditalWorkbook(file: File) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Selecione uma planilha XLSX.");
  if (file.size > 10 * 1024 * 1024) throw new Error("A planilha deve ter até 10 MB.");
  const { default: ExcelJS } = await import("exceljs"); const book = new ExcelJS.Workbook();
  await book.xlsx.load(await file.arrayBuffer());
  const sheet = book.getWorksheet("Edital Verticalizado") ?? book.worksheets.find(s => s.name !== "Painel de Progresso");
  if (!sheet) throw new Error("Planilha sem aba de edital.");
  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, row => { rows.push(Array.from({length:16}, (_,i) => row.getCell(i+1).text)); });
  const { parseWorkbookRows } = await import("./edital"); return parseWorkbookRows(rows);
}