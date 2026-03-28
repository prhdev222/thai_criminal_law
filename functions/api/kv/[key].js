import { createClient } from "@libsql/client";

const ALLOWED_KEYS = new Set(["v2", "n2", "nn2"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function getClient(env) {
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

export async function onRequestGet(context) {
  const key = context.params.key;
  if (!ALLOWED_KEYS.has(key)) return json({ error: "invalid key" }, 404);

  const client = getClient(context.env);
  if (!client) return json({ error: "database not configured" }, 503);

  try {
    const rs = await client.execute({
      sql: "SELECT value FROM app_kv WHERE key = ?",
      args: [key],
    });
    if (!rs.rows.length) return new Response("null", { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
    const raw = rs.rows[0].value;
    if (raw == null || raw === "")
      return new Response("null", { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } });
    return new Response(typeof raw === "string" ? raw : String(raw), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (e) {
    console.error("Turso GET", key, e);
    return json({ error: "query failed" }, 500);
  }
}

export async function onRequestPut(context) {
  const key = context.params.key;
  if (!ALLOWED_KEYS.has(key)) return json({ error: "invalid key" }, 404);

  const client = getClient(context.env);
  if (!client) return json({ error: "database not configured" }, 503);

  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const value = JSON.stringify(payload);
  try {
    await client.execute({
      sql: `INSERT INTO app_kv (key, value, updated_at) VALUES (?, ?, unixepoch())
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
      args: [key, value],
    });
    return json({ ok: true });
  } catch (e) {
    console.error("Turso PUT", key, e);
    return json({ error: "write failed" }, 500);
  }
}
