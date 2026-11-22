import { supabase } from "@/integrations/supabase/external-client";
import type { Profile } from "./planner-api";
import { EXAM_LOGO_BUCKET, examLogoPath, ownedExamLogoPath, validateExamLogo } from "./exam-logo";

export type ExamLogoSlot = "caixa" | "bb";
type LogoColumn = "exam_logo_url" | "exam_logo_bb_url";
const columnFor = (slot: ExamLogoSlot): LogoColumn =>
  slot === "caixa" ? "exam_logo_url" : "exam_logo_bb_url";

async function logoOwner(slot: ExamLogoSlot) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Entre na sua conta para alterar a logo.");
  const result = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  if (result.error) throw result.error;
  const profile = result.data as Profile;
  return { userId: data.user.id, previousUrl: profile[columnFor(slot)] ?? null };
}

async function cleanPrevious(url: string | null, userId: string) {
  const baseUrl = supabase.storage.from(EXAM_LOGO_BUCKET).getPublicUrl("").data.publicUrl.replace(/\/$/, "");
  const path = ownedExamLogoPath(url, baseUrl, userId);
  if (!path) return;
  return (await supabase.storage.from(EXAM_LOGO_BUCKET).remove([path])).error;
}

async function saveLogo(userId: string, url: string | null, slot: ExamLogoSlot) {
  // Objeto literal por slot: o cliente gerado rejeita chaves computadas.
  const patch = slot === "caixa" ? { exam_logo_url: url } : { exam_logo_bb_url: url };
  const result = await supabase.from("profiles").update(patch).eq("id", userId).select("*").single();
  if (result.error) throw result.error;
  const saved = result.data as Profile;
  return (slot === "caixa" ? saved.exam_logo_url : saved.exam_logo_bb_url) ?? null;
}

export async function uploadExamLogoForSlot(file: File, slot: ExamLogoSlot) {
  validateExamLogo(file);
  const { userId, previousUrl } = await logoOwner(slot);
  const path = examLogoPath(userId, crypto.randomUUID(), file.type);
  const bucket = supabase.storage.from(EXAM_LOGO_BUCKET);
  const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  let url: string | null;
  try {
    url = await saveLogo(userId, bucket.getPublicUrl(path).data.publicUrl, slot);
  } catch (error) {
    await bucket.remove([path]);
    throw error;
  }
  return { url, slot, cleanupError: await cleanPrevious(previousUrl, userId) };
}

export async function removeExamLogoForSlot(slot: ExamLogoSlot) {
  const { userId, previousUrl } = await logoOwner(slot);
  const url = await saveLogo(userId, null, slot);
  return { url, slot, cleanupError: await cleanPrevious(previousUrl, userId) };
}

// Compatibilidade com consumidores anteriores: a primeira logo continua sendo a da Caixa.
export const uploadExamLogo = (file: File) => uploadExamLogoForSlot(file, "caixa");
export const removeExamLogo = () => removeExamLogoForSlot("caixa");
