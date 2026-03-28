-- รันครั้งเดียว: turso db shell <ชื่อ-db> < turso/schema.sql
CREATE TABLE IF NOT EXISTS app_kv (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
