#!/usr/bin/env node
// Visual regression for the pixel art: renders a fixed set of farms and compares their hashes
// with test/snapshots.json. `npm test` fails when a render changes without updating the file.
//
//   npm run snapshots                      # update the hashes after an intended visual change
//   node tools/snapshots.mjs --out dir     # write the SVGs so you can open them and see the change
//
// Every farm uses a fixed date and demo data, so the output is the same on every machine.

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { renderFarm } from "../src/render.js";
import { demoCalendar } from "../src/demo.js";

export const SNAPSHOT_FILE = new URL("../test/snapshots.json", import.meta.url);
const DATE = new Date("2026-10-27T12:00:00Z");
const SEASONS = ["none", "spring", "summer", "autumn", "winter", "rainy", "dry"];

/** The farms we keep an eye on: every season by day and night, plus the newest crops and hats. */
export function snapshotFarms() {
  const { total, weeks } = demoCalendar(7, DATE);
  const base = { user: "octocat", total, weeks, crops: [{ crop: "corn", share: 0.4 }, { crop: "sunflower", share: 0.3 }, { crop: "tomato", share: 0.3 }], streak: 200, date: DATE };
  const farms = [];
  for (const season of SEASONS) {
    for (const time of ["day", "night"]) farms.push([`${season}-${time}`, { ...base, season, time }]);
  }
  const newCrops = [{ crop: "potato", share: 0.25 }, { crop: "watermelon", share: 0.25 }, { crop: "chili", share: 0.25 }, { crop: "grape", share: 0.25 }];
  farms.push(["new-crops", { ...base, crops: newCrops, season: "summer", time: "day" }]);
  farms.push(["cap", { ...base, farmer: { hatStyle: "cap" }, time: "day" }]);
  farms.push(["no-hat", { ...base, farmer: { hatStyle: "none" }, time: "day" }]);
  farms.push(["no-animals", { ...base, streak: 0, time: "day" }]);
  return farms.map(([name, options]) => ({ name, svg: renderFarm(options) }));
}

export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

export function snapshotHashes() {
  return Object.fromEntries(snapshotFarms().map(({ name, svg }) => [name, sha256(svg)]));
}

if (import.meta.url === new URL(process.argv[1], "file://").href || process.argv[1]?.endsWith("snapshots.mjs")) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  if (outAt >= 0) {
    const dir = args[outAt + 1] ?? "snapshots";
    await mkdir(dir, { recursive: true });
    for (const { name, svg } of snapshotFarms()) await writeFile(join(dir, `${name}.svg`), svg);
    console.log(`🖼️  SVGs written to ${dir}/`);
  }
  if (args.includes("--update")) {
    const hashes = snapshotHashes();
    let before = {};
    try { before = JSON.parse(await readFile(SNAPSHOT_FILE, "utf8")); } catch { /* first run */ }
    await writeFile(SNAPSHOT_FILE, `${JSON.stringify(hashes, null, 2)}\n`);
    const changed = Object.keys(hashes).filter((k) => before[k] !== hashes[k]);
    console.log(changed.length ? `✅ Updated: ${changed.join(", ")}` : "✅ Snapshots are already up to date");
  }
  if (outAt < 0 && !args.includes("--update")) console.log("Use --update to refresh test/snapshots.json or --out <dir> to write the SVGs.");
}
