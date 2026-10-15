import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { playable, resolveTranslation } from "../server/catalog.mjs";
test("experimental study has a self-contained animated GLB and cannot pass the translation gate", () => {
  const manifest = JSON.parse(
    readFileSync("public/animations/oi-experimental.json", "utf8"),
  );
  assert.equal(manifest.status, "experimental");
  assert.equal(manifest.review, null);
  assert.ok(!playable(manifest));
  assert.equal(resolveTranslation("Oi").status, "unavailable");
  const file = readFileSync("public" + manifest.asset.url);
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(4), 2);
  assert.equal(file.readUInt32LE(8), file.length);
  const json = JSON.parse(
    file.subarray(20, 20 + file.readUInt32LE(12)).toString(),
  );
  assert.equal(json.animations[0].name, manifest.asset.clip);
  assert.ok(json.nodes.some((node) => node.name === "RightLittleJoint2"));
  assert.ok(json.nodes.some((node) => node.name === "RightThumbJoint"));
  assert.ok(json.animations[0].channels.length > 60);
  assert.ok(json.buffers.every((buffer) => !buffer.uri));
  assert.ok(!json.images);
  const timeAccessor = json.accessors[json.animations[0].samplers[0].input];
  assert.ok(Math.abs(timeAccessor.max[0] - manifest.asset.duration) < 0.001);
  assert.ok(
    manifest.asset.captions.every(
      (c) =>
        c.start >= 0 && c.end > c.start && c.end <= manifest.asset.duration,
    ),
  );
});
