import { createTursoClient } from "../lib/tursoClient.js";

const KEYS = ["v2", "n2", "nn2", "m2"];

function parseStoredValue(raw) {
  if (raw == null || raw === "") return null;
  const s = typeof raw === "string" ? raw : String(raw);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function tursoEnv() {
  return {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).setHeader("Allow", "GET").end();
    return;
  }

  const { client, missing } = createTursoClient(tursoEnv());
  if (!client) {
    res.status(503).json({
      error: "database not configured",
      missing,
      hint: "Vercel → Project → Settings → Environment Variables: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (ครบทุก environment ที่ deploy)",
    });
    return;
  }

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
    res.status(200).setHeader("Content-Type", "application/json; charset=utf-8").send(JSON.stringify(out));
  } catch (e) {
    console.error("user-data GET", e);
    res.status(500).json({ error: "query failed" });
  }
}
