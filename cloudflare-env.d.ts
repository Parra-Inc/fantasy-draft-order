// Bindings and vars declared in wrangler.jsonc, typed structurally so the app
// compiles without pulling @cloudflare/workers-types into the Next.js type
// graph. `getCloudflareContext()` from @opennextjs/cloudflare picks this
// interface up by name.

interface CloudflareFetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

/**
 * D1 (SQLite). Only the surface @prisma/adapter-d1 actually calls is declared;
 * the adapter takes this object and does the rest. Statement/result shapes are
 * intentionally loose — Prisma owns them, this app never touches D1 directly.
 */
interface CloudflareD1PreparedStatement {
  bind(...values: unknown[]): CloudflareD1PreparedStatement;
  all<T = unknown>(): Promise<{ results: T[]; meta: Record<string, unknown> }>;
  run(): Promise<{ meta: Record<string, unknown> }>;
  raw<T = unknown>(options?: { columnNames?: boolean }): Promise<T[]>;
  first<T = unknown>(column?: string): Promise<T | null>;
}

interface CloudflareD1Database {
  prepare(query: string): CloudflareD1PreparedStatement;
  batch<T = unknown>(
    statements: CloudflareD1PreparedStatement[]
  ): Promise<{ results: T[]; meta: Record<string, unknown> }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

/**
 * Durable Object namespace. Same approach as D1 above: only the two calls the
 * presence route makes are declared, and the id is opaque, so this app never
 * needs @cloudflare/workers-types in the Next type graph.
 */
interface CloudflareDurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): CloudflareFetcher;
}

declare interface CloudflareEnv {
  ASSETS: CloudflareFetcher;
  WORKER_SELF_REFERENCE: CloudflareFetcher;
  DB: CloudflareD1Database;
  // Absent when running off Workers, which is why every caller treats a
  // missing namespace as "no presence available" rather than an error.
  DRAFT_PRESENCE?: CloudflareDurableObjectNamespace;

  // Vars from wrangler.jsonc. This app has no secrets: the database is a
  // binding, so there is no DATABASE_URL to keep anywhere.
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_COMMIT_SHA?: string;
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
  DRAFT_FIRST_PICK_DELAY_MS?: string;
  DRAFT_PICK_INTERVAL_MS?: string;
}
