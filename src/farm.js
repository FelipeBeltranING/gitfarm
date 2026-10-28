import { renderFarm } from "./render.js";
import { demoCalendar } from "./demo.js";
import { fetchCalendar, fetchLanguages, fetchActivityTimestamps } from "./github.js";
import { mixCrops, parseCropList } from "./crops.js";
import { TIMES, timeOfDayFromActivity } from "./themes.js";

/**
 * Fetch everything needed and render the farm SVG (no file I/O).
 * Shared by the CLI, the GitHub Action and the web API.
 */
export async function buildFarm({
  user, token, crop = "auto", demo = false, language, streak,
  season = "none", time = "auto", timezone = "UTC", weather = true, farmer = {}, date = new Date(),
}) {
  let calendar;
  if (demo) {
    calendar = demoCalendar(typeof demo === "number" ? demo : 42);
  } else {
    if (!user) throw new Error("Missing GitHub username.");
    calendar = await fetchCalendar(user, token);
  }

  let crops;
  if (crop && crop !== "auto") crops = parseCropList(crop);
  else if (language) crops = mixCrops([{ language, share: 1 }]);
  else if (!demo) crops = mixCrops(await fetchLanguages(user, token).catch(() => []));
  else crops = mixCrops([]);

  if (!TIMES.includes(time)) throw new Error(`Unknown time "${time}". Choose one of: ${TIMES.join(", ")}`);
  let finalTime = time;
  if (time === "auto") {
    const activity = demo ? [] : await fetchActivityTimestamps(user, token).catch(() => []);
    finalTime = timeOfDayFromActivity(activity, timezone);
  }

  const svg = renderFarm({
    user: user || "octocat",
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
  return { svg, crops: crops.map((c) => c.crop), time: finalTime, total: calendar.total };
}

/** "false", "no", "0", "off" → false. */
export function parseBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "no", "0", "off"].includes(String(value).trim().toLowerCase());
}
