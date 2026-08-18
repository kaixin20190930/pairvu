import type { AnalysisCreateInput } from "./types";

type ExecutionTrigger = NonNullable<AnalysisCreateInput["executionTrigger"]>;

export async function runWithInteractiveNetworkRetry<T>(
  operation: () => Promise<T>,
  trigger: ExecutionTrigger,
  wait: (milliseconds: number) => Promise<void> = sleep,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (trigger !== "interactive" || !isTransientNetworkConnectionLost(error)) {
      throw error;
    }

    await wait(1_000);
    return operation();
  }
}

export function isTransientNetworkConnectionLost(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: unknown }).status)
      : null;

  return (status === 403 || /^403\b/.test(error.message)) && /network connection lost/i.test(error.message);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
