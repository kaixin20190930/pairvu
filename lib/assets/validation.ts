const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MAX_M0_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_M0_IMAGE_PIXELS = 25_000_000;

export class AssetValidationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "unsupported_file_type"
      | "file_too_large"
      | "file_empty"
      | "missing_session"
      | "invalid_session"
      | "invalid_image_content"
      | "image_decode_failed"
      | "image_dimensions_too_large",
  ) {
    super(message);
    this.name = "AssetValidationError";
  }
}

export function validateM0ImageFile(file: File): void {
  if (file.size <= 0) {
    throw new AssetValidationError("The uploaded image is empty.", "file_empty");
  }

  if (file.size > MAX_M0_IMAGE_BYTES) {
    throw new AssetValidationError("The uploaded image exceeds the M0 size limit.", "file_too_large");
  }

  if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new AssetValidationError("The uploaded file type is not supported for M0.", "unsupported_file_type");
  }
}

export async function validateM0ImageContent(buffer: ArrayBuffer, declaredMimeType: string): Promise<void> {
  if (!matchesDeclaredImageSignature(new Uint8Array(buffer), declaredMimeType)) {
    throw new AssetValidationError(
      "The file content does not match the declared image type.",
      "invalid_image_content",
    );
  }

  try {
    const { width, height } = readImageDimensions(new Uint8Array(buffer), declaredMimeType);

    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0 ||
      width * height > MAX_M0_IMAGE_PIXELS
    ) {
      throw new AssetValidationError(
        "The image dimensions exceed the M0 processing limit.",
        "image_dimensions_too_large",
      );
    }
  } catch (error) {
    if (error instanceof AssetValidationError) {
      throw error;
    }
    throw new AssetValidationError("The image is corrupt or could not be decoded.", "image_decode_failed");
  }
}

export function validateAnonymousSession(anonymousSessionId?: string): void {
  if (!anonymousSessionId) {
    throw new AssetValidationError("Anonymous uploads require a session id.", "missing_session");
  }

  if (!isValidAnonymousSessionId(anonymousSessionId)) {
    throw new AssetValidationError("Anonymous session id is invalid.", "invalid_session");
  }
}

export function isValidAnonymousSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function matchesDeclaredImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
  }

  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      ascii(bytes, 0, 4) === "RIFF" &&
      ascii(bytes, 8, 12) === "WEBP"
    );
  }

  return false;
}

function readImageDimensions(bytes: Uint8Array, mimeType: string): { width: number; height: number } {
  if (mimeType === "image/png") {
    return readPngDimensions(bytes);
  }

  if (mimeType === "image/jpeg") {
    return readJpegDimensions(bytes);
  }

  if (mimeType === "image/webp") {
    return readWebpDimensions(bytes);
  }

  throw new Error("Unsupported image type.");
}

function readPngDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24 || ascii(bytes, 12, 16) !== "IHDR") {
    throw new Error("Invalid PNG header.");
  }

  return {
    width: readUint32BE(bytes, 16),
    height: readUint32BE(bytes, 20),
  };
}

function readJpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;

  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) {
      offset += 1;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0x01) {
      continue;
    }

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const segmentLength = readUint16BE(bytes, offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      break;
    }

    if (isJpegStartOfFrame(marker)) {
      if (segmentLength < 7) {
        break;
      }

      return {
        height: readUint16BE(bytes, offset + 3),
        width: readUint16BE(bytes, offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found.");
}

function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const chunkType = ascii(bytes, offset, offset + 4);
    const chunkSize = readUint32LE(bytes, offset + 4);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + chunkSize + (chunkSize % 2);

    if (dataOffset + chunkSize > bytes.length) {
      break;
    }

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: readUint24LE(bytes, dataOffset + 4) + 1,
        height: readUint24LE(bytes, dataOffset + 7) + 1,
      };
    }

    if (chunkType === "VP8 " && chunkSize >= 10) {
      return {
        width: readUint16LE(bytes, dataOffset + 6) & 0x3fff,
        height: readUint16LE(bytes, dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === "VP8L" && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
      const bits = readUint32LE(bytes, dataOffset + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    offset = nextOffset;
  }

  throw new Error("WEBP dimensions not found.");
}

function isJpegStartOfFrame(marker: number): boolean {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  );
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] * 256 + bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + bytes[offset + 1] * 256;
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536;
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 16777216 +
    bytes[offset + 1] * 65536 +
    bytes[offset + 2] * 256 +
    bytes[offset + 3]
  );
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] +
    bytes[offset + 1] * 256 +
    bytes[offset + 2] * 65536 +
    bytes[offset + 3] * 16777216
  );
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}
