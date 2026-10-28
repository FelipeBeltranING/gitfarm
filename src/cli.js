#!/usr/bin/env node
import { generate } from "./generate.js";

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

const args = parseArgs(process.argv.slice(2));
console.log("🚜 Planting your farm...");
generate({
  user: args.user,
  token: args.token ?? process.env.GITHUB_TOKEN,
  out: args.out,
  crop: args.crop,
  language: args.language,
  demo: args.demo ? (args.demo === true ? 42 : Number(args.demo)) : false,
})
  .then((r) => console.log(`🌱 ${r.out} — ${r.total} contributions, crop: ${r.crop}, ${(r.bytes / 1024).toFixed(0)} KB`))
  .catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
