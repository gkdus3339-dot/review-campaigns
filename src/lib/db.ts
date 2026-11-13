import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

// Next dev can evaluate this module once per route bundle; keep one in-memory
// PGlite per process so every route sees the same local data.
const store = globalThis as typeof globalThis & {
  __campaignPool?: pg.Pool;
  __campaignLocal?: Promise<PGlite>;
};

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    store.__campaignPool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await store.__campaignPool.query(text, params)).rows as T[];
  }
  store.__campaignLocal ??= startLocal().catch((error: unknown) => {
    store.__campaignLocal = undefined;
    throw error;
  });
  return (await (await store.__campaignLocal).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
