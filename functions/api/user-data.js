import { createTursoClient } from "../../lib/tursoClient.js";

const KEYS = ["v2", "n2", "nn2", "m2"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function parseStoredValue(raw) {
  if (raw == null || raw === "") return null;
  const s = typeof raw === "string" ? raw : String(raw);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** GET ครั้งเดียว — คืน { v2, n2, nn2, m2 } ลด race / connection จาก Promise.all 4 ทาง */
export async function onRequestGet(context) {
  const { client, missing } = createTursoClient(context.env);
  if (!client)
    return json(
      {
        error: "database not configured",
        missing,
        hint: "Cloudflare Pages → Settings → Variables and Secrets → Production: Secret TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Preview ด้วยถ้าใช้ branch preview)",
      },
      503
    );

  const out = { v2: null, n2: null, nn2: null, m2: null };

  try {
    for (const key of KEYS) {
      const rs = await client.execute({
        sql: "SELECT value FROM app_kv WHERE key = ?",
        args: [key],
      });
      if (!rs.rows.length) continue;
      const raw = rs.rows[0].value ?? rs.rows[0][0];
      out[key] = parseStoredValue(raw);
    }
    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    console.error("user-data GET", e);
    return json({ error: "query failed" }, 500);
  }
}
