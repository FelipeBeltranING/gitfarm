import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { renderFarm } from "./render.js";
import { demoCalendar } from "./demo.js";
import { fetchCalendar, fetchLanguages, fetchActivityTimestamps } from "./github.js";
import { mixCrops, parseCropList } from "./crops.js";
import { TIMES, timeOfDayFromActivity } from "./themes.js";

/**
 * Build the farm SVG and write it to `out`.
 * Options mirror the Action inputs; everything except `user` is optional.
 */
export async function generate({
  user, token, out = "dist/farm.svg", crop = "auto", demo = false, language, streak,
  season = "none", time = "auto", timezone = "UTC", weather = true, farmer = {}, date = new Date(),
}) {
  let calendar;
  let crops;
  let activity = [];

  if (demo) {
    calendar = demoCalendar(typeof demo === "number" ? demo : 42);
  } else {
    if (!user) throw new Error("Missing GitHub username (--user).");
    calendar = await fetchCalendar(user, token);
  }

  if (crop && crop !== "auto") {
    crops = parseCropList(crop);
  } else if (language) {
    crops = mixCrops([{ language, share: 1 }]);
  } else if (!demo) {
    crops = mixCrops(await fetchLanguages(user, token).catch(() => []));
  } else {
    crops = mixCrops([]);
  }

  if (!TIMES.includes(time)) throw new Error(`Unknown time "${time}". Choose one of: ${TIMES.join(", ")}`);
  let finalTime = time;
  if (time === "auto") {
    if (!demo) activity = await fetchActivityTimestamps(user, token).catch(() => []);
    finalTime = timeOfDayFromActivity(activity, timezone);
  }

  const svg = renderFarm({
    user: user ?? "octocat",
    total: calendar.total,
    weeks: calendar.weeks,
    crops,
    streak,
    season,
    time: finalTime,
    weather,
    farmer,
    date,
  });

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, svg);
  return {
    out,
    crops: crops.map((c) => c.crop),
    time: finalTime,
    total: calendar.total,
    bytes: Buffer.byteLength(svg),
  };
}

/** "false", "no", "0", "off" → false. */
export function parseBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "no", "0", "off"].includes(String(value).trim().toLowerCase());
}
