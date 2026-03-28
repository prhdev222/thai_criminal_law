import { createClient } from "@libsql/client";

/**
 * @param {Record<string, unknown>} env
 * @returns {{ client: import("@libsql/client").Client | null, missing: string[] }}
 */
export function createTursoClient(env) {
  const url = String(env?.TURSO_DATABASE_URL ?? "").trim();
  const authToken = String(env?.TURSO_AUTH_TOKEN ?? "").trim();
  const missing = [];
  if (!url) missing.push("TURSO_DATABASE_URL");
  if (!authToken) missing.push("TURSO_AUTH_TOKEN");
  if (missing.length) return { client: null, missing };
  return { client: createClient({ url, authToken }), missing: [] };
}
