// Seasons, day/night and farmer colors are palette overrides on top of the base look.

export const SEASONS = ["none", "spring", "summer", "autumn", "winter", "rainy", "dry"];
export const SEASON_INPUTS = [...SEASONS, "auto", "auto-south"];

const BASE = {
  bg: "#3d7530",
  tuft: "#5c9d47",
  legend: "#e9f5d8",
  palette: {},
  particles: null, // "leaves" | "snow"
  flowers: false,
  puddles: false,
  rainShare: 0.22, // fraction of the weather cycle with rain (when weather is on)
};

const THEMES = {
  none: {},
  summer: {},
  spring: {
    bg: "#3f8033",
    tuft: "#6db054",
    flowers: true,
    palette: { g: "#58a043", G: "#4b9038", q: "#6cb455" },
  },
  autumn: {
    bg: "#66682b",
    tuft: "#a08a3a",
    particles: "leaves",
    palette: { g: "#8c8a3c", G: "#7d7a33", q: "#a39c48" },
  },
  winter: {
    bg: "#c9d7e0",
    tuft: "#ffffff",
    legend: "#33454f",
    particles: "snow",
    rainShare: 0,
    palette: { g: "#e4edf2", G: "#d0dde6", q: "#f6fafc", L: "#3f8a5a", l: "#69a87a" },
  },
  rainy: {
    bg: "#2d6729",
    tuft: "#4f9a43",
    puddles: true,
    rainShare: 0.45,
    palette: { g: "#3f8a35", G: "#357a2d", q: "#4f9a43" },
  },
  dry: {
    bg: "#8a8440",
    tuft: "#b8ad5a",
    legend: "#fff6d6",
    rainShare: 0,
    palette: { g: "#a59c52", G: "#968e48", q: "#b8ad5a", l: "#9fbf5a", L: "#7c9a3e" },
  },
};

/** Season for a date. Northern temperate by default; "auto-south" flips it. */
export function seasonForDate(date = new Date(), hemisphere = "north") {
  const m = date.getUTCMonth(); // 0 = Jan
  const north = m <= 1 || m === 11 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
  if (hemisphere === "north") return north;
  return { winter: "summer", summer: "winter", spring: "autumn", autumn: "spring" }[north];
}

export function resolveSeason(season = "none", date = new Date()) {
  if (season === "auto") return seasonForDate(date, "north");
  if (season === "auto-south") return seasonForDate(date, "south");
  if (!SEASONS.includes(season)) throw new Error(`Unknown season "${season}". Choose one of: ${SEASON_INPUTS.join(", ")}`);
  return season;
}

export function themeFor(season) {
  const t = THEMES[season] ?? {};
  return { ...BASE, ...t, palette: { ...BASE.palette, ...t.palette } };
}

// --- Farmer colors -------------------------------------------------------------

const HEX = /^#?([0-9a-f]{6})$/i;

export function parseColor(value, name = "color") {
  const m = String(value).trim().match(HEX);
  if (!m) throw new Error(`Invalid ${name} "${value}". Use a hex color like #d9473b.`);
  return `#${m[1].toLowerCase()}`;
}

export function darken(hex, amount = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - amount)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Palette overrides for { hat, shirt, overalls } (any subset). */
export function farmerPalette({ hat, shirt, overalls } = {}) {
  const p = {};
  if (hat) { const c = parseColor(hat, "hat color"); p.H = c; p.h = darken(c); }
  if (shirt) { const c = parseColor(shirt, "shirt color"); p.P = c; p.p = darken(c); }
  if (overalls) { const c = parseColor(overalls, "overalls color"); p.U = c; p.u = darken(c); }
  return p;
}

// --- Day / night -----------------------------------------------------------------

export const TIMES = ["day", "night", "auto"];

/**
 * Night owl or not: share of activity between 20:00 and 05:00 in the given time zone.
 * @param {string[]} timestamps ISO timestamps of recent activity
 */
export function timeOfDayFromActivity(timestamps, timeZone = "UTC") {
  if (!timestamps?.length) return "day";
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone });
  const night = timestamps.filter((ts) => {
    const h = Number(fmt.format(new Date(ts)));
    return h >= 20 || h < 5;
  }).length;
  return night / timestamps.length >= 0.4 ? "night" : "day";
}
