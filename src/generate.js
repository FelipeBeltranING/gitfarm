import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { renderFarm } from "./render.js";
import { demoCalendar } from "./demo.js";
import { fetchCalendar, fetchTopLanguage } from "./github.js";
import { cropForLanguage, CROP_NAMES } from "./crops.js";

export async function generate({ user, token, out = "dist/farm.svg", crop, demo = false, language, streak }) {
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
    streak,
  });

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, svg);
  return { out, crop: finalCrop, total: calendar.total, bytes: Buffer.byteLength(svg) };
}
