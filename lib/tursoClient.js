/* ใช้ /web = SQL ผ่าน HTTP (fetch) — แนะนำบน Vercel Serverless/Edge และใช้กับ Cloudflare Workers ได้
 * แพ็กเกจหลัก @libsql/client ฝั่ง Node อาจพึ่ง native แล้วล้มเงียบๆ บน Vercel → ดูเหมือน «ต่อ Turso ได้» แต่ API ไม่เขียนจริง */
import { createClient } from "@libsql/client/web";

/**
 * @param {Record<string, unknown>} env
 * @returns {{ client: ReturnType<typeof createClient> | null, missing: string[] }}
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
