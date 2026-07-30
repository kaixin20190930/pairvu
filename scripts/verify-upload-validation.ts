import assert from "node:assert/strict";
import { Jimp } from "jimp";
import {
  AssetValidationError,
  validateM0ImageContent,
  validateM0ImageFile,
} from "../lib/assets/validation";

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Upload validation verification failed.");
  process.exitCode = 1;
});

async function main() {
  const validImage = new Jimp({ width: 8, height: 8, color: 0xffffffff });
  const validPng = await validImage.getBuffer("image/png");
  const validJpeg = await validImage.getBuffer("image/jpeg");

  validateM0ImageFile(new File([toArrayBuffer(validPng)], "valid.png", { type: "image/png" }));
  await validateM0ImageContent(toArrayBuffer(validPng), "image/png");
  await validateM0ImageContent(toArrayBuffer(validJpeg), "image/jpeg");

  await expectCode(
    () => validateM0ImageContent(toArrayBuffer(validPng), "image/jpeg"),
    "invalid_image_content",
  );
  await expectCode(
    () =>
      validateM0ImageContent(
        toArrayBuffer(Uint8Array.from([0xff, 0xd8, 0xff, 0x00, 0x01])),
        "image/jpeg",
      ),
    "image_decode_failed",
  );

  assert.throws(
    () => validateM0ImageFile(new File([], "empty.png", { type: "image/png" })),
    hasCode("file_empty"),
  );
  assert.throws(
    () => validateM0ImageFile(new File([toArrayBuffer(validPng)], "fake.gif", { type: "image/gif" })),
    hasCode("unsupported_file_type"),
  );

  console.log("Upload validation verification passed.");
}

async function expectCode(action: () => Promise<void>, code: AssetValidationError["code"]) {
  await assert.rejects(action, hasCode(code));
}

function hasCode(code: AssetValidationError["code"]) {
  return (error: unknown) => error instanceof AssetValidationError && error.code === code;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
