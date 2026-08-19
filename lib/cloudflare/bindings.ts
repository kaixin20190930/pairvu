import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
}

export interface R2ObjectBody extends R2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

export interface R2Bucket {
  put(key: string, value: ArrayBuffer | Blob | string, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(keys: string | string[]): Promise<void>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; error?: string; meta?: Record<string, unknown> }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean; error?: string; meta?: Record<string, unknown> }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

export interface QueueSendOptions {
  delaySeconds?: number;
  contentType?: "json" | "text" | "bytes" | "v8";
}

export interface Queue<T = unknown> {
  send(message: T, options?: QueueSendOptions): Promise<void>;
  sendBatch(messages: Array<{ body: T; contentType?: "json" | "text" | "bytes" | "v8"; delaySeconds?: number }>): Promise<void>;
}

export interface QueueMessage<T = unknown> {
  id: string;
  timestamp: Date;
  body: T;
  attempts: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export interface QueueMessageBatch<T = unknown> {
  queue: string;
  messages: QueueMessage<T>[];
  ackAll(): void;
  retryAll(options?: { delaySeconds?: number }): void;
}

export interface VisualQACloudflareEnv {
  VISUALQA_ASSETS: R2Bucket;
  VISUALQA_DB: D1Database;
  BATCH_ANALYSIS_QUEUE: Queue;
  BATCH_PRIORITY_ANALYSIS_QUEUE: Queue;
  ANONYMOUS_ASSET_RETENTION_HOURS?: string;
  NEXTJS_ENV?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_PROMPT_VERSION?: string;
  OPENAI_REQUEST_TIMEOUT_MS?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  PUBLIC_ANALYSIS_ACCEPTING_NEW_REQUESTS?: string;
  PUBLIC_ANALYSIS_PAUSE_MESSAGE?: string;
  PUBLIC_ANALYSIS_SESSION_MINUTE_LIMIT?: string;
  PUBLIC_ANALYSIS_SESSION_DAILY_LIMIT?: string;
  PUBLIC_ANALYSIS_GLOBAL_DAILY_LIMIT?: string;
  PUBLIC_ANALYSIS_SESSION_CONCURRENT_LIMIT?: string;
  PUBLIC_ANALYSIS_GLOBAL_CONCURRENT_LIMIT?: string;
  PUBLIC_ANALYSIS_SESSION_DAILY_SPEND_LIMIT_USD?: string;
  PUBLIC_ANALYSIS_GLOBAL_DAILY_SPEND_LIMIT_USD?: string;
  PUBLIC_UPLOAD_SESSION_MINUTE_LIMIT?: string;
  PUBLIC_UPLOAD_SESSION_DAILY_LIMIT?: string;
  PUBLIC_VALIDATE_UPLOADS_WITH_TURNSTILE?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  AUTH_TRUSTED_ORIGINS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_STARTER?: string;
  STRIPE_PRICE_GROWTH?: string;
  STRIPE_PRICE_AGENCY?: string;
  STRIPE_PRICE_PACK_50?: string;
  STRIPE_PRICE_PACK_200?: string;
  STRIPE_PRICE_PACK_500?: string;
}

export function getVisualQAEnv(): VisualQACloudflareEnv {
  return getCloudflareContext().env as VisualQACloudflareEnv;
}
