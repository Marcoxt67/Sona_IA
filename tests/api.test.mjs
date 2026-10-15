import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.mjs";
import { createStore } from "../server/db.mjs";
import {
  catalog,
  normalize,
  playable,
  resolveTranslation,
} from "../server/catalog.mjs";

test("normalizes complete phrases without composing signs", () => {
  assert.equal(normalize("  BOM   DIA! "), "bom dia");
  assert.equal(resolveTranslation("Bom dia").status, "unavailable");
  assert.equal(resolveTranslation("Bom dia, preciso de ajuda").entryId, null);
  assert.ok(catalog.every((e) => !playable(e)));
});
test("requires source, both reviewers, matching asset version and valid timed captions", () => {
  // Metadata fixture only: no fictitious signing asset is shipped to users.
  const fixture = {
    id: "fixture",
    portuguese: "Frase de teste",
    status: "validated",
    source: "https://example.org/documentation",
    review: {
      deafReviewer: "fixture-d",
      specialist: "fixture-s",
      date: "2026-10-15",
      assetVersion: "1",
    },
    asset: {
      kind: "gltf",
      url: "/animations/fixture.glb",
      version: "1",
      clip: "phrase",
      duration: 2,
      captions: [{ start: 0, end: 2, text: "Frase de teste" }],
    },
  };
  assert.equal(
    resolveTranslation("FRASE DE TESTE!", [fixture]).status,
    "available",
  );
  for (const invalid of [
    { ...fixture, source: null },
    { ...fixture, status: "pending" },
    { ...fixture, review: { ...fixture.review, deafReviewer: null } },
    { ...fixture, review: { ...fixture.review, assetVersion: "2" } },
    {
      ...fixture,
      asset: { ...fixture.asset, url: "https://example.org/unsafe.glb" },
    },
    {
      ...fixture,
      asset: {
        ...fixture.asset,
        captions: [{ start: 2, end: 1, text: "bad" }],
      },
    },
  ])
    assert.equal(
      resolveTranslation(fixture.portuguese, [invalid]).status,
      "unavailable",
    );
});
test("HTTP translation, input validation, session isolation and deletion", async (t) => {
  const store = createStore(":memory:");
  const server = createApp(store).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    store.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Icaro-Session": "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  };
  const call = (route, options = {}) =>
    fetch(base + route, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
  assert.equal((await (await call("/api/health")).json()).ok, true);
  const library = await (await call("/api/library")).json();
  assert.equal(library.length, 6);
  assert.ok(library.every((e) => e.playable === false));
  assert.equal((await fetch(base + "/api/history")).status, 400);
  for (const text of ["", "  ", "a".repeat(501), 4, null])
    assert.equal(
      (
        await call("/api/translate", {
          method: "POST",
          body: JSON.stringify({ text }),
        })
      ).status,
      400,
    );
  const translated = await (
    await call("/api/translate", {
      method: "POST",
      body: JSON.stringify({ text: "Bom dia" }),
    })
  ).json();
  assert.equal(translated.status, "unavailable");
  assert.equal(translated.asset, undefined);
  assert.equal(translated.history.text, "Bom dia");
  assert.equal((await (await call("/api/history")).json()).length, 1);
  assert.equal(
    (
      await (
        await call("/api/history", {
          headers: {
            "X-Icaro-Session": "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
          },
        })
      ).json()
    ).length,
    0,
  );
  const injection = "'); DROP TABLE translations; --";
  assert.equal(
    (
      await call("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text: injection }),
      })
    ).status,
    200,
  );
  assert.equal((await (await call("/api/history")).json())[0].text, injection);
  assert.equal((await call("/api/history", { method: "DELETE" })).status, 204);
  assert.deepEqual(await (await call("/api/history")).json(), []);
});
test("SQLite persists between restarts and retains only latest 50 entries per browser", () => {
  const dir = mkdtempSync(join(tmpdir(), "icaro-test-"));
  const filename = join(dir, "test.sqlite");
  try {
    let store = createStore(filename);
    for (let i = 0; i < 55; i++)
      store.add("session-a", `Message ${i}`, {
        status: "unavailable",
        entryId: null,
      });
    store.add("session-b", "Separate", {
      status: "unavailable",
      entryId: null,
    });
    store.close();
    store = createStore(filename);
    assert.equal(store.list("session-a").length, 50);
    assert.equal(store.list("session-a")[0].text, "Message 54");
    assert.equal(store.list("session-b").length, 1);
    store.clear("session-a");
    assert.equal(store.list("session-b").length, 1);
    store.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("startup reports an occupied port with a failing exit status", async (t) => {
  const { spawn } = await import("node:child_process");
  const { createServer } = await import("node:http");
  const occupied = createServer((_req, res) => res.end("occupied")).listen(
    0,
    "0.0.0.0",
  );
  await new Promise((resolve) => occupied.once("listening", resolve));
  t.after(() => new Promise((resolve) => occupied.close(resolve)));
  const child = spawn(process.execPath, ["server/index.mjs"], {
    env: {
      ...process.env,
      PORT: String(occupied.address().port),
      DATABASE_PATH: ":memory:",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (data) => (stderr += data));
  const exit = await new Promise((resolve) => child.once("close", resolve));
  assert.equal(exit, 1);
  assert.match(stderr, /EADDRINUSE/);
});
