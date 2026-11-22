import { supabase } from "@/integrations/supabase/external-client";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const avatarExtensions: Record<string,string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function validatePersonalPhoto(file: { type: string; size: number }) {
  if (!avatarExtensions[file.type]) {
    throw new Error("Escolha uma foto PNG, JPG ou WEBP.");
  }
  if (!file.size || file.size > AVATAR_MAX_BYTES) {
    throw new Error("A foto deve ter no máximo 5 MB.");
  }
}

async function ownerAndCurrentAvatar() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Faça login para alterar a foto pessoal.");
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("avatar_url").eq("id", data.user.id).single();
  if (profileError) throw profileError;
  return { userId: data.user.id, previousUrl: profile.avatar_url };
}

/** Só remove objetos do bucket avatars, na pasta do próprio usuário. */
function ownAvatarPath(url: string | null, userId: string) {
  if (!url) return null;
  const publicBase = supabase.storage.from(AVATAR_BUCKET).getPublicUrl("").data.publicUrl.replace(/\/$/, "");
  const prefix = publicBase + "/";
  if (!url.startsWith(prefix)) return null;
  let path: string;
  try { path = decodeURIComponent(url.slice(prefix.length).split("?")[0] ?? ""); }
  catch { return null; }
  if (!path.startsWith(userId + "/") || path.split("/").length !== 2 || path.includes("..") || path.includes("\\")) return null;
  return path;
}

async function cleanOldAvatar(url: string | null, userId: string) {
  const path = ownAvatarPath(url, userId);
  if (!path) return null;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  return error;
}

async function saveAvatar(userId: string, url: string | null) {
  const { data, error } = await supabase.from("profiles")
    .update({ avatar_url: url }).eq("id", userId)
    .select("avatar_url").single();
  if (error) throw error;
  return data.avatar_url;
}

export async function uploadPersonalPhoto(file: File) {
  validatePersonalPhoto(file);
  const { userId, previousUrl } = await ownerAndCurrentAvatar();
  const path = userId + "/" + crypto.randomUUID() + "." + avatarExtensions[file.type];
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type, upsert: false, cacheControl: "3600",
  });
  if (uploadError) throw uploadError;
  let url: string | null;
  try {
    url = await saveAvatar(userId, bucket.getPublicUrl(path).data.publicUrl);
  } catch (error) {
    await bucket.remove([path]); // sem foto órfã caso o perfil não possa ser atualizado
    throw error;
  }
  return { url, cleanupError: await cleanOldAvatar(previousUrl, userId) };
}

export async function removePersonalPhoto() {
  const { userId, previousUrl } = await ownerAndCurrentAvatar();
  const url = await saveAvatar(userId, null);
  return { url, cleanupError: await cleanOldAvatar(previousUrl, userId) };
}
