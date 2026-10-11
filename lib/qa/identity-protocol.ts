import catalog from "./identity-protocol-catalog.json";

export const IDENTITY_EVIDENCE_KINDS = ["readable_text", "brand_name", "symbol", "geometry", "absent", "unreadable", "unknown", "not_applicable"] as const;

/** Protocol spelling equivalence, not general entity/name equivalence. */
export function protocolKey(value: string): string {
  return value.replace(/[®™℠]/gu, "").normalize("NFKC").toLowerCase()
    .replace(/[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}]/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
const tokens = new Set([...catalog.tokens, ...IDENTITY_EVIDENCE_KINDS].map(protocolKey));
const fields = new Set(catalog.fields.map(protocolKey));
const prefixes = catalog.versionPrefixes.map(protocolKey);
type Trie = {children: Map<string, Trie>; terminal: boolean};
const trie: Trie = {children: new Map(), terminal: false};
for (const token of tokens) {
  let node = trie;
  for (const character of token) {
    if (!node.children.has(character)) node.children.set(character, {children: new Map(), terminal: false});
    node = node.children.get(character)!;
  }
  node.terminal = true;
}
function pureMetadata(value: string): boolean {
  const key = protocolKey(value);
  if (!key) return false;
  if (tokens.has(key) || prefixes.some(prefix => key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length)))) return true;
  // Reject metadata-only lists/key:value echoes, not substrings in normal names.
  const reachable = new Set([0]);
  for (let start = 0; start < key.length; start++) {
    if (!reachable.has(start)) continue;
    let node = trie;
    for (let end = start; end < key.length; end++) {
      const next = node.children.get(key[end]);
      if (!next) break;
      node = next;
      if (node.terminal) reachable.add(end + 1);
    }
  }
  return reachable.has(key.length);
}

export function isProtocolIdentity(value: string): boolean {
  if (pureMetadata(value)) return true;
  const normalized = value.normalize("NFKC").replace(/[\p{Default_Ignorable_Code_Point}\p{Cc}\p{Cf}]/gu, "").trim();
  // Template syntax is a class of placeholders; no guessed English entity list.
  if (/^(?:<[^<>]+>|\{\{[^{}]+\}\}|\$\{[^{}]+\})$/u.test(normalized)) return true;
  const label = normalized.match(/^["']?([\p{L}\p{N}_. -]+?)["']?\s*[:=]/u)?.[1];
  if (label && fields.has(protocolKey(label))) return true;
  try {
    const pending: unknown[] = [JSON.parse(normalized)];
    while (pending.length) {
      const node = pending.pop();
      if (typeof node === "string" && pureMetadata(node)) return true;
      if (Array.isArray(node)) pending.push(...node);
      else if (node && typeof node === "object") {
        if (Object.keys(node).some(pureMetadata)) return true;
        pending.push(...Object.values(node));
      }
    }
  } catch { /* Direct identity text need not be JSON. */ }
  return false;
}
