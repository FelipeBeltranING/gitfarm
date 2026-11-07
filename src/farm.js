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

  if (!TIMES.includes(time)) throw new Error(`Unknown time "${time}". Choose one of: ${TIMES.join(", ")}`);
  if (streak !== undefined && !(Number.isInteger(streak) && streak >= 0)) {
    throw new Error("Invalid streak. Use a whole number of days.");
  }

  // Crops and night mode are extras: a failed lookup falls back to defaults, flagged as partial.
  let partial = false;
  const optional = (promise) => promise.catch(() => { partial = true; return []; });
  const pickCrops = !demo && !language && (!crop || crop === "auto");
  const [languages, activity] = await Promise.all([
    pickCrops ? optional(fetchLanguages(user, token)) : [],
    !demo && time === "auto" ? optional(fetchActivityTimestamps(user, token)) : [],
  ]);

  let crops;
  if (crop && crop !== "auto") crops = parseCropList(crop);
  else if (language) crops = mixCrops([{ language, share: 1 }]);
  else crops = mixCrops(languages);

  const finalTime = time === "auto" ? timeOfDayFromActivity(activity, timezone) : time;

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
  return { svg, crops: crops.map((c) => c.crop), time: finalTime, total: calendar.total, partial };
}

/** "false", "no", "0", "off" → false. */
export function parseBool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "no", "0", "off"].includes(String(value).trim().toLowerCase());
}
