import {
  PIXEL, PALETTE, FARMER_A, FARMER_B, FARMER_WATER, TILE_GRASS, TILE_SOIL,
  SPROUT, SMALL, WEED, SPARKLE, CROPS,
  CHICKEN_A, CHICKEN_B, COW_A, COW_B, DOG_A, DOG_B, HAY,
  SCARECROW, SHACK, BARN, SILO, DROPS, PUDDLE, FLOWER,
} from "./sprites.js";
import { computeStats, unlockedAnimals, nextUnlock } from "./stats.js";
import { themeFor, resolveSeason, farmerPalette } from "./themes.js";

const CELL = 8 * PIXEL; // 16
const GAP = 2;
const PITCH = CELL + GAP; // 18
const MARGIN_X = 28;
const GRID_TOP = 82;
const BOTTOM = 30;
const PASTURE = 26; // extra strip below the bottom fence where animals live

// Animation timing (seconds)
const START = 0.8; // farmer reaches the first plot
const STEP = 0.05; // time per plot
const SPROUT_AFTER = 0.25;
const GROWN_AFTER = 0.8;
const EXIT = 1.0;
const HOLD = 4.5;
const FADE = 0.8;
const DOG_LAG = 0.22; // how far behind the farmer the dog trots
const COUNT_STEPS = 8; // harvest counter ticks
const COUNT_TICK = 0.12;
const WATER = 0.4; // pause on each watered plot
const MAX_WATERED = 12;
const WEATHER_CYCLE = 36; // seconds, clouds + rain loop

const FONT = "'Courier New',ui-monospace,monospace";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---------------------------------------------------------------------------
// Helpers

function spriteRects(rows, palette) {
  let out = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      if (ch !== ".") {
        out += `<rect x="${x * PIXEL}" y="${y * PIXEL}" width="${run * PIXEL}" height="${PIXEL}" fill="${palette[ch]}"/>`;
      }
      x += run;
    }
  });
  return out;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// Deterministic jitter so the farm looks hand-planted but stays stable.
export function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

/**
 * Random-but-stable wandering along a horizontal line: walk, pause, walk...
 * and come back to the starting point so the loop is seamless.
 */
function wander({ name, seed, minX, maxX, y, speed, pause, minDuration }) {
  const r = (() => { let k = 0; return () => hash(seed * 977 + k++); })();
  const x0 = minX + r() * (maxX - minX);
  const pts = [[0, x0, 1]];
  let t = 0;
  let x = x0;
  let f = 1;
  const moveTo = (nx) => {
    const nf = nx >= x ? 1 : -1;
    if (nf !== f) { t += 0.05; f = nf; pts.push([t, x, f]); }
    t += Math.abs(nx - x) / speed;
    x = nx;
    pts.push([t, x, f]);
  };
  const rest = () => { t += pause[0] + r() * (pause[1] - pause[0]); pts.push([t, x, f]); };
  while (t < minDuration) { rest(); moveTo(minX + r() * (maxX - minX)); }
  rest();
  moveTo(x0);
  rest();
  if (f !== 1) { t += 0.05; f = 1; pts.push([t, x, f]); }

  const frames = pts
    .map(([pt, px, pf]) => `${((pt / t) * 100).toFixed(3)}%{transform:translate(${px.toFixed(1)}px,${y}px) scaleX(${pf})}`)
    .join("");
  return { css: `@keyframes ${name}{${frames}}`, duration: t };
}

const plural = (n, word) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
const shortDate = (iso) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;

function barnFor(total) {
  if (total >= 1000) return "barn+silo";
  if (total >= 100) return "barn";
  return "shack";
}

/** Opacity keyframes: visible only inside the given [start, end] windows (seconds). */
function windowsKeyframes(name, windows, T, visibleInside = true) {
  const p = (t) => `${((t / T) * 100).toFixed(3)}%`;
  const inside = visibleInside ? 1 : 0;
  let k = `0%{opacity:${1 - inside}}`;
  for (const [a, b] of windows) k += `${p(a)}{opacity:${inside}}${p(b)}{opacity:${1 - inside}}`;
  return `@keyframes ${name}{${k}100%{opacity:${1 - inside}}}`;
}

function normalizeCrops(crops, crop, language) {
  const list = crops?.length ? crops : [{ crop: crop ?? "wheat", share: 1, language: language ?? null }];
  return list.map((c) => ({ ...c, crop: CROPS[c.crop] ? c.crop : "wheat" }));
}

// ---------------------------------------------------------------------------

/**
 * @param {object} opts
 * @param {string} opts.user
 * @param {number} opts.total
 * @param {Array<Array<{date:string, count:number, level:number}|null>>} opts.weeks  weeks[w][weekday]
 * @param {string} [opts.crop]       single crop (shortcut for `crops`)
 * @param {string} [opts.language]   language behind the single crop
 * @param {{crop:string, share:number, language?:string}[]} [opts.crops]  mixed crops
 * @param {number} [opts.streak]     override the best streak (previews)
 * @param {string} [opts.season]     none | spring | summer | autumn | winter | rainy | dry | auto | auto-south
 * @param {"day"|"night"} [opts.time]
 * @param {boolean} [opts.weather]   drifting clouds and the occasional shower
 * @param {{hat?:string, shirt?:string, overalls?:string}} [opts.farmer]
 * @param {Date} [opts.date]         generation date (for season: auto)
 */
export function renderFarm({
  user, total, weeks, crop, language, crops: cropMix, streak,
  season = "none", time = "day", weather = true, farmer = {}, date = new Date(),
}) {
  const seasonName = resolveSeason(season, date);
  const theme = themeFor(seasonName);
  const night = time === "night";
  const pal = { ...PALETTE, ...theme.palette, ...farmerPalette(farmer) };
  const crops = normalizeCrops(cropMix, crop, language);
  const mainCrop = crops[0].crop;

  const stats = computeStats(weeks);
  const bestStreak = streak ?? stats.longestStreak;
  const animals = unlockedAnimals(bestStreak);

  const W = weeks.length;
  const gridW = W * PITCH - GAP;
  const gridH = 7 * PITCH - GAP;
  const width = MARGIN_X * 2 + gridW;
  const height = GRID_TOP + gridH + BOTTOM + PASTURE;
  const cellX = (w) => MARGIN_X + w * PITCH;
  const cellY = (d) => GRID_TOP + d * PITCH;

  const defs = [];
  const def = (id, rows, palette = pal) => defs.push(`<g id="${id}">${spriteRects(rows, palette)}</g>`);
  // Sprite whose origin is the middle of its feet (easy to flip and place on the ground).
  const footDef = (id, rows) => {
    const w = rows[0].length * PIXEL;
    const h = rows.length * PIXEL;
    defs.push(`<g id="${id}"><g transform="translate(${-w / 2},${-h})">${spriteRects(rows, pal)}</g></g>`);
  };

  // --- Timeline ------------------------------------------------------------
  // Farmer path: down even columns, up odd columns (boustrophedon).
  const path = [];
  for (let w = 0; w < W; w++) {
    for (let k = 0; k < 7; k++) path.push([w, w % 2 === 0 ? k : 6 - k]);
  }
  const N = path.length;
  const dayAt = (i) => weeks[path[i][0]]?.[path[i][1]];

  // The farmer stops to water your best harvest days.
  const watered = new Set(
    path.map((_, i) => i)
      .filter((i) => dayAt(i)?.level === 4)
      .sort((a, b) => (dayAt(b).count ?? 0) - (dayAt(a).count ?? 0) || a - b)
      .slice(0, MAX_WATERED),
  );
  const cellTime = [];
  let clock = START;
  for (let i = 0; i < N; i++) {
    cellTime.push(clock);
    clock += STEP + (watered.has(i) ? WATER : 0);
  }
  const walkEnd = cellTime[N - 1] + (watered.has(N - 1) ? WATER : 0);
  const countStart = walkEnd + EXIT;
  const T = countStart + HOLD + FADE;
  const pct = (t) => `${((t / T) * 100).toFixed(3)}%`;

  // Keyframes are generated per distinct timestamp and shared between elements.
  const keyframes = new Map();
  const on = (t) => {
    const name = `o${Math.round(t * 100)}`;
    if (!keyframes.has(name)) {
      keyframes.set(name, `@keyframes ${name}{0%{opacity:0}${pct(t)}{opacity:1}100%{opacity:1}}`);
    }
    return name;
  };
  const windowed = (t1, t2) => {
    const name = `w${Math.round(t1 * 100)}_${Math.round(t2 * 100)}`;
    if (!keyframes.has(name)) {
      keyframes.set(name, `@keyframes ${name}{0%{opacity:0}${pct(t1)}{opacity:1}${pct(t2)}{opacity:0}100%{opacity:0}}`);
    }
    return name;
  };
  const anim = (name) => `class="a" style="animation-name:${name}"`;

  // Mixed crops: each plot picks a crop by share, deterministically.
  const cropAt = (i) => {
    let r = hash(i * 53 + 11);
    for (const c of crops) { if (r < c.share) return c.crop; r -= c.share; }
    return mainCrop;
  };

  // --- Field ---------------------------------------------------------------
  const base = [];
  const field = [];
  path.forEach(([w, d], i) => {
    const day = dayAt(i);
    const x = cellX(w);
    const y = cellY(d);
    base.push(`<use href="#grass" x="${x}" y="${y}"/>`);
    if (!day) return;

    const t = cellTime[i];
    field.push(`<use href="#soil" x="${x}" y="${y}" ${anim(on(t))}/>`);

    const level = day.level;
    if (level === 0) {
      // Skipped days: the occasional weed (or a puddle in the rainy season).
      if (theme.puddles && hash(i * 17 + 3) < 0.18) {
        field.push(`<use href="#puddle" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER))}/>`);
      } else if (hash(i * 31 + 7) < 0.2) {
        field.push(`<use href="#weed" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER * 2))}/>`);
      }
    } else if (level === 1) {
      field.push(`<use href="#sprout" x="${x}" y="${y}" ${anim(on(t + SPROUT_AFTER))}/>`);
    } else {
      field.push(`<use href="#sprout" x="${x}" y="${y}" ${anim(windowed(t + SPROUT_AFTER, t + GROWN_AFTER))}/>`);
      const c = cropAt(i);
      if (level === 2) {
        field.push(`<use href="#small" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER))}/>`);
      } else if (level === 3) {
        field.push(`<use href="#grown-${c}" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER))}/>`);
      } else {
        const delay = (hash(i) * 2).toFixed(2);
        field.push(
          `<g ${anim(on(t + GROWN_AFTER))}><use href="#harvest-${c}" x="${x}" y="${y}"/>` +
          `<use href="#sparkle" x="${x + 10}" y="${y - 1}" class="tw" style="animation-delay:${delay}s"/></g>`,
        );
      }
    }
  });

  // Scarecrow guarding your best day, with a tiny sign.
  let scarecrow = "";
  if (stats.bestDay) {
    const i = path.findIndex((_, k) => dayAt(k)?.date === stats.bestDay.date);
    if (i >= 0) {
      const [w, d] = path[i];
      const cx = cellX(w) + CELL / 2;
      const feet = cellY(d) + CELL - 1;
      const label = `best: ${stats.bestDay.count}`;
      const lw = label.length * 6 + 8;
      scarecrow =
        `<g ${anim(on(cellTime[i] + GROWN_AFTER))}>` +
        `<use href="#scarecrow" x="${cx}" y="${feet}"/>` +
        `<rect x="${cx - lw / 2}" y="${feet - 41}" width="${lw}" height="11" rx="1" fill="#5e3820"/>` +
        `<rect x="${cx - lw / 2 + 1}" y="${feet - 40}" width="${lw - 2}" height="9" fill="#9a6338"/>` +
        `<text x="${cx}" y="${feet - 32.5}" class="t4" text-anchor="middle">${escapeXml(label)}</text></g>`;
    }
  }

  // --- Farmer, watering & dog ------------------------------------------------
  const fx = (w) => cellX(w) + CELL / 2 - 12;
  const fy = (d) => cellY(d) + CELL - 2 - 32;
  const [, ld] = path[N - 1];
  const exitX = width - MARGIN_X + 2 - 12;
  const farmerPts = [[0, MARGIN_X - 30, fy(0)]];
  const waterWindows = [];
  path.forEach(([w, d], i) => {
    farmerPts.push([cellTime[i], fx(w), fy(d)]);
    if (watered.has(i)) {
      farmerPts.push([cellTime[i] + WATER, fx(w), fy(d)]);
      waterWindows.push([cellTime[i], cellTime[i] + WATER]);
      // Drops fall from the can's spout, just right of the farmer.
      field.push(
        `<g ${anim(windowed(cellTime[i] + 0.05, cellTime[i] + WATER))}>` +
        `<use href="#drops" x="${fx(w) + 26}" y="${fy(d) + 24}" class="drip"/></g>`,
      );
    }
  });
  farmerPts.push([walkEnd + EXIT, exitX, fy(ld)]);

  const toFrames = (pts) => pts
    .map(([t, x, y]) => `${pct(t)}{transform:translate(${x}px,${y}px)}`)
    .join("") + `100%{transform:translate(${pts.at(-1)[1]}px,${pts.at(-1)[2]}px)}`;
  const moves = toFrames(farmerPts);

  // The dog (100-day streak) trots behind the farmer, feet on the same plot.
  // Farmer sprite is 24x32 and dog 20x14, both anchored by their feet.
  const dogMoves = animals.dog
    ? toFrames([
      [0, MARGIN_X - 56, fy(0) + 18],
      ...farmerPts.slice(1, -1).map(([t, x, y]) => [t + DOG_LAG, x + 2, y + 18]),
      [walkEnd + EXIT + DOG_LAG, exitX - 18, fy(ld) + 18],
    ])
    : "";

  // Harvest counter: a speech bubble above the farmer that ticks up to the total.
  const bubbleW = Math.max(56, `+${total.toLocaleString("en-US")}`.length * 9 + 18);
  const bubbleX = exitX + 24 - bubbleW;
  const bubbleY = fy(ld) - 22;
  let counter =
    `<g ${anim(on(countStart))}>` +
    `<rect x="${bubbleX}" y="${bubbleY}" width="${bubbleW}" height="18" rx="3" fill="#2b1d14"/>` +
    `<rect x="${bubbleX + 2}" y="${bubbleY + 2}" width="${bubbleW - 4}" height="14" rx="2" fill="#fff8e6"/>` +
    `<rect x="${exitX + 10}" y="${bubbleY + 16}" width="6" height="4" fill="#2b1d14"/>` +
    `<rect x="${exitX + 12}" y="${bubbleY + 16}" width="2" height="2" fill="#fff8e6"/>`;
  for (let k = 1; k <= COUNT_STEPS; k++) {
    const value = Math.round((total * k) / COUNT_STEPS);
    const t1 = countStart + (k - 1) * COUNT_TICK;
    const visible = k === COUNT_STEPS ? on(t1) : windowed(t1, t1 + COUNT_TICK);
    counter += `<g ${anim(visible)}><text x="${bubbleX + bubbleW / 2}" y="${bubbleY + 13}" class="ct" text-anchor="middle">+${value.toLocaleString("en-US")}</text></g>`;
  }
  counter += "</g>";

  // --- Pasture: animals unlocked by your best streak ------------------------
  const fenceBottom = GRID_TOP + gridH + 6;
  const floorY = fenceBottom + 34;
  const hint = nextUnlock(bestStreak);
  const pastureText = `best streak: ${plural(bestStreak, "day")}` + (hint ? ` · ${hint}` : " · all animals unlocked!");
  const pastureSignW = pastureText.length * 6.7 + 20;

  // Building at the right end of the pasture grows with your yearly total.
  const building = barnFor(total);
  const barnX = width - MARGIN_X - 18;
  const pasture = [];
  if (building === "shack") {
    pasture.push(`<use href="#shack" x="${barnX}" y="${floorY}"/>`);
  } else {
    pasture.push(`<use href="#barn" x="${barnX}" y="${floorY}"/>`);
    if (building === "barn+silo") pasture.push(`<use href="#silo" x="${barnX - 24}" y="${floorY}"/>`);
  }
  const hayX = barnX - (building === "barn+silo" ? 54 : 44);
  pasture.push(`<use href="#hay" x="${hayX}" y="${floorY - 14}"/>`);

  const roamMin = 12 + pastureSignW + 24;
  const roamMax = hayX - 16;
  const extraCss = [];
  if (animals.cow) {
    const cow = wander({ name: "cow", seed: 3, minX: roamMin, maxX: roamMax, y: floorY, speed: 6, pause: [3, 7], minDuration: 30 });
    extraCss.push(cow.css);
    pasture.push(`<g style="animation:cow ${cow.duration.toFixed(2)}s linear infinite"><g transform="scale(1.5)"><use href="#cowA" class="ga"/><use href="#cowB" class="gb"/></g></g>`);
  }
  for (let c = 0; c < animals.chickens; c++) {
    const ch = wander({ name: `chk${c}`, seed: 11 + c * 5, minX: roamMin, maxX: roamMax, y: floorY, speed: 22, pause: [0.6, 2.2], minDuration: 14 + c * 3 });
    extraCss.push(ch.css);
    const delay = `animation-delay:-${(c * 0.45).toFixed(2)}s`;
    pasture.push(`<g style="animation:chk${c} ${ch.duration.toFixed(2)}s linear infinite"><use href="#chickenA" class="pa" style="${delay}"/><use href="#chickenB" class="pb" style="${delay}"/></g>`);
  }

  // --- Season decoration -------------------------------------------------------
  let ground = "";
  for (let k = 0; k < 40; k++) {
    const tx = Math.floor(hash(k * 7 + 1) * (width - 8)) + 4;
    const ty = hash(k * 13 + 5) < 0.5
      ? Math.floor(hash(k * 3 + 2) * 10) + 4
      : height - Math.floor(hash(k * 5 + 9) * 12) - 8;
    ground += `<rect x="${tx}" y="${ty}" width="2" height="4" fill="${theme.tuft}"/><rect x="${tx + 2}" y="${ty + 2}" width="2" height="2" fill="${theme.tuft}"/>`;
  }
  if (theme.flowers) {
    for (let k = 0; k < 28; k++) {
      const fxp = Math.floor(hash(k * 11 + 4) * (width - 20)) + 10;
      const top = hash(k * 19 + 2) < 0.4;
      const fyp = top ? Math.floor(hash(k * 23 + 1) * 6) + 4 : height - Math.floor(hash(k * 29 + 6) * 10) - 10;
      ground += `<use href="#flower${k % 3}" x="${fxp}" y="${fyp}"/>`;
    }
  }

  let particles = "";
  if (theme.particles) {
    const snow = theme.particles === "snow";
    const count = snow ? 46 : 18;
    for (let k = 0; k < count; k++) {
      const px = Math.floor(hash(k * 41 + 9) * width);
      const dur = (snow ? 9 : 11) + hash(k * 43 + 1) * 6;
      const delay = -(hash(k * 47 + 3) * dur);
      const color = snow ? "#ffffff" : ["#d9822b", "#c4512b", "#e8b13a"][k % 3];
      const size = snow ? (k % 4 === 0 ? 3 : 2) : 3;
      particles += `<rect x="${px}" y="-6" width="${size}" height="${size - (snow ? 0 : 1)}" fill="${color}" class="${k % 2 ? "fallA" : "fallB"}" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${delay.toFixed(1)}s"/>`;
    }
    extraCss.push(`.fallA,.fallB{animation-timing-function:linear;animation-iteration-count:infinite}
.fallA{animation-name:fallA}.fallB{animation-name:fallB}
@keyframes fallA{0%{transform:translate(0,0)}50%{transform:translate(14px,${height / 2}px)}100%{transform:translate(0,${height + 12}px)}}
@keyframes fallB{0%{transform:translate(0,0)}50%{transform:translate(-14px,${height / 2}px)}100%{transform:translate(0,${height + 12}px)}}`);
  }

  // --- Weather: drifting cloud shadows and the occasional shower -------------
  let weatherLayer = "";
  if (weather) {
    const cloud = (s) => `<g opacity=".13" fill="#0b1d0b">` +
      `<rect x="${12 * s}" y="0" width="${44 * s}" height="${10 * s}"/>` +
      `<rect x="0" y="${8 * s}" width="${80 * s}" height="${14 * s}"/>` +
      `<rect x="${8 * s}" y="${20 * s}" width="${60 * s}" height="${8 * s}"/></g>`;
    weatherLayer += `<g class="cloudA">${cloud(1.6)}</g><g class="cloudB">${cloud(1.1)}</g>`;
    extraCss.push(`.cloudA{animation:drift ${WEATHER_CYCLE}s linear infinite}
.cloudB{animation:drift ${WEATHER_CYCLE * 1.4}s linear infinite;animation-delay:-${(WEATHER_CYCLE * 0.8).toFixed(1)}s}
@keyframes drift{0%{transform:translate(-160px,${GRID_TOP + 6}px)}100%{transform:translate(${width + 40}px,${GRID_TOP + 40}px)}}`);

    if (theme.rainShare > 0) {
      let drops = "";
      for (let k = 0; k < 70; k++) {
        const px = Math.floor(hash(k * 61 + 5) * width);
        const delay = -(hash(k * 67 + 2) * 0.8);
        drops += `<rect x="${px}" y="-10" width="1.5" height="6" fill="#a9dcff" class="drop" style="animation-delay:${delay.toFixed(2)}s"/>`;
      }
      const share = theme.rainShare;
      weatherLayer += `<g class="shower">${drops}</g>`;
      extraCss.push(`.shower{animation:shower ${WEATHER_CYCLE}s step-end infinite;opacity:0}
@keyframes shower{0%{opacity:0}${(50 - share * 50).toFixed(1)}%{opacity:.75}${(50 + share * 50).toFixed(1)}%{opacity:0}}
.drop{animation:drop .8s linear infinite}
@keyframes drop{0%{transform:translate(0,0)}100%{transform:translate(-8px,${height + 20}px)}}`);
    }
  }

  // --- Night: dark sky, moon, stars and fireflies ------------------------------
  let nightLayer = "";
  if (night) {
    nightLayer += `<rect width="${width}" height="${height}" rx="10" fill="#0a1638" opacity=".45"/>`;
    const moonX = Math.round(width * 0.62);
    nightLayer += `<g fill="#fff4c2"><rect x="${moonX + 4}" y="12" width="12" height="20"/><rect x="${moonX}" y="16" width="20" height="12"/><rect x="${moonX + 2}" y="14" width="16" height="16"/></g>` +
      `<g fill="#0a1638" opacity=".55"><rect x="${moonX + 10}" y="14" width="8" height="8"/></g>`;
    for (let k = 0; k < 14; k++) {
      const sx = Math.floor(hash(k * 71 + 3) * (width * 0.5)) + Math.floor(width * 0.4);
      const sy = Math.floor(hash(k * 73 + 7) * 50) + 6;
      nightLayer += `<rect x="${sx}" y="${sy}" width="2" height="2" fill="#ffffff" class="tw" style="animation-delay:-${(hash(k) * 2).toFixed(2)}s"/>`;
    }
    for (let k = 0; k < 22; k++) {
      const fx2 = Math.floor(hash(k * 79 + 1) * gridW) + MARGIN_X;
      const fy2 = Math.floor(hash(k * 83 + 5) * (height - GRID_TOP - 20)) + GRID_TOP;
      nightLayer += `<g class="fly" style="animation-delay:-${(hash(k * 89) * 6).toFixed(2)}s"><rect x="${fx2}" y="${fy2}" width="2" height="2" fill="#e9ff8a" class="tw" style="animation-delay:-${(hash(k * 97) * 1.6).toFixed(2)}s"/></g>`;
    }
    extraCss.push(".fly{animation:fly 6s ease-in-out infinite}@keyframes fly{0%,100%{transform:translate(0,0)}33%{transform:translate(6px,-4px)}66%{transform:translate(-4px,3px)}}");
  }

  // --- Header ----------------------------------------------------------------
  const title = `${user}'s farm`;
  const cropNames = crops.map((c) => (c.language ? `${CROPS[c.crop].name} (${c.language})` : CROPS[c.crop].name));
  const cropLabel = cropNames.length > 1 ? `${cropNames.slice(0, -1).join(", ")} & ${cropNames.at(-1)}` : cropNames[0];
  const subtitle = `${plural(total, "contribution")} in the last year · growing ${cropLabel}`;
  const statsLine = `current streak: ${plural(stats.currentStreak, "day")}` +
    (stats.bestDay ? ` · best day: ${shortDate(stats.bestDay.date)} (${stats.bestDay.count})` : "");
  const signW = Math.max(title.length * 9.2, subtitle.length * 6.7, statsLine.length * 6.7) + 24;

  // Legend (right side of header)
  const legendItems = ["soil", "sprout", "small", `grown-${mainCrop}`, `harvest-${mainCrop}`];
  const legendW = legendItems.length * PITCH - GAP;
  const legendX = width - MARGIN_X - legendW - 34;
  const legendY = 22;
  const legend =
    `<text x="${legendX - 8}" y="${legendY + 12}" class="lg" text-anchor="end">less</text>` +
    legendItems
      .map((id, k) => {
        const lx = legendX + k * PITCH;
        const under = id === "soil" ? "" : `<use href="#soil" x="${lx}" y="${legendY}"/>`;
        return `${under}<use href="#${id}" x="${lx}" y="${legendY}"/>`;
      })
      .join("") +
    `<text x="${legendX + legendW + 8}" y="${legendY + 12}" class="lg">more</text>`;

  // Fence along the top and bottom of the field
  const fence = (y) => {
    let s = `<rect x="${MARGIN_X - 10}" y="${y}" width="${gridW + 20}" height="2" fill="#8a5a33"/>` +
      `<rect x="${MARGIN_X - 10}" y="${y + 5}" width="${gridW + 20}" height="2" fill="#8a5a33"/>`;
    for (let px = MARGIN_X - 10; px <= MARGIN_X + gridW + 10; px += PITCH * 4) {
      s += `<rect x="${px}" y="${y - 3}" width="4" height="13" fill="#6b4226"/>` +
        `<rect x="${px}" y="${y - 3}" width="4" height="2" fill="#9c6a3f"/>`;
    }
    return s;
  };

  // --- Sprites -----------------------------------------------------------------
  def("grass", TILE_GRASS);
  def("soil", TILE_SOIL);
  def("sprout", SPROUT);
  def("small", SMALL);
  for (const { crop: c } of crops) {
    def(`grown-${c}`, CROPS[c].grown);
    def(`harvest-${c}`, CROPS[c].harvest);
  }
  def("weed", WEED);
  def("sparkle", SPARKLE);
  def("farmerA", FARMER_A);
  def("farmerB", FARMER_B);
  def("dogA", DOG_A);
  def("dogB", DOG_B);
  def("hay", HAY);
  footDef("chickenA", CHICKEN_A);
  footDef("chickenB", CHICKEN_B);
  footDef("cowA", COW_A);
  footDef("cowB", COW_B);
  footDef("scarecrow", SCARECROW);
  footDef("shack", SHACK);
  footDef("barn", BARN);
  footDef("silo", SILO);
  if (waterWindows.length) { def("farmerW", FARMER_WATER); def("drops", DROPS); }
  if (theme.puddles) def("puddle", PUDDLE);
  if (theme.flowers) {
    ["#f29cc1", "#ffffff", "#b99cf2"].forEach((color, k) => def(`flower${k}`, FLOWER, { ...pal, f: color }));
  }

  // While watering, the walking sprites hide and the watering one shows.
  const farmerSprites = waterWindows.length
    ? `<g class="walking"><use href="#farmerA" class="fa"/><use href="#farmerB" class="fb"/></g><use href="#farmerW" class="watering"/>`
    : `<use href="#farmerA" class="fa"/><use href="#farmerB" class="fb"/>`;
  if (waterWindows.length) {
    extraCss.push(
      `.walking{animation:walking ${T.toFixed(2)}s step-end infinite}.watering{opacity:0;animation:watering ${T.toFixed(2)}s step-end infinite}`,
      windowsKeyframes("walking", waterWindows, T, false),
      windowsKeyframes("watering", waterWindows, T, true),
      ".drip{animation:drip .3s linear infinite}@keyframes drip{0%{transform:translate(0,0)}100%{transform:translate(0,6px)}}",
    );
  }

  const css = `
.a{opacity:0;animation-duration:${T.toFixed(2)}s;animation-iteration-count:infinite;animation-timing-function:step-end}
.field{animation:fade ${T.toFixed(2)}s linear infinite}
@keyframes fade{0%{opacity:1}${pct(T - FADE)}{opacity:1}100%{opacity:0}}
.farmer{animation:walk ${T.toFixed(2)}s linear infinite}
@keyframes walk{${moves}}
.dog{animation:dogrun ${T.toFixed(2)}s linear infinite}
${dogMoves ? `@keyframes dogrun{${dogMoves}}` : ""}
.pa{animation:pkA 1.4s step-end infinite}
.pb{animation:pkB 1.4s step-end infinite}
@keyframes pkA{0%{opacity:1}70%{opacity:0}}
@keyframes pkB{0%{opacity:0}70%{opacity:1}}
.ga{animation:pkA 3.4s step-end infinite}
.gb{animation:pkB 3.4s step-end infinite}
.fa{animation:legA .32s step-end infinite}
.fb{animation:legB .32s step-end infinite}
@keyframes legA{0%{opacity:1}50%{opacity:0}}
@keyframes legB{0%{opacity:0}50%{opacity:1}}
.tw{animation:tw 1.6s ease-in-out infinite;opacity:0}
@keyframes tw{0%,100%{opacity:0}50%{opacity:1}}
.t1{font:bold 15px ${FONT};fill:#fff3d1}
.t2{font:bold 11px ${FONT};fill:#f3dfae}
.t3{font:bold 10px ${FONT};fill:#fff3d1}
.t4{font:bold 8px ${FONT};fill:#fff3d1}
.ct{font:bold 12px ${FONT};fill:#2b1d14}
.lg{font:bold 11px ${FONT};fill:${night ? "#e9f5d8" : theme.legend}}
${extraCss.join("\n")}
${[...keyframes.values()].join("\n")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges" role="img" aria-label="${escapeXml(`${title}: ${subtitle}. ${statsLine}`)}">
<title>${escapeXml(title)}</title>
<style>${css}</style>
<defs>
${defs.join("\n")}
</defs>
<rect width="${width}" height="${height}" rx="10" fill="${theme.bg}"/>
${ground}
${fence(GRID_TOP - 12)}
${fence(fenceBottom)}
<g>${base.join("")}</g>
<g class="field">
${field.join("\n")}
${scarecrow}
${animals.dog ? `<g class="dog"><use href="#dogA" class="fa"/><use href="#dogB" class="fb"/></g>` : ""}
<g class="farmer">${farmerSprites}</g>
</g>
${pasture.join("\n")}
${weatherLayer}
${particles}
${nightLayer}
<rect x="12" y="10" width="${signW.toFixed(0)}" height="54" rx="3" fill="#5e3820"/>
<rect x="14" y="12" width="${(signW - 4).toFixed(0)}" height="50" rx="2" fill="#9a6338"/>
<rect x="14" y="12" width="${(signW - 4).toFixed(0)}" height="2" fill="#b77c4a"/>
<text x="24" y="29" class="t1">${escapeXml(title)}</text>
<text x="24" y="43" class="t2">${escapeXml(subtitle)}</text>
<text x="24" y="56" class="t2">${escapeXml(statsLine)}</text>
${legend}
<rect x="12" y="${fenceBottom + 16}" width="${pastureSignW.toFixed(0)}" height="20" rx="2" fill="#5e3820"/>
<rect x="14" y="${fenceBottom + 18}" width="${(pastureSignW - 4).toFixed(0)}" height="16" rx="1" fill="#9a6338"/>
<text x="22" y="${fenceBottom + 30}" class="t3">${escapeXml(pastureText)}</text>
<g class="field">${counter}</g>
</svg>`;
}
