#!/usr/bin/env node
// Record a farm SVG as MP4 or GIF so it can be shared where SVGs don't play
// (Reddit, X, Discord...).
//
//   npm install                       # installs playwright (dev dependency)
//   npx playwright install chromium   # once
//   node tools/record.mjs farm.svg --out farm.mp4
//   node tools/record.mjs farm.svg --out farm.gif --fps 10 --width 720
//
// Needs ffmpeg on your PATH (https://ffmpeg.org/download.html).

import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { spawn } from "node:child_process";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { args._.push(a); continue; }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[a.slice(2)] = true;
    else { args[a.slice(2)] = next; i++; }
  }
  return args;
}

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, cmdArgs, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("error", (e) => reject(e.code === "ENOENT" ? new Error(`${cmd} not found. Install it and make sure it is on your PATH.`) : e));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed:\n${err.slice(-800)}`))));
  });
}

/** Loop length of a GitFarm SVG (the main field animation). */
export function loopDuration(svg) {
  const m = svg.match(/\.a\{[^}]*animation-duration:([\d.]+)s/);
  return m ? Number(m[1]) : 30;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args._[0];
  if (!input || args.help) {
    console.log("Usage: node tools/record.mjs <farm.svg> [--out farm.mp4|farm.gif] [--fps 12] [--width 800] [--seconds N]");
    process.exit(input ? 0 : 1);
  }
  const out = args.out ?? "farm.mp4";
  const format = extname(out).toLowerCase();
  if (![".mp4", ".gif"].includes(format)) throw new Error("--out must end in .mp4 or .gif");
  const fps = Number(args.fps ?? (format === ".gif" ? 10 : 24));
  const width = Number(args.width ?? (format === ".gif" ? 720 : 1008));

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("Playwright is not installed. Run: npm install && npx playwright install chromium");
  }

  const svg = await readFile(input, "utf8");
  const seconds = Number(args.seconds ?? loopDuration(svg));
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const height = Math.round((width * vh) / vw / 2) * 2;

  const frames = await mkdtemp(join(tmpdir(), "gitfarm-"));
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    const sized = svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${width}" height="${height}"`);
    await page.setContent(`<!doctype html><body style="margin:0;background:#3d7530">${sized}</body>`);
    const total = Math.round(seconds * fps);
    for (let f = 0; f < total; f++) {
      const ms = (f / fps) * 1000;
      await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), ms);
      await page.screenshot({ path: join(frames, `f${String(f).padStart(5, "0")}.png`) });
      if (f % fps === 0) process.stdout.write(`\r🎞️  frame ${f}/${total}`);
    }
    process.stdout.write("\n");
  } finally {
    await browser.close();
  }

  const pattern = join(frames, "f%05d.png");
  if (format === ".mp4") {
    await run("ffmpeg", ["-y", "-framerate", String(fps), "-i", pattern, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", out]);
  } else {
    const palette = join(frames, "palette.png");
    await run("ffmpeg", ["-y", "-i", pattern, "-vf", "palettegen=max_colors=96", palette]);
    await run("ffmpeg", ["-y", "-framerate", String(fps), "-i", pattern, "-i", palette, "-lavfi", "paletteuse=dither=none", "-loop", "0", out]);
  }
  await rm(frames, { recursive: true, force: true });
  console.log(`✅ ${out} (${seconds.toFixed(1)}s, ${fps} fps, ${width}x${height})`);
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/").split("/").pop() ?? "")) {
  main().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
}
