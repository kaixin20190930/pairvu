"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedbackKind, PersistedAnalysisResult } from "@/lib/analysis/types";
import { PRODUCT_NAME } from "@/lib/config/product";
import {
  captureAcquisitionContext,
  sizeBucket,
  trackProductEvent,
  type ClientAcquisitionContext,
} from "@/lib/analytics/client";
import type { PublicRuntimeConfig } from "@/lib/config/public-beta";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { PairvuLogo } from "@/components/PairvuLogo";

type UploadState = {
  assetId: string;
  previewUrl: string;
  fileName: string;
};

type UploadDraft = {
  assetId: string;
  fileName: string;
};

type DraftUploads = {
  reference?: UploadDraft;
  candidate?: UploadDraft;
  updatedAt: string;
};

type ActiveAnalysisRequest = {
  analysisId: string;
  idempotencyKey: string;
  referenceAssetId: string;
  candidateAssetId: string;
  referenceFileName: string;
  candidateFileName: string;
  startedAt: string;
};

type CompletedAnalysisRequest = ActiveAnalysisRequest & {
  completedAt: string;
};

type ApiError = {
  error?: string;
  message?: string;
  analysisId?: string;
  retryAfterSeconds?: number | null;
};

type UiError = {
  title: string;
  message: string;
  help: string;
};

type AssetPreviewErrorCode =
  | "asset_deleted"
  | "asset_expired"
  | "asset_binary_missing"
  | "asset_unavailable"
  | "asset_not_found"
  | "unknown";

class AssetPreviewRestoreError extends Error {
  constructor(public readonly code: AssetPreviewErrorCode) {
    super(code);
    this.name = "AssetPreviewRestoreError";
  }
}

const FEEDBACK_OPTIONS: Array<{ kind: FeedbackKind; label: string }> = [
  { kind: "correct", label: "Correct" },
  { kind: "false_alarm", label: "False alarm" },
  { kind: "missed_something", label: "Missed something" },
];

const FALSE_ALARM_REASONS = [
  { value: "no_real_change", label: "There was no real product change" },
  { value: "background_only", label: "It was only a background change" },
  { value: "lighting_or_reflection", label: "It was lighting or reflection" },
  { value: "viewpoint_or_position", label: "It was viewpoint or position" },
  { value: "text_read_incorrectly", label: "The text was read incorrectly" },
  { value: "attribute_not_visible", label: "The reported detail was not visible enough" },
  { value: "other", label: "Other" },
];

const MISSED_FAMILIES = [
  { value: "logo", label: "Logo" },
  { value: "visible_text", label: "Visible text or printed value" },
  { value: "quantity", label: "Product count" },
  { value: "dominant_color", label: "Main color" },
  { value: "major_components", label: "Major components" },
  { value: "major_shape_packaging", label: "Shape or packaging" },
  { value: "not_observable", label: "It should have asked for review" },
  { value: "other", label: "Other" },
];

const ACTIVE_ANALYSIS_STORAGE_KEY = "visualqa.activeAnalysis";
const COMPLETED_ANALYSIS_STORAGE_KEY = "visualqa.completedAnalysis";
const DRAFT_UPLOADS_STORAGE_KEY = "visualqa.draftUploads";
const RECOVERY_POLL_INTERVAL_MS = 1_500;
const RECOVERY_TIMEOUT_MS = 3 * 60_000;
const COMPLETED_ANALYSIS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function ProductChecker() {
  const [reference, setReference] = useState<UploadState | null>(null);
  const [candidate, setCandidate] = useState<UploadState | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [uploadingCandidate, setUploadingCandidate] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [recoveringAnalysis, setRecoveringAnalysis] = useState(false);
  const [previewRecoveryError, setPreviewRecoveryError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PersistedAnalysisResult | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackDetailKind, setFeedbackDetailKind] = useState<Exclude<FeedbackKind, "correct"> | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackIssueId, setFeedbackIssueId] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [runtimeConfig, setRuntimeConfig] = useState<PublicRuntimeConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileRefreshKey, setTurnstileRefreshKey] = useState(0);
  const acquisitionContext = useRef<ClientAcquisitionContext | null>(null);
  const priorAnalysisError = useRef(false);
  const recoveryRunId = useRef(0);

  useEffect(() => {
    const anonymousSessionId = getAnonymousSessionId();
    const context = captureAcquisitionContext();
    acquisitionContext.current = context;
    void trackProductEvent({
      eventName: "landing_view",
      anonymousSessionId,
      attribution: context.attribution,
      idempotencyKey: `landing:${context.pageViewId}`,
    }).catch(logClientEventFailure);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/runtime-config", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Runtime config failed with status ${response.status}.`);
        }

        return (await response.json()) as PublicRuntimeConfig;
      })
      .then((config) => {
        if (!cancelled) {
          setRuntimeConfig(config);
        }
      })
      .catch((runtimeError) => {
        console.warn("runtime_config_failed", runtimeError);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reference?.previewUrl) URL.revokeObjectURL(reference.previewUrl);
      if (candidate?.previewUrl) URL.revokeObjectURL(candidate.previewUrl);
    };
  }, [candidate?.previewUrl, reference?.previewUrl]);

  const turnstileRequired = runtimeConfig?.turnstileEnabled ?? false;
  const canCheck =
    Boolean(reference?.assetId && candidate?.assetId) &&
    !analyzing &&
    !uploadingReference &&
    !uploadingCandidate &&
    (runtimeConfig?.analysisAcceptingNewRequests ?? true) &&
    (!turnstileRequired || Boolean(turnstileToken));
  const verdictLabel = useMemo(() => {
    if (!analysis) {
      return null;
    }

    return analysis.status === "failed" ? "Execution failed" : analysis.verdict ? analysis.verdict.toUpperCase() : "REVIEW";
  }, [analysis]);

  async function onUpload(file: File, kind: "reference" | "candidate") {
    const setUploading = kind === "reference" ? setUploadingReference : setUploadingCandidate;
    setUploading(true);
    setError(null);
    setFeedbackMessage(null);
    if (analysis) {
      clearCompletedAnalysisRequest();
      setAnalysis(null);
      resetFeedbackDetail();
    }
    const anonymousSessionId = getAnonymousSessionId();
    const attribution = acquisitionContext.current?.attribution;
    const uploadStartedEvent = kind === "reference" ? "reference_upload_started" : "candidate_upload_started";
    const uploadCompletedEvent = kind === "reference" ? "reference_upload_completed" : "candidate_upload_completed";
    const uploadFailedEvent = kind === "reference" ? "reference_upload_failed" : "candidate_upload_failed";

    void trackProductEvent({
      eventName: "checker_started",
      anonymousSessionId,
      attribution,
      idempotencyKey: `checker:${anonymousSessionId}`,
    }).catch(logClientEventFailure);
    void trackProductEvent({
      eventName: uploadStartedEvent,
      anonymousSessionId,
      attribution,
      properties: {
        mimeType: file.type,
        sizeBucket: sizeBucket(file.size),
      },
    }).catch(logClientEventFailure);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      formData.append("anonymousSessionId", anonymousSessionId);

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { asset?: { id: string } } & ApiError;

      if (!response.ok || !payload.asset) {
        setError(formatApiError(payload, "Upload failed."));
        void trackProductEvent({
          eventName: uploadFailedEvent,
          anonymousSessionId,
          attribution,
          properties: {
            errorCode: payload.error ?? `upload_http_${response.status}`,
            httpStatus: response.status,
            mimeType: file.type,
            sizeBucket: sizeBucket(file.size),
            retryable: response.status === 408 || response.status === 429 || response.status >= 500,
          },
        }).catch(logClientEventFailure);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const nextAsset = {
        assetId: payload.asset.id,
        previewUrl,
        fileName: file.name,
      };

      if (kind === "reference") {
        setReference((current) => {
          if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
          return nextAsset;
        });
      } else {
        setCandidate((current) => {
          if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
          return nextAsset;
        });
      }
      saveDraftUpload(kind, nextAsset);
      void trackProductEvent({
        eventName: uploadCompletedEvent,
        anonymousSessionId,
        attribution,
        properties: {
          mimeType: file.type,
          sizeBucket: sizeBucket(file.size),
        },
      }).catch(logClientEventFailure);
    } catch (uploadError) {
      setError(formatThrownError(uploadError, "Upload failed."));
      void trackProductEvent({
        eventName: uploadFailedEvent,
        anonymousSessionId,
        attribution,
        properties: {
          errorCode: uploadError instanceof Error ? "network_error" : "unknown_upload_error",
          errorType: uploadError instanceof Error ? uploadError.name : "unknown",
          mimeType: file.type,
          sizeBucket: sizeBucket(file.size),
          retryable: true,
        },
      }).catch(logClientEventFailure);
    } finally {
      setUploading(false);
    }
  }

  async function onAnalyze() {
    if (!reference || !candidate) return;

    const activeRequest: ActiveAnalysisRequest = {
      analysisId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      referenceAssetId: reference.assetId,
      candidateAssetId: candidate.assetId,
      referenceFileName: reference.fileName,
      candidateFileName: candidate.fileName,
      startedAt: new Date().toISOString(),
    };
    saveActiveAnalysisRequest(activeRequest);
    setAnalyzing(true);
    setRecoveringAnalysis(false);
    setError(null);
    setAnalysis(null);
    setFeedbackMessage(null);
    resetFeedbackDetail();
    let delegatedToRecovery = false;

    try {
      const anonymousSessionId = getAnonymousSessionId();
      const attribution = acquisitionContext.current?.attribution;
      if (priorAnalysisError.current) {
        void trackProductEvent({
          eventName: "retry_clicked",
          anonymousSessionId,
          attribution,
        }).catch(logClientEventFailure);
      }
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceAssetId: reference.assetId,
          candidateAssetId: candidate.assetId,
          anonymousSessionId,
          analysisId: activeRequest.analysisId,
          idempotencyKey: activeRequest.idempotencyKey,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      const payload = (await response.json()) as { analysis?: PersistedAnalysisResult } & ApiError;

      if (!response.ok || !payload.analysis) {
        clearActiveAnalysisRequest(activeRequest.analysisId);
        setError(formatApiError(payload, "Analysis failed."));
        priorAnalysisError.current = true;
        return;
      }

      if (payload.analysis.status === "running" || payload.analysis.status === "queued") {
        const runId = recoveryRunId.current + 1;
        recoveryRunId.current = runId;
        delegatedToRecovery = true;
        await recoverAnalysis(activeRequest, runId);
        return;
      }

      clearActiveAnalysisRequest(activeRequest.analysisId);
      if (payload.analysis.status === "failed") {
        setError(formatThrownError(new Error(payload.analysis.errorMessage ?? "Analysis failed."), "Analysis failed."));
        priorAnalysisError.current = true;
        return;
      }

      saveCompletedAnalysisRequest(activeRequest, payload.analysis);
      clearDraftUploads();
      setAnalysis(payload.analysis);
      priorAnalysisError.current = false;
      trackResultViewed(payload.analysis, anonymousSessionId);
    } catch (analysisError) {
      if (readActiveAnalysisRequest()?.analysisId === activeRequest.analysisId) {
        const runId = recoveryRunId.current + 1;
        recoveryRunId.current = runId;
        delegatedToRecovery = true;
        await recoverAnalysis(activeRequest, runId);
      } else {
        priorAnalysisError.current = true;
        setError(formatThrownError(analysisError, "Analysis failed."));
      }
    } finally {
      if (!delegatedToRecovery) {
        setAnalyzing(false);
      }
      if (runtimeConfig?.turnstileEnabled) {
        setTurnstileToken(null);
        setTurnstileRefreshKey((current) => current + 1);
      }
    }
  }

  async function recoverAnalysis(activeRequest: ActiveAnalysisRequest, runId: number) {
    const anonymousSessionId = getAnonymousSessionId();
    const maxPollAttempts = Math.ceil(RECOVERY_TIMEOUT_MS / RECOVERY_POLL_INTERVAL_MS);
    const maxMissingAttempts = Math.ceil(10_000 / RECOVERY_POLL_INTERVAL_MS);
    let pollAttempt = 0;
    setAnalyzing(true);
    setRecoveringAnalysis(true);
    setError(null);
    setAnalysis(null);

    try {
      while (recoveryRunId.current === runId) {
        pollAttempt += 1;
        const response = await fetch(`/api/analyses/${activeRequest.analysisId}`, {
          cache: "no-store",
          headers: {
            "x-anonymous-session-id": anonymousSessionId,
          },
        });

        if (response.status === 404 && pollAttempt <= maxMissingAttempts) {
          await waitForRecoveryPoll();
          continue;
        }

        const payload = (await response.json()) as { analysis?: PersistedAnalysisResult } & ApiError;
        if (!response.ok || !payload.analysis) {
          clearActiveAnalysisRequest(activeRequest.analysisId);
          setError(formatApiError(payload, "The previous analysis could not be restored."));
          return;
        }

        if (payload.analysis.status === "completed") {
          clearActiveAnalysisRequest(activeRequest.analysisId);
          saveCompletedAnalysisRequest(activeRequest, payload.analysis);
          clearDraftUploads();
          setAnalysis(payload.analysis);
          priorAnalysisError.current = false;
          trackResultViewed(payload.analysis, anonymousSessionId);
          return;
        }

        if (payload.analysis.status === "failed") {
          clearActiveAnalysisRequest(activeRequest.analysisId);
          priorAnalysisError.current = true;
          setError(formatThrownError(new Error(payload.analysis.errorMessage ?? "Analysis failed."), "Analysis failed."));
          return;
        }

        if (pollAttempt >= maxPollAttempts) {
          throw new Error("The analysis is still running. Refresh this page to continue checking its status.");
        }

        await waitForRecoveryPoll();
      }
    } catch (recoveryError) {
      priorAnalysisError.current = true;
      setError(formatThrownError(recoveryError, "The previous analysis could not be restored."));
    } finally {
      if (recoveryRunId.current === runId) {
        setAnalyzing(false);
        setRecoveringAnalysis(false);
      }
    }
  }

  async function restoreAnalysisPreviews(activeRequest: ActiveAnalysisRequest, runId: number) {
    setPreviewRecoveryError(null);

    const results = await Promise.allSettled([
      restoreAssetPreview(activeRequest.referenceAssetId, activeRequest.referenceFileName, setReference, runId),
      restoreAssetPreview(activeRequest.candidateAssetId, activeRequest.candidateFileName, setCandidate, runId),
    ]);

    if (recoveryRunId.current === runId) {
      const failedCodes = results.flatMap((result) =>
        result.status === "rejected" && result.reason instanceof AssetPreviewRestoreError
          ? [result.reason.code]
          : result.status === "rejected"
            ? ["unknown" as const]
            : [],
      );

      if (failedCodes.some((code) => code === "asset_deleted")) {
        setPreviewRecoveryError(
          "One or both saved images were deleted. The analysis result remains available, but the deleted previews cannot be restored.",
        );
      } else if (failedCodes.some((code) => code === "asset_expired")) {
        setPreviewRecoveryError(
          "One or both saved images reached the end of their retention period. The analysis result remains available.",
        );
      } else if (failedCodes.length > 0) {
        setPreviewRecoveryError(
          "One or both saved previews are temporarily unavailable. The analysis result is still available; refresh to try the previews again.",
        );
      }
    }
  }

  async function restoreDraftUploads(draftUploads: DraftUploads, runId: number) {
    setPreviewRecoveryError(null);

    const restoreJobs = [
      draftUploads.reference
        ? restoreAssetPreview(draftUploads.reference.assetId, draftUploads.reference.fileName, setReference, runId)
        : Promise.resolve(),
      draftUploads.candidate
        ? restoreAssetPreview(draftUploads.candidate.assetId, draftUploads.candidate.fileName, setCandidate, runId)
        : Promise.resolve(),
    ];

    const results = await Promise.allSettled(restoreJobs);

    if (recoveryRunId.current === runId && results.some((result) => result.status === "rejected")) {
      clearDraftUploads();
      setPreviewRecoveryError("Uploaded images could not be restored. Please upload the images again.");
    }
  }

  async function restoreAssetPreview(
    assetId: string,
    fileName: string,
    setAsset: (updater: (current: UploadState | null) => UploadState) => void,
    runId: number,
  ) {
    const response = await fetch(`/api/assets/${assetId}`, {
      cache: "no-store",
      headers: {
        "x-anonymous-session-id": getAnonymousSessionId(),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      throw new AssetPreviewRestoreError(normalizeAssetPreviewErrorCode(payload?.error));
    }

    const previewUrl = URL.createObjectURL(await response.blob());
    if (recoveryRunId.current !== runId) {
      URL.revokeObjectURL(previewUrl);
      return;
    }

    setAsset((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        assetId,
        fileName,
        previewUrl,
      };
    });
  }

  async function restoreCompletedAnalysis(completedRequest: CompletedAnalysisRequest, runId: number) {
    const anonymousSessionId = getAnonymousSessionId();
    setAnalyzing(true);
    setRecoveringAnalysis(true);
    setError(null);
    setPreviewRecoveryError(null);

    setReference({
      assetId: completedRequest.referenceAssetId,
      fileName: completedRequest.referenceFileName,
      previewUrl: "",
    });
    setCandidate({
      assetId: completedRequest.candidateAssetId,
      fileName: completedRequest.candidateFileName,
      previewUrl: "",
    });

    try {
      await restoreAnalysisPreviews(completedRequest, runId);

      const response = await fetch(`/api/analyses/${completedRequest.analysisId}`, {
        cache: "no-store",
        headers: {
          "x-anonymous-session-id": anonymousSessionId,
        },
      });
      const payload = (await response.json()) as { analysis?: PersistedAnalysisResult } & ApiError;

      if (!response.ok || !payload.analysis || payload.analysis.status !== "completed") {
        setError(formatApiError(payload, "The saved result could not be restored."));
        return;
      }

      if (recoveryRunId.current !== runId) return;

      setAnalysis(payload.analysis);
      priorAnalysisError.current = false;
      trackResultViewed(payload.analysis, anonymousSessionId);
    } catch (restoreError) {
      if (recoveryRunId.current === runId) {
        setError(formatThrownError(restoreError, "The saved result could not be restored."));
      }
    } finally {
      if (recoveryRunId.current === runId) {
        setAnalyzing(false);
        setRecoveringAnalysis(false);
      }
    }
  }

  async function restoreWorkspaceAnalysis(analysisId: string, runId: number) {
    const anonymousSessionId = getAnonymousSessionId();
    setAnalyzing(true);
    setRecoveringAnalysis(true);
    setError(null);
    setPreviewRecoveryError(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        cache: "no-store",
        headers: { "x-anonymous-session-id": anonymousSessionId },
      });
      const payload = (await response.json()) as { analysis?: PersistedAnalysisResult } & ApiError;
      if (!response.ok || !payload.analysis || payload.analysis.status !== "completed") {
        setError(formatApiError(payload, "The saved result could not be restored."));
        return;
      }

      const result = payload.analysis;
      const request: CompletedAnalysisRequest = {
        analysisId: result.id,
        idempotencyKey: `history:${result.id}`,
        referenceAssetId: result.referenceAssetId,
        candidateAssetId: result.candidateAssetId,
        referenceFileName: "Approved original",
        candidateFileName: "Image checked",
        startedAt: result.startedAt ?? result.createdAt,
        completedAt: result.completedAt ?? result.updatedAt,
      };
      setReference({ assetId: result.referenceAssetId, fileName: request.referenceFileName, previewUrl: "" });
      setCandidate({ assetId: result.candidateAssetId, fileName: request.candidateFileName, previewUrl: "" });
      await restoreAnalysisPreviews(request, runId);
      if (recoveryRunId.current !== runId) return;

      setAnalysis(result);
      saveCompletedAnalysisRequest(request, result);
      priorAnalysisError.current = false;
      trackResultViewed(result, anonymousSessionId);
    } catch (restoreError) {
      if (recoveryRunId.current === runId) {
        setError(formatThrownError(restoreError, "The saved result could not be restored."));
      }
    } finally {
      if (recoveryRunId.current === runId) {
        setAnalyzing(false);
        setRecoveringAnalysis(false);
      }
    }
  }

  function trackResultViewed(result: PersistedAnalysisResult, anonymousSessionId: string) {
    void trackProductEvent({
      eventName: "result_viewed",
      anonymousSessionId,
      analysisId: result.id,
      attribution: acquisitionContext.current?.attribution,
      idempotencyKey: `result-viewed:${anonymousSessionId}:${result.id}`,
      properties: {
        verdict: result.verdict,
      },
    }).catch(logClientEventFailure);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const requestedAnalysisId = new URLSearchParams(window.location.search).get("analysis");
    const activeRequest = readActiveAnalysisRequest();
    const completedRequest = activeRequest ? null : readCompletedAnalysisRequest();
    const draftUploads = activeRequest || completedRequest ? null : readDraftUploads();
    if (!requestedAnalysisId && !activeRequest && !completedRequest && !draftUploads) return;

    const startTimer = window.setTimeout(() => {
      const runId = recoveryRunId.current + 1;
      recoveryRunId.current = runId;

      if (requestedAnalysisId) {
        void restoreWorkspaceAnalysis(requestedAnalysisId, runId);
        return;
      }

      if (activeRequest) {
        setReference({
          assetId: activeRequest.referenceAssetId,
          fileName: activeRequest.referenceFileName,
          previewUrl: "",
        });
        setCandidate({
          assetId: activeRequest.candidateAssetId,
          fileName: activeRequest.candidateFileName,
          previewUrl: "",
        });

        void restoreAnalysisPreviews(activeRequest, runId);
        void recoverAnalysis(activeRequest, runId);
        return;
      }

      if (completedRequest) {
        void restoreCompletedAnalysis(completedRequest, runId);
        return;
      }

      if (draftUploads) {
        void restoreDraftUploads(draftUploads, runId);
      }
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
      recoveryRunId.current += 1;
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  async function submitFeedback(
    kind: FeedbackKind,
    detail?: { reason?: string; checkFamily?: string; issueId?: string; comment?: string },
  ) {
    if (!analysis) return;

    setFeedbackKind(kind);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/analyses/${analysis.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackKind: kind,
          anonymousSessionId: getAnonymousSessionId(),
          reasonCode: kind === "false_alarm" ? detail?.reason : undefined,
          checkFamily: detail?.checkFamily,
          issueId: detail?.issueId || undefined,
          comment: detail?.comment?.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { analysis?: PersistedAnalysisResult } & ApiError;

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.message ?? payload.error ?? "Feedback failed.");
      }

      setAnalysis(payload.analysis);
      saveCompletedAnalysisFromExisting(payload.analysis);
      setFeedbackMessage("Feedback saved.");
      resetFeedbackDetail();
      void trackProductEvent({
        eventName: "feedback_submitted",
        anonymousSessionId: getAnonymousSessionId(),
        analysisId: analysis.id,
        attribution: acquisitionContext.current?.attribution,
        properties: {
          feedbackKind: kind,
          ...(detail?.reason ? { feedbackReason: detail.reason } : {}),
          ...(detail?.checkFamily ? { checkFamily: detail.checkFamily } : {}),
          ...(detail?.issueId ? { issueId: detail.issueId } : {}),
        },
      }).catch(logClientEventFailure);
    } catch (feedbackError) {
      setFeedbackMessage(feedbackError instanceof Error ? feedbackError.message : "Feedback failed.");
    } finally {
      setFeedbackKind(null);
    }
  }

  function resetFeedbackDetail() {
    setFeedbackDetailKind(null);
    setFeedbackReason("");
    setFeedbackIssueId("");
    setFeedbackComment("");
  }

  function resetForAnotherCheck() {
    recoveryRunId.current += 1;
    clearActiveAnalysisRequest();
    clearCompletedAnalysisRequest();
    clearDraftUploads();
    if (analysis) {
      void trackProductEvent({
        eventName: "second_check_started",
        anonymousSessionId: getAnonymousSessionId(),
        analysisId: analysis.id,
        attribution: acquisitionContext.current?.attribution,
      }).catch(logClientEventFailure);
    }
    setAnalysis(null);
    setError(null);
    setFeedbackMessage(null);
    resetFeedbackDetail();
    setAnalyzing(false);
    setRecoveringAnalysis(false);
    if (runtimeConfig?.turnstileEnabled) {
      setTurnstileToken(null);
      setTurnstileRefreshKey((current) => current + 1);
    }
  }

  return (
    <div id="checker" className="checker-tool">
      <div className="checker-header">
        <div>
          <p className="eyebrow">Pairvu AI product image checker</p>
          <h1 id="headline">Did AI change your product?</h1>
          <p className="positioning-line">Quality control for AI product photography.</p>
          <p className="lede">
            Pairvu compares a real or approved reference image with an AI-generated, edited, or candidate image. The
            AI product image checker reviews visible identity text, logo, color, quantity, components, and packaging
            shape.
          </p>
        </div>
        <div className="product-wordmark" aria-label={PRODUCT_NAME}>
          <PairvuLogo className="product-wordmark-art" />
        </div>
      </div>

      <div className="checker-grid">
          <label className="upload-field">
            <span>Original product image</span>
            <strong>Upload a real or approved image of the product.</strong>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file, "reference");
              }}
              disabled={uploadingReference || analyzing}
            />
            <div className="upload-footnote">
              {uploadingReference ? "Uploading…" : reference ? reference.fileName : "No file selected."}
            </div>
            {reference?.previewUrl ? <img className="preview" src={reference.previewUrl} alt="Reference preview" /> : null}
          </label>

          <label className="upload-field">
            <span>Image to check</span>
            <strong>Upload the generated, edited or candidate image.</strong>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file, "candidate");
              }}
              disabled={uploadingCandidate || analyzing}
            />
            <div className="upload-footnote">
              {uploadingCandidate ? "Uploading…" : candidate ? candidate.fileName : "No file selected."}
            </div>
            {candidate?.previewUrl ? <img className="preview" src={candidate.previewUrl} alt="Candidate preview" /> : null}
          </label>
      </div>

        {previewRecoveryError ? <p className="preview-warning">{previewRecoveryError}</p> : null}

        <p className="privacy-note">
          Anonymous images are kept for up to 24 hours. Signed-in images follow the retention period shown in your
          account (7 days on Free). Images are sent to OpenAI only to perform this check and are not added to our
          evaluation set. <a href="/privacy">Privacy details</a>
        </p>

        {runtimeConfig?.analysisAcceptingNewRequests === false ? (
          <div className="state-panel">
            <strong>New analyses are paused.</strong>
            <p className="muted">{runtimeConfig.analysisPauseMessage}</p>
          </div>
        ) : null}

        {runtimeConfig?.turnstileEnabled && !turnstileToken && !analyzing && !analysis ? (
          <div className="state-panel">
            <strong>Security check</strong>
            <p className="muted">
              This protects free beta checks from automated use. Complete it before starting analysis.
            </p>
            <TurnstileWidget
              siteKey={runtimeConfig.turnstileSiteKey ?? ""}
              resetKey={turnstileRefreshKey}
              onTokenChange={setTurnstileToken}
            />
          </div>
        ) : null}

        <div className="actions-row">
          <button type="button" className="primary-button" onClick={onAnalyze} disabled={!canCheck}>
            {analyzing ? "Checking product identity…" : "Check image"}
          </button>
          {analysis ? (
            <button type="button" className="secondary-button" onClick={resetForAnotherCheck}>
              Check another image
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="state-panel error-panel" role="alert">
            <strong>{error.title}</strong>
            <p>{error.message}</p>
            <p className="muted">{error.help}</p>
          </div>
        ) : null}

        {analyzing ? (
          <div className="state-panel">
            <strong>{recoveringAnalysis ? "Restoring your previous check…" : "Checking product identity…"}</strong>
            <p className="muted">
              {recoveringAnalysis
                ? "This page will show the saved result as soon as the check finishes."
                : "Branding, visible text, color, quantity, and product details are being compared."}
            </p>
          </div>
        ) : null}

        {analysis ? (
          <div className="result-stack">
            <section className="state-panel" aria-labelledby="verdict-title">
              <p className="section-label">Verdict</p>
              <h2 id="verdict-title">{verdictLabel}</h2>
            </section>

            <section className="state-panel" aria-labelledby="differences-title">
              <p className="section-label">Product differences</p>
              <h2 id="differences-title">Actual detected fidelity issues</h2>
              {analysis.productIssues.length > 0 ? (
                <div className="list-stack">
                  {analysis.productIssues.map((issue) => (
                    <article key={issue.id} className="list-item">
                      <strong>
                        {formatIssueType(issue.type)} · {formatSeverity(issue.severity)} · {formatConfidence(issue.confidence)}
                      </strong>
                      <p>{issue.message}</p>
                      <p className="muted">
                        {formatCheckType(issue.sourceCheckType)}
                        {issue.sourceDifferenceKind ? ` · ${formatDifferenceKind(issue.sourceDifferenceKind)}` : ""}
                      </p>
                      <EvidenceBlock evidence={issue.evidence} />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No product issues were confirmed.</p>
              )}
            </section>

            <section className="state-panel" aria-labelledby="review-title">
              <p className="section-label">Needs review / Could not verify</p>
              <h2 id="review-title">Observability problems and analysis limitations</h2>
              {analysis.limitations.length > 0 ? (
                <div className="list-stack">
                  {analysis.limitations.map((limitation) => (
                    <article key={limitation.id} className="list-item">
                      <strong>
                        {formatLimitationType(limitation.type)} · {formatConfidence(limitation.confidence)}
                      </strong>
                      <p>{limitation.message}</p>
                      {limitation.sourceCheckType ? <p className="muted">{formatCheckType(limitation.sourceCheckType)}</p> : null}
                      <EvidenceBlock evidence={limitation.evidence} />
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No limitations were recorded.</p>
              )}
            </section>

            <section className="state-panel" aria-labelledby="verified-title">
              <p className="section-label">Verified</p>
              <h2 id="verified-title">Checks that matched cleanly</h2>
              {analysis.observations.filter(isVerifiedObservation).length > 0 ? (
                <div className="list-stack">
                  {analysis.observations
                    .filter(isVerifiedObservation)
                    .map((observation) => (
                      <article key={observation.id} className="list-item">
                        <strong>
                          {formatCheckType(observation.checkType)} · Verified · {formatConfidence(observation.confidence)}
                        </strong>
                        <p>{observation.explanation}</p>
                        <EvidenceBlock evidence={observation.evidence} />
                      </article>
                    ))}
                </div>
              ) : (
                <p className="muted">No checks were cleanly verified.</p>
              )}
            </section>

            <section className="state-panel" aria-labelledby="feedback-title">
              <p className="section-label">Feedback</p>
              <h2 id="feedback-title">Tell us whether this result was right</h2>
              <div className="feedback-row">
                {FEEDBACK_OPTIONS.map((option) => (
                  <button
                    key={option.kind}
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      if (option.kind === "correct") {
                        void submitFeedback(option.kind);
                        return;
                      }

                      setFeedbackDetailKind(option.kind);
                      setFeedbackReason("");
                      setFeedbackIssueId("");
                      setFeedbackComment("");
                      setFeedbackMessage(null);
                    }}
                    disabled={feedbackKind !== null}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {feedbackDetailKind ? (
                <div className="feedback-detail">
                  {feedbackDetailKind === "false_alarm" ? (
                    <label>
                      <span>Which detected issue was wrong?</span>
                      <select
                        value={feedbackIssueId}
                        onChange={(event) => setFeedbackIssueId(event.target.value)}
                        disabled={feedbackKind !== null}
                      >
                        <option value="">Select one</option>
                        {analysis.productIssues.map((issue) => (
                          <option key={issue.id} value={issue.id}>
                            {feedbackIssueLabel(issue)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label>
                    <span>{feedbackDetailKind === "false_alarm" ? "What was wrong?" : "What did it miss?"}</span>
                    <select
                      value={feedbackReason}
                      onChange={(event) => setFeedbackReason(event.target.value)}
                      disabled={feedbackKind !== null}
                    >
                      <option value="">Select one</option>
                      {(feedbackDetailKind === "false_alarm" ? FALSE_ALARM_REASONS : MISSED_FAMILIES).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Optional note</span>
                    <textarea
                      value={feedbackComment}
                      onChange={(event) => setFeedbackComment(event.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Add a short note if it helps."
                      disabled={feedbackKind !== null}
                    />
                  </label>
                  <div className="feedback-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        void submitFeedback(feedbackDetailKind, {
                          reason: feedbackReason || undefined,
                          checkFamily: feedbackDetailKind === "missed_something" ? feedbackReason || undefined : undefined,
                          issueId: feedbackDetailKind === "false_alarm" ? feedbackIssueId || undefined : undefined,
                          comment: feedbackComment || undefined,
                        })
                      }
                      disabled={feedbackKind !== null || !feedbackReason || (feedbackDetailKind === "false_alarm" && !feedbackIssueId)}
                    >
                      Submit feedback
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetFeedbackDetail}
                      disabled={feedbackKind !== null}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              {feedbackMessage ? <p className="muted">{feedbackMessage}</p> : null}
            </section>
          </div>
        ) : null}
    </div>
  );
}

function getAnonymousSessionId() {
  const storageKey = "visualqa.anonymousSessionId";
  const existing = window.localStorage.getItem(storageKey);
  const next = existing ?? crypto.randomUUID();

  if (!existing) {
    window.localStorage.setItem(storageKey, next);
  }

  return next;
}

function saveActiveAnalysisRequest(request: ActiveAnalysisRequest) {
  window.localStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, JSON.stringify(request));
}

function saveCompletedAnalysisRequest(request: ActiveAnalysisRequest, analysis: PersistedAnalysisResult) {
  const completedAt = analysis.completedAt ?? new Date().toISOString();
  const completedRequest: CompletedAnalysisRequest = {
    ...request,
    completedAt,
  };

  window.localStorage.setItem(COMPLETED_ANALYSIS_STORAGE_KEY, JSON.stringify(completedRequest));
}

function saveCompletedAnalysisFromExisting(analysis: PersistedAnalysisResult) {
  const current = readCompletedAnalysisRequest();
  if (!current || current.analysisId !== analysis.id) return;

  saveCompletedAnalysisRequest(current, analysis);
}

function saveDraftUpload(kind: "reference" | "candidate", upload: UploadState) {
  const current = readDraftUploads() ?? { updatedAt: new Date().toISOString() };
  const next: DraftUploads = {
    ...current,
    [kind]: {
      assetId: upload.assetId,
      fileName: upload.fileName,
    },
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(DRAFT_UPLOADS_STORAGE_KEY, JSON.stringify(next));
}

function readActiveAnalysisRequest(): ActiveAnalysisRequest | null {
  const stored = window.localStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Partial<ActiveAnalysisRequest>;
    if (
      typeof value.analysisId === "string" &&
      typeof value.idempotencyKey === "string" &&
      typeof value.referenceAssetId === "string" &&
      typeof value.candidateAssetId === "string" &&
      typeof value.referenceFileName === "string" &&
      typeof value.candidateFileName === "string" &&
      typeof value.startedAt === "string"
    ) {
      return value as ActiveAnalysisRequest;
    }
  } catch {
    // Invalid recovery state is discarded below.
  }

  window.localStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
  return null;
}

function readCompletedAnalysisRequest(): CompletedAnalysisRequest | null {
  const stored = window.localStorage.getItem(COMPLETED_ANALYSIS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Partial<CompletedAnalysisRequest>;
    if (
      typeof value.analysisId === "string" &&
      typeof value.idempotencyKey === "string" &&
      typeof value.referenceAssetId === "string" &&
      typeof value.candidateAssetId === "string" &&
      typeof value.referenceFileName === "string" &&
      typeof value.candidateFileName === "string" &&
      typeof value.startedAt === "string" &&
      typeof value.completedAt === "string"
    ) {
      const completedAtMs = Date.parse(value.completedAt);
      if (Number.isFinite(completedAtMs) && Date.now() - completedAtMs <= COMPLETED_ANALYSIS_TTL_MS) {
        return value as CompletedAnalysisRequest;
      }
    }
  } catch {
    // Invalid saved result state is discarded below.
  }

  window.localStorage.removeItem(COMPLETED_ANALYSIS_STORAGE_KEY);
  return null;
}

function readDraftUploads(): DraftUploads | null {
  const stored = window.localStorage.getItem(DRAFT_UPLOADS_STORAGE_KEY);
  if (!stored) return null;

  try {
    const value = JSON.parse(stored) as Partial<DraftUploads>;
    const hasReference =
      value.reference &&
      typeof value.reference.assetId === "string" &&
      typeof value.reference.fileName === "string";
    const hasCandidate =
      value.candidate &&
      typeof value.candidate.assetId === "string" &&
      typeof value.candidate.fileName === "string";

    if ((hasReference || hasCandidate) && typeof value.updatedAt === "string") {
      const updatedAtMs = Date.parse(value.updatedAt);
      if (Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs <= COMPLETED_ANALYSIS_TTL_MS) {
        return value as DraftUploads;
      }
    }
  } catch {
    // Invalid draft state is discarded below.
  }

  window.localStorage.removeItem(DRAFT_UPLOADS_STORAGE_KEY);
  return null;
}

function clearActiveAnalysisRequest(expectedAnalysisId?: string) {
  if (expectedAnalysisId) {
    const active = readActiveAnalysisRequest();
    if (active && active.analysisId !== expectedAnalysisId) return;
  }

  window.localStorage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
}

function clearCompletedAnalysisRequest() {
  window.localStorage.removeItem(COMPLETED_ANALYSIS_STORAGE_KEY);
}

function clearDraftUploads() {
  window.localStorage.removeItem(DRAFT_UPLOADS_STORAGE_KEY);
}

function waitForRecoveryPoll() {
  return new Promise((resolve) => window.setTimeout(resolve, RECOVERY_POLL_INTERVAL_MS));
}

function formatApiError(payload: ApiError, fallbackTitle: string): UiError {
  const retry = formatRetryAfter(payload.retryAfterSeconds);

  switch (payload.error) {
    case "analysis_turnstile_required":
    case "analysis_turnstile_failed":
    case "upload_turnstile_failed":
      return {
        title: "Security check needed.",
        message: "Please complete the security check before starting analysis.",
        help: "If the check is not visible, refresh the page or disable browser extensions that block security scripts.",
      };
    case "analysis_session_rate_limited":
      return {
        title: "Free check limit reached.",
        message: retry
          ? `This browser has used its free analysis checks for now. You can try again in about ${retry}.`
          : "This browser has used its free analysis checks for today.",
        help: "Sign in to use your account allowance, or try again when the anonymous limit resets.",
      };
    case "workspace_quota_exceeded":
      return {
        title: "Monthly checks used.",
        message: "This workspace has no checks remaining in the current billing period.",
        help: "Open Account to review your allowance or upgrade to a paid monthly plan.",
      };
    case "workspace_billing_inactive":
      return {
        title: "Billing needs attention.",
        message: "This workspace's paid subscription is not currently active.",
        help: "Open Account, then Manage billing to update the payment method or subscription.",
      };
    case "analysis_global_rate_limited":
    case "analysis_global_budget_limited":
      return {
        title: "Pairvu is at today’s beta limit.",
        message: retry ? `Public beta capacity is full. Please try again in about ${retry}.` : "Public beta capacity is full.",
        help: "This protects service quality and OpenAI cost while the MVP is being validated.",
      };
    case "analysis_session_concurrency_limited":
      return {
        title: "A check is already running.",
        message: "This browser already has one product check in progress.",
        help: "Wait a moment, then refresh. Pairvu will try to restore the running check.",
      };
    case "analysis_global_concurrency_limited":
      return {
        title: "Pairvu is busy.",
        message: "Several checks are already running at the same time.",
        help: retry ? `Please retry in about ${retry}.` : "Please retry in a moment.",
      };
    case "analysis_session_budget_limited":
      return {
        title: "Free beta usage limit reached.",
        message: "This browser has reached today’s free analysis usage.",
        help: "Try again tomorrow, or sign in to use your monthly account allowance.",
      };
    case "upload_session_rate_limited":
      return {
        title: "Upload limit reached.",
        message: retry
          ? `This browser has used its upload limit for now. You can try again in about ${retry}.`
          : "This browser has used its upload limit for today.",
        help: "Use smaller test batches during the beta, or try again later.",
      };
    case "asset_deleted":
      return {
        title: "Uploaded image expired.",
        message: "One of the uploaded images is no longer available.",
        help: "Images are kept for up to 24 hours. Upload both images again to run a new check.",
      };
    case "analysis_not_found":
      return {
        title: "Sign in to restore this result.",
        message: "This result belongs to a workspace that is not available in the current session.",
        help: "Sign in with the account that created the check, then open it again from Account > Recent checks.",
      };
    case "file_too_large":
    case "image_decode_failed":
    case "unsupported_mime_type":
      return {
        title: "Image could not be uploaded.",
        message: payload.message ?? "The image file is not supported.",
        help: "Use a clear JPG, PNG, or WebP image and try again.",
      };
    case "analysis_execution_failed":
      if (payload.message?.includes("Network connection lost")) {
        return {
          title: "Connection interrupted during analysis.",
          message: "The image provider connection ended before Pairvu received a result.",
          help: "This failed check was not charged. Select Check image to try the same pair again.",
        };
      }
      return {
        title: fallbackTitle,
        message: payload.message ?? "The analysis could not be completed.",
        help: "Try the same pair again. If it repeats, wait a moment before retrying.",
      };
    default:
      return {
        title: fallbackTitle,
        message: payload.message ?? payload.error ?? "Something went wrong.",
        help: "Refresh the page and try again. If it repeats, use a new pair of images.",
      };
  }
}

function formatThrownError(error: unknown, fallbackTitle: string): UiError {
  const message = error instanceof Error ? error.message : "";

  if (message === "Failed to fetch" || message.includes("NetworkError")) {
    return {
      title: "Connection interrupted.",
      message: "Pairvu could not reach the server.",
      help: "Check your connection, refresh the page, and try again.",
    };
  }

  return {
    title: fallbackTitle,
    message: message || "Something went wrong.",
    help: "Refresh the page and try again. If it repeats, use a new pair of images.",
  };
}

function formatRetryAfter(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 90) return `${Math.ceil(seconds)} seconds`;

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;

  const hours = Math.ceil(minutes / 60);
  return `${hours} hours`;
}

function normalizeAssetPreviewErrorCode(value: string | undefined): AssetPreviewErrorCode {
  switch (value) {
    case "asset_deleted":
    case "asset_expired":
    case "asset_binary_missing":
    case "asset_unavailable":
    case "asset_not_found":
      return value;
    default:
      return "unknown";
  }
}

function feedbackIssueLabel(issue: PersistedAnalysisResult["productIssues"][number]) {
  return `${formatCheckType(issue.sourceCheckType)}: ${issue.message}`;
}

function EvidenceBlock({
  evidence,
}: {
  evidence: {
    referenceObservation?: string;
    candidateObservation?: string;
    differenceKind?: string;
    comparisonSummary?: string;
    visibleEvidence?: string[];
    uncertainReason?: string;
    referenceVisible?: boolean;
    candidateVisible?: boolean;
  };
}) {
  return (
    <dl className="evidence-grid">
      <div>
        <dt>Original image</dt>
        <dd>{evidence.referenceObservation ?? "—"}</dd>
      </div>
      <div>
        <dt>Image to check</dt>
        <dd>{evidence.candidateObservation ?? "—"}</dd>
      </div>
      <div>
        <dt>What changed</dt>
        <dd>{evidence.differenceKind ? formatDifferenceKind(evidence.differenceKind) : "—"}</dd>
      </div>
      <div>
        <dt>Summary</dt>
        <dd>{evidence.comparisonSummary ?? "—"}</dd>
      </div>
      <div>
        <dt>Original visible</dt>
        <dd>{formatOptionalBoolean(evidence.referenceVisible)}</dd>
      </div>
      <div>
        <dt>Candidate visible</dt>
        <dd>{formatOptionalBoolean(evidence.candidateVisible)}</dd>
      </div>
      <div className="wide">
        <dt>Visible evidence</dt>
        <dd>{evidence.visibleEvidence?.length ? evidence.visibleEvidence.join(", ") : "—"}</dd>
      </div>
      <div className="wide">
        <dt>Why uncertain</dt>
        <dd>{evidence.uncertainReason ?? "—"}</dd>
      </div>
    </dl>
  );
}

function isVerifiedObservation(observation: PersistedAnalysisResult["observations"][number]) {
  return (
    observation.status === "match" &&
    observation.observability.reference === "observable" &&
    observation.observability.candidate === "observable" &&
    observation.observability.coverage === "sufficient"
  );
}

function formatOptionalBoolean(value: boolean | undefined) {
  if (value === undefined) return "—";
  return value ? "Yes" : "No";
}

function formatCheckType(value: string) {
  const labels: Record<string, string> = {
    logo: "Logo",
    visible_text: "Visible text",
    quantity: "Product count",
    dominant_color: "Main color",
    major_components: "Major components",
    major_shape_packaging: "Shape and packaging",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function formatIssueType(value: string) {
  const labels: Record<string, string> = {
    logo_mismatch: "Logo changed",
    text_mismatch: "Text changed",
    quantity_mismatch: "Product count changed",
    color_mismatch: "Color changed",
    major_shape_mismatch: "Shape changed",
    missing_component: "Missing component",
    extra_component: "Extra component",
    packaging_mismatch: "Packaging changed",
    variant_mismatch: "Variant changed",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function formatLimitationType(value: string) {
  const labels: Record<string, string> = {
    reference_insufficient: "Original image is insufficient",
    candidate_insufficient: "Candidate image is insufficient",
    reference_conflict: "Original image is inconsistent",
    attribute_not_observable: "Not visible enough",
    coverage_insufficient: "Not enough coverage",
    uncertain_observation: "Uncertain observation",
    missing_requested_check: "Could not run a check",
    provider_output_invalid: "Analysis output issue",
    unknown: "Uncertain limitation",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function formatDifferenceKind(value: string) {
  const labels: Record<string, string> = {
    none: "No meaningful change",
    brand_changed: "Brand changed",
    text_changed: "Text changed",
    value_changed: "Printed value changed",
    count_changed: "Product count changed",
    color_changed: "Color changed",
    component_missing: "Component missing",
    component_extra: "Extra component",
    shape_changed: "Shape changed",
    unreadable: "Unreadable",
    not_visible: "Not visible",
    uncertain: "Uncertain",
    unknown: "Unknown",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function formatSeverity(value: string) {
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High impact",
    medium: "Medium impact",
    low: "Low impact",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function formatConfidence(value: string) {
  const labels: Record<string, string> = {
    high: "High confidence",
    medium: "Medium confidence",
    low: "Low confidence",
  };

  return labels[value] ?? humanizeIdentifier(value);
}

function humanizeIdentifier(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function logClientEventFailure(error: unknown) {
  console.warn("product_event_failed", error);
}
