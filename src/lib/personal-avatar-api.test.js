import { beforeEach, expect, mock, test } from "bun:test";

const base = "https://storage.example/storage/v1/object/public/avatars";
const original = { avatar_url: `${base}/owner/old.png`, exam_logo_url: "https://logo/caixa.png", exam_logo_bb_url: "https://logo/bb.png" };
let profile;
let calls;
let saveError;
let uploadError;
let authenticated;
mock.module("@/integrations/supabase/external-client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: "owner" } : null }, error: null }) },
    from: table => {
      expect(table).toBe("profiles");
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: { ...profile }, error: null }) }) }),
        update: patch => ({ eq: (column, id) => {
          expect(column).toBe("id"); expect(id).toBe("owner");
          expect(Object.keys(patch)).toEqual(["avatar_url"]);
          return { select: () => ({ single: async () => {
            calls.push(["save", patch.avatar_url]);
            if (!saveError) profile = { ...profile, ...patch };
            return { data: { avatar_url: profile.avatar_url }, error: saveError };
          } }) };
        } })
      };
    },
    storage: { from: bucket => {
      expect(bucket).toBe("avatars");
      return {
        getPublicUrl: path => ({ data: { publicUrl: `${base}/${path}` } }),
        upload: async (path, _file, options) => { calls.push(["upload", path]); expect(options.upsert).toBe(false); return { error: uploadError }; },
        remove: async paths => { calls.push(["remove", ...paths]); return { error: null }; }
      };
    } }
  }
}));
const { validatePersonalPhoto, uploadPersonalPhoto, removePersonalPhoto } = await import("./personal-avatar-api");
beforeEach(() => { profile = { ...original }; calls = []; saveError = null; uploadError = null; authenticated = true; });

for (const type of ["image/png", "image/jpeg", "image/webp"]) {
  test(`accepts personal photo ${type}`, () => expect(() => validatePersonalPhoto({ type, size: 1024 })).not.toThrow());
}
test("rejects unsupported photo formats", () => expect(() => validatePersonalPhoto({ type: "image/svg+xml", size: 1024 })).toThrow());
test("photo size is limited to 5 MB", () => {
  expect(() => validatePersonalPhoto({ type: "image/png", size: 5242880 })).not.toThrow();
  expect(() => validatePersonalPhoto({ type: "image/png", size: 5242881 })).toThrow();
});
test("rejects empty photos", () => expect(() => validatePersonalPhoto({ type: "image/png", size: 0 })).toThrow());
test("upload saves the owner URL before cleanup and leaves both logos untouched", async () => {
  const result = await uploadPersonalPhoto(new File(["photo"], "photo.png", { type: "image/png" }));
  expect(result.url).toMatch(new RegExp(`^${base}/owner/[a-f0-9-]+\\.png$`));
  expect(profile.avatar_url).toBe(result.url);
  expect(calls.map(call => call[0])).toEqual(["upload", "save", "remove"]);
  expect(calls[2]).toEqual(["remove", "owner/old.png"]);
  expect(profile.exam_logo_url).toBe(original.exam_logo_url);
  expect(profile.exam_logo_bb_url).toBe(original.exam_logo_bb_url);
});
test("removal clears only the personal photo", async () => {
  await removePersonalPhoto();
  expect(profile).toEqual({ ...original, avatar_url: null });
  expect(calls).toEqual([["save", null], ["remove", "owner/old.png"]]);
});
test("a failed profile update preserves the previous photo and cleans only the new upload", async () => {
  saveError = new Error("save rejected");
  await expect(uploadPersonalPhoto(new File(["photo"], "photo.png", { type: "image/png" }))).rejects.toThrow("save rejected");
  expect(profile).toEqual(original);
  expect(calls[2]).toEqual(["remove", calls[0]?.[1]]);
  expect(calls.flat()).not.toContain("owner/old.png");
});
test("an upload failure does not change the saved profile", async () => {
  uploadError = new Error("upload rejected");
  await expect(uploadPersonalPhoto(new File(["photo"], "photo.png", { type: "image/png" }))).rejects.toThrow("upload rejected");
  expect(profile).toEqual(original);
  expect(calls.map(call => call[0])).toEqual(["upload"]);
});
test("only the owner's avatar file can be cleaned, never a logo or another owner's file", async () => {
  for (const url of ["https://storage.example/storage/v1/object/public/logos-concursos/owner/logo.png", `${base}/other/photo.png`, `${base}/owner/%2e%2e/other.png`]) {
    profile.avatar_url = url; calls = [];
    await removePersonalPhoto();
    expect(calls).toEqual([["save", null]]);
  }
});
test("signed-out users cannot upload or remove personal photos", async () => {
  authenticated = false;
  await expect(uploadPersonalPhoto(new File(["photo"], "photo.png", { type: "image/png" }))).rejects.toThrow("Faça login");
  await expect(removePersonalPhoto()).rejects.toThrow("Faça login");
  expect(calls).toEqual([]);
});