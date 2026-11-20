import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { snapshotHashes, snapshotFarms, SNAPSHOT_FILE } from "../tools/snapshots.mjs";

const expected = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8"));
const actual = snapshotHashes();

test("the snapshot farms are rendered the same way twice", () => {
  assert.deepEqual(snapshotHashes(), actual);
  assert.ok(snapshotFarms().length >= 17);
});

test("every farm still looks exactly like its snapshot", () => {
  const changed = Object.keys(actual).filter((name) => expected[name] !== actual[name]);
  assert.deepEqual(
    changed,
    [],
    `These farms changed: ${changed.join(", ")}.\n` +
    "If that is what you meant, run `npm run snapshots` and commit test/snapshots.json.\n" +
    "To see the difference, run `node tools/snapshots.mjs --out snapshots` and open the SVGs (CI uploads them as an artifact).",
  );
});

test("the snapshot file has no stale entries", () => {
  assert.deepEqual(Object.keys(expected).sort(), Object.keys(actual).sort());
});
