import { test } from "node:test";
import { strict as assert } from "node:assert";
import { examLogoPath, ownedExamLogoPath, validateExamLogo } from "./exam-logo";

test("accepts PNG logos", () => assert.doesNotThrow(() => validateExamLogo({ type: "image/png", size: 10 })));
test("accepts JPG logos", () => assert.doesNotThrow(() => validateExamLogo({ type: "image/jpeg", size: 10 })));
test("accepts WEBP logos", () => assert.doesNotThrow(() => validateExamLogo({ type: "image/webp", size: 10 })));
test("rejects unsupported image formats", () => assert.throws(() => validateExamLogo({ type: "image/svg+xml", size: 10 })));
test("upload paths belong to the signed-in user", () => assert.equal(examLogoPath("owner", "unique", "image/jpeg"), "owner/unique.jpg"));
test("cleanup only deletes the owner's stored logo", () => {
  assert.equal(ownedExamLogoPath("https://storage/logo/other/image.png", "https://storage/logo", "owner"), null);
  assert.equal(ownedExamLogoPath("https://other/logo/owner/image.png", "https://storage/logo", "owner"), null);
  assert.equal(ownedExamLogoPath("https://storage/logo/owner/image.png", "https://storage/logo", "owner"), "owner/image.png");
});