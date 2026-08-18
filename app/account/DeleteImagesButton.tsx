"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteImagesButton({
  endpoint,
  label = "Delete images",
  confirmMessage,
}: {
  endpoint: string;
  label?: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "deleting" | "deleted" | "error">("idle");
  const [message, setMessage] = useState("");

  async function removeImages() {
    if (!window.confirm(confirmMessage)) return;
    setStatus("deleting");
    setMessage("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const body = await response.json().catch(() => ({})) as { message?: string; deletion?: { deleted?: number } };
      if (!response.ok) throw new Error(body.message ?? "The images could not be deleted.");
      setStatus("deleted");
      setMessage(`${body.deletion?.deleted ?? 0} image record${body.deletion?.deleted === 1 ? "" : "s"} deleted.`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The images could not be deleted.");
    }
  }

  return (
    <span className="image-deletion-control">
      <button type="button" onClick={removeImages} disabled={status === "deleting" || status === "deleted"}>
        {status === "deleting" ? "Deleting..." : status === "deleted" ? "Images deleted" : label}
      </button>
      {message ? <small className={status === "error" ? "image-deletion-error" : "image-deletion-status"} role="status">{message}</small> : null}
    </span>
  );
}
