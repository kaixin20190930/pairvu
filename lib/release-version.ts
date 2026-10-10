// Only these two validated, non-secret identifiers may appear in public health output.
export function releaseVersion(metadata?: unknown) {
  const buildSha = process.env.PAIRVU_BUILD_SHA;
  const id = metadata && typeof metadata === "object" && "id" in metadata ? metadata.id : undefined;
  return {
    buildSha: typeof buildSha === "string" && /^[a-f0-9]{40}$/.test(buildSha) ? buildSha : "unknown",
    platformVersion: typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) ? id : "unknown",
  };
}
