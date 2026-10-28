#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { renderFarm } from "./render.js";
import { demoCalendar } from "./demo.js";
import { fetchCalendar, fetchTopLanguage } from "./github.js";
import { cropForLanguage, CROP_NAMES } from "./crops.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[key] = true;
    else { args[key] = next; i++; }
  }
  return args;
}

export async function generate({ user, token, out = "dist/farm.svg", crop, demo = false, language }) {
  let calendar;
  if (demo) {
    calendar = demoCalendar(typeof demo === "number" ? demo : 42);
  } else {
    if (!user) throw new Error("Missing GitHub username (--user).");
    calendar = await fetchCalendar(user, token);
    if (!language && !crop) language = await fetchTopLanguage(user, token).catch(() => null);
  }

  if (crop && crop !== "auto" && !CROP_NAMES.includes(crop)) {
    throw new Error(`Unknown crop "${crop}". Choose one of: ${CROP_NAMES.join(", ")}`);
  }
  const finalCrop = crop && crop !== "auto" ? crop : cropForLanguage(language);

  const svg = renderFarm({
    user: user ?? "octocat",
    total: calendar.total,
    weeks: calendar.weeks,
    crop: finalCrop,
    language: crop && crop !== "auto" ? undefined : language ?? undefined,
  });

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, svg);
  return { out, crop: finalCrop, total: calendar.total, bytes: Buffer.byteLength(svg) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  generate({
    user: args.user,
    token: args.token ?? process.env.GITHUB_TOKEN,
    out: args.out,
    crop: args.crop,
    language: args.language,
    demo: args.demo ? (args.demo === true ? 42 : Number(args.demo)) : false,
  })
    .then((r) => console.log(`🌱 ${r.out} — ${r.total} contributions, crop: ${r.crop}, ${(r.bytes / 1024).toFixed(0)} KB`))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
