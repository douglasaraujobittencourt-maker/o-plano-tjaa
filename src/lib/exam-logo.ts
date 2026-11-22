export const EXAM_LOGO_BUCKET = "logos-concursos";
export const EXAM_LOGO_ACCEPT = "image/png,image/jpeg,image/webp";
const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export function validateExamLogo(file: { type: string; size: number }) {
  if (!extensions[file.type]) throw new Error("Envie uma imagem PNG, JPG ou WEBP.");
  if (file.size === 0) throw new Error("A imagem está vazia.");
}

export function examLogoPath(userId: string, id: string, type: string) {
  if (!extensions[type]) throw new Error("Formato de imagem inválido.");
  return `${userId}/${id}.${extensions[type]}`;
}

export function ownedExamLogoPath(url: string | null, baseUrl: string, userId: string) {
  if (!url || !url.startsWith(`${baseUrl}/`)) return null;
  const path = url.slice(baseUrl.length + 1);
  if (!path.startsWith(`${userId}/`) || path.split("/").length !== 2) return null;
  return path;
}