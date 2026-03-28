import { createTursoClient } from "../../lib/tursoClient.js";

const ALLOWED_KEYS = new Set(["v2", "n2", "nn2", "m2"]);

function tursoEnv() {
  return {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  };
}

export default async function handler(req, res) {
  const rawKey = req.query.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!key || !ALLOWED_KEYS.has(key)) {
    res.status(404).json({ error: "invalid key" });
    return;
  }

  const { client, missing } = createTursoClient(tursoEnv());
  if (!client) {
    res.status(503).json({ error: "database not configured", missing });
    return;
  }

  if (req.method === "GET") {
    try {
      const rs = await client.execute({
        sql: "SELECT value FROM app_kv WHERE key = ?",
        args: [key],
      });
      if (!rs.rows.length) {
        res.status(200).setHeader("Content-Type", "application/json; charset=utf-8").send("null");
        return;
      }
      const rowVal = rs.rows[0].value;
      if (rowVal == null || rowVal === "") {
        res.status(200).setHeader("Content-Type", "application/json; charset=utf-8").send("null");
        return;
      }
      const body = typeof rowVal === "string" ? rowVal : String(rowVal);
      res.status(200).setHeader("Content-Type", "application/json; charset=utf-8").send(body);
    } catch (e) {
      console.error("Turso GET", key, e);
      res.status(500).json({ error: "query failed" });
    }
    return;
  }

  if (req.method === "PUT") {
    let payload = req.body;
    if (payload == null || payload === "") {
      res.status(400).json({ error: "invalid json" });
      return;
    }
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch {
        res.status(400).json({ error: "invalid json" });
        return;
      }
    }

    const value = JSON.stringify(payload);
    try {
      await client.execute({
        sql: `INSERT INTO app_kv (key, value, updated_at) VALUES (?, ?, unixepoch())
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
        args: [key, value],
      });
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Turso PUT", key, e);
      res.status(500).json({ error: "write failed" });
    }
    return;
  }

  res.status(405).setHeader("Allow", "GET, PUT").end();
}
