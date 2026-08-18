import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BatchCreationClient } from "@/app/account/batches/new/BatchCreationClient";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { listRetainedBatchReferences } from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New batch check",
  description: "Compare one approved product image with multiple candidate images.",
  robots: { index: false, follow: false },
};

export default async function NewBatchPage() {
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account/batches/new");

  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
  const retainedReferences = await listRetainedBatchReferences(env.VISUALQA_DB, snapshot.workspaceId);

  return (
    <main className="account-page batch-page">
      <BatchCreationClient
        availableCredits={snapshot.available}
        batchItemLimit={snapshot.batchItemLimit}
        csvExportEnabled={snapshot.csvExportEnabled}
        planName={snapshot.planName}
        retainedReferences={retainedReferences}
        retentionDays={snapshot.retentionDays}
      />
    </main>
  );
}
