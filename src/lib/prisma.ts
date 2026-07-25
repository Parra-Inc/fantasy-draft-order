import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { cfCtx, cfEnv } from "@/lib/cloudflare/context";

/**
 * Prisma over Cloudflare D1.
 *
 * The database is a binding, not a connection string, so there is nothing to
 * construct until a request is in flight: getCloudflareContext() throws at
 * module scope. Hence the Proxy below, which builds the client on first
 * property access and caches it on the request-scoped Cloudflare `ctx`.
 *
 * `next dev` gets the same binding through initOpenNextCloudflareForDev()
 * (miniflare), backed by the SQLite file under .wrangler/state — the same file
 * `wrangler d1 migrations apply --local` writes to.
 *
 * Node-side tooling that has no binding at all (prisma/seed.ts) builds its own
 * client against that file with @prisma/adapter-better-sqlite3 rather than
 * importing this module. Every route that touches the database is
 * force-dynamic, so `next build` never reaches this code either.
 */

type PrismaCache = { __prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const db = cfEnv()?.DB;
  if (!db) {
    throw new Error(
      "No D1 binding available. On Workers this means the DB binding is " +
        "missing from wrangler.jsonc; locally it means next.config.ts did " +
        "not run initOpenNextCloudflareForDev().",
    );
  }
  // cloudflare-env.d.ts declares only the D1 surface the adapter actually
  // uses, so it is not nominally the workers-types D1Database in the
  // adapter's signature. Deliberate: pulling @cloudflare/workers-types into
  // the Next type graph breaks the app build.
  const adapter = new PrismaD1(
    db as unknown as ConstructorParameters<typeof PrismaD1>[0],
  );
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  const ctx = cfCtx() as PrismaCache | undefined;
  if (!ctx) return createPrismaClient();
  if (!ctx.__prisma) ctx.__prisma = createPrismaClient();
  return ctx.__prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
