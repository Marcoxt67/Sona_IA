import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function createStore(filename) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    `PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS translations (id INTEGER PRIMARY KEY AUTOINCREMENT, session TEXT NOT NULL, text TEXT NOT NULL, status TEXT NOT NULL, entry_id TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))); CREATE INDEX IF NOT EXISTS translations_session ON translations(session);`,
  );
  return {
    add(session, text, result) {
      const row = db
        .prepare(
          "INSERT INTO translations(session,text,status,entry_id) VALUES (?,?,?,?) RETURNING id,text,status,entry_id AS entryId,created_at AS createdAt",
        )
        .get(session, text, result.status, result.entryId);
      db.prepare(
        "DELETE FROM translations WHERE session = ? AND id NOT IN (SELECT id FROM translations WHERE session = ? ORDER BY id DESC LIMIT 50)",
      ).run(session, session);
      return row;
    },
    list: (session) =>
      db
        .prepare(
          "SELECT id,text,status,entry_id AS entryId,created_at AS createdAt FROM translations WHERE session = ? ORDER BY id DESC LIMIT 50",
        )
        .all(session),
    clear: (session) =>
      db.prepare("DELETE FROM translations WHERE session = ?").run(session),
    close: () => db.close(),
  };
}
