import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { isValidAnonymousSessionId } from "@/lib/assets/validation";
import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";
import { createPairvuAuth } from "@/lib/auth/server";

export interface RequestAccessContext {
  workspaceId: string | null;
  anonymousSessionId: string | null;
  retentionDays: number | null;
  authenticated: boolean;
}

export class RequestAccessError extends Error {
  constructor(
    public readonly code: "access_identity_required" | "invalid_anonymous_session",
    message: string,
  ) {
    super(message);
    this.name = "RequestAccessError";
  }
}

export async function resolveRequestAccess(
  env: VisualQACloudflareEnv,
  headers: Headers,
  anonymousSessionCandidate: unknown,
): Promise<RequestAccessContext> {
  const anonymousSessionId = isValidAnonymousSessionId(anonymousSessionCandidate)
    ? anonymousSessionCandidate
    : null;
  const session = await createPairvuAuth(env).api.getSession({ headers });

  if (session?.user) {
    const user = {
      id: String(session.user.id),
      name: String(session.user.name ?? ""),
      email: String(session.user.email),
    };
    const account = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, user);

    return {
      workspaceId: account.workspaceId,
      anonymousSessionId,
      retentionDays: account.retentionDays,
      authenticated: true,
    };
  }

  if (!anonymousSessionId) {
    throw new RequestAccessError(
      anonymousSessionCandidate == null ? "access_identity_required" : "invalid_anonymous_session",
      "A signed-in account or valid anonymous session is required.",
    );
  }

  return {
    workspaceId: null,
    anonymousSessionId,
    retentionDays: null,
    authenticated: false,
  };
}

export function canAccessOwnedResource(
  access: RequestAccessContext,
  resource: { workspaceId: string | null; anonymousSessionId: string | null },
): boolean {
  if (resource.workspaceId) {
    return resource.workspaceId === access.workspaceId;
  }

  return Boolean(resource.anonymousSessionId && resource.anonymousSessionId === access.anonymousSessionId);
}
