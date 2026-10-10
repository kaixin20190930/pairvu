import { SavedProductError, type ProductBinding, type ProductProfile } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = ["profileSchemaVersion", "name", "skuLabel", "brand", "variant", "capacity", "packagingVersion", "criticalAttributes", "allowedChanges"];
function invalid(message: string, code = "invalid_profile"): never { throw new SavedProductError(code, message); }
function object(value: unknown, keys: string[], code = "invalid_profile"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("A complete object is required.", code);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || keys.some(key => !Object.hasOwn(record, key))) return invalid("Missing or unsupported fields.", code);
  return record;
}
function text(value: unknown, max: number, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || /[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/u.test(value)) return invalid("Use plain text without control characters.");
  const normalized = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (/[<>]|(?:https?:\/\/|file:\/\/|www\.)/iu.test(normalized)) return invalid("Use plain product text without HTML or addresses.");
  if (!normalized && nullable) return null;
  if (!normalized || normalized.length > max) return invalid(`Text must contain 1–${max} characters.`);
  return normalized;
}
export function normalizeProductProfile(value: unknown): ProductProfile {
  const p = object(value, fields);
  if (p.profileSchemaVersion !== 1) invalid("Unsupported profile schema version.");
  let capacity: ProductProfile["capacity"] = null;
  if (p.capacity !== null) {
    const c = object(p.capacity, ["value", "unit"]);
    if (typeof c.value !== "string" || !/^[0-9]{1,9}(\.[0-9]{1,3})?$/.test(c.value) || typeof c.unit !== "string" || !["ml", "l", "g", "kg", "count"].includes(c.unit)) invalid("Capacity needs a positive decimal string and a supported unit.");
    const [whole, fraction = ""] = (c.value as string).split(".");
    const integer = whole.replace(/^0+(?=\d)/, ""), decimal = fraction.replace(/0+$/, "");
    if (integer === "0" && !decimal || c.unit === "count" && decimal) invalid("Capacity must be positive; count must be an integer.");
    capacity = { value: integer + (decimal ? `.${decimal}` : ""), unit: c.unit as NonNullable<ProductProfile["capacity"]>["unit"] };
  }
  if (!Array.isArray(p.criticalAttributes) || p.criticalAttributes.length > 12 || !Array.isArray(p.allowedChanges) || p.allowedChanges.length > 8) invalid("Too many attributes or allowed changes.");
  const seen = new Set<string>();
  const criticalAttributes = (p.criticalAttributes as unknown[]).map(value => {
    const a = object(value, ["key", "value", "visibility"]), key = text(a.key, 40)!;
    const lowered = key.toLocaleLowerCase("en-US");
    if (seen.has(lowered) || ["name", "skulabel", "brand", "variant", "capacity", "packagingversion"].includes(lowered)) invalid("Attribute keys must be unique and must not duplicate profile fields.");
    seen.add(lowered);
    if (typeof a.visibility !== "string" || !["visible_required", "view_dependent", "not_visually_verifiable"].includes(a.visibility)) invalid("Unsupported attribute visibility.");
    return { key, value: text(a.value, 160)!, visibility: a.visibility as ProductProfile["criticalAttributes"][number]["visibility"] };
  }).sort((a,b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  seen.clear();
  const allowedChanges = (p.allowedChanges as unknown[]).map(value => {
    const a = object(value, ["key", "note"]);
    if (typeof a.key !== "string" || !["background", "lighting", "shadow", "placement", "camera_angle"].includes(a.key) || seen.has(a.key)) invalid("Unsupported or duplicate allowed change.");
    seen.add(a.key as string);
    return { key: a.key as ProductProfile["allowedChanges"][number]["key"], note: text(a.note, 160, true) };
  }).sort((a,b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  const normalized: ProductProfile = { profileSchemaVersion: 1, name: text(p.name,120)!, skuLabel: text(p.skuLabel,80,true), brand: text(p.brand,80,true), variant: text(p.variant,120,true), capacity, packagingVersion: text(p.packagingVersion,80,true), criticalAttributes, allowedChanges };
  if (new TextEncoder().encode(JSON.stringify(normalized)).length > 16384) invalid("Product standard exceeds 16 KiB.");
  return normalized;
}
export function validateMutationIdentity(requestId: unknown, expectedVersion: unknown) {
  if (typeof requestId !== "string" || !UUID.test(requestId) || !Number.isSafeInteger(expectedVersion) || (expectedVersion as number) < 0 || (expectedVersion as number) >= Number.MAX_SAFE_INTEGER) invalid("A request UUID and safe nonnegative version are required.");
  return { requestId: requestId as string, expectedVersion: expectedVersion as number };
}
export function normalizeProductBinding(value: unknown): ProductBinding | null {
  if (value === undefined || value === null) return null;
  const b = object(value,["productId","expectedVersion","profileVersionId","referenceVersionId"],"invalid_binding");
  if ([b.productId,b.profileVersionId,b.referenceVersionId].some(id => typeof id !== "string" || !UUID.test(id)) || !Number.isSafeInteger(b.expectedVersion) || (b.expectedVersion as number)<0) invalid("A complete product binding with valid identifiers and version is required.","invalid_binding");
  return { productId:b.productId as string, expectedVersion:b.expectedVersion as number, profileVersionId:b.profileVersionId as string, referenceVersionId:b.referenceVersionId as string };
}
export function productProfilesEnabled(env: {PRODUCT_PROFILES_ENABLED?: string}) { return env.PRODUCT_PROFILES_ENABLED === "true"; }
export function requireProductProfilesEnabled(enabled: boolean | undefined) {
  if (!enabled) throw new SavedProductError("product_profiles_disabled","Product standards are currently unavailable for new tasks.",403);
}
export async function profileHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}
export async function readProfileRequest(request: Request): Promise<Record<string,unknown>> {
  if (Number(request.headers.get("content-length")) > 32768) invalid("Request exceeds 32 KiB.");
  const reader=request.body?.getReader();
  const chunks: Uint8Array[]=[]; let size=0;
  if(reader) while(true) { const {done,value}=await reader.read(); if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();invalid("Request exceeds 32 KiB.");}chunks.push(value); }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let parsed: unknown;try {parsed=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));}catch {invalid("Invalid JSON request.");}
  return object(parsed,["requestId","expectedVersion","profile"]);
}
