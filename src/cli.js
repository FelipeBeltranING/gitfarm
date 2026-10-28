#!/usr/bin/env node
import { generate, parseBool } from "./generate.js";

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

if (args.help) {
  console.log(`Usage: node src/cli.js --user <github-user> [options]

  --out <file>              output SVG (default dist/farm.svg)
  --token <token>           GitHub token (or GITHUB_TOKEN env var)
  --crop <auto|crop[,crop]> corn, sunflower, tomato, coffee, wheat (default auto)
  --season <name>           none, spring, summer, autumn, winter, rainy, dry, auto, auto-south
  --time <auto|day|night>   night owls get a night farm (default auto)
  --timezone <tz>           IANA time zone for --time auto (default UTC)
  --weather <true|false>    clouds and showers (default true)
  --farmer-hat <hex>        farmer colors, e.g. #efc96d
  --farmer-shirt <hex>
  --farmer-overalls <hex>
  --demo [seed]             fake data, no network
  --streak <days>           preview the animals for a given streak`);
  process.exit(0);
}

console.log("🚜 Planting your farm...");
generate({
  user: args.user,
  token: args.token ?? process.env.GITHUB_TOKEN,
  out: args.out,
  crop: args.crop,
  language: args.language,
  streak: args.streak !== undefined ? Number(args.streak) : undefined,
  season: args.season,
  time: args.time ?? (args.demo ? "day" : "auto"),
  timezone: args.timezone,
  weather: parseBool(args.weather, true),
  farmer: { hat: args["farmer-hat"], shirt: args["farmer-shirt"], overalls: args["farmer-overalls"] },
  demo: args.demo ? (args.demo === true ? 42 : Number(args.demo)) : false,
})
  .then((r) => console.log(`🌱 ${r.out} — ${r.total} contributions, crops: ${r.crops.join(" + ")}, ${r.time}, ${(r.bytes / 1024).toFixed(0)} KB`))
  .catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
