import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BatchCreationClient } from "@/app/account/batches/new/BatchCreationClient";
import { getWorkspaceAccountSnapshot } from "@/lib/accounts/repository";
import { createPairvuAuth } from "@/lib/auth/server";
import { listRetainedBatchReferences } from "@/lib/batches/repository";
import { getVisualQAEnv } from "@/lib/cloudflare/bindings";
import { listSelectableSavedProducts } from "@/lib/products/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New batch check",
  description: "Compare one approved product image with multiple candidate images.",
  robots: { index: false, follow: false },
};

export default async function NewBatchPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string; productId?: string }>;
}) {
  const params = await searchParams;
  const env = getVisualQAEnv();
  const session = await createPairvuAuth(env).api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?next=/account/batches/new");

  const snapshot = await getWorkspaceAccountSnapshot(env.VISUALQA_DB, {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  });
  const retainedReferences = await listRetainedBatchReferences(env.VISUALQA_DB, snapshot.workspaceId);
  const savedProducts = await listSelectableSavedProducts(env.VISUALQA_DB, snapshot.workspaceId);
  const initialSavedProductId = params.productId && savedProducts.some((product) => product.id === params.productId)
    ? params.productId
    : "";

  return (
    <main className="account-page batch-page">
      <BatchCreationClient
        availableCredits={snapshot.available}
        batchItemLimit={snapshot.batchItemLimit}
        csvExportEnabled={snapshot.csvExportEnabled}
        initialBatchId={params.batchId ?? ""}
        initialSavedProductId={initialSavedProductId}
        planName={snapshot.planName}
        retainedReferences={retainedReferences}
        savedProducts={savedProducts}
        retentionDays={snapshot.retentionDays}
      />
    </main>
  );
}
