import {
  PIXEL, PALETTE, FARMER_A, FARMER_B, TILE_GRASS, TILE_SOIL,
  SPROUT, SMALL, WEED, SPARKLE, CROPS,
} from "./sprites.js";

const CELL = 8 * PIXEL; // 16
const GAP = 2;
const PITCH = CELL + GAP; // 18
const MARGIN_X = 28;
const GRID_TOP = 66;
const BOTTOM = 30;

// Animation timing (seconds)
const START = 0.8; // farmer reaches the first plot
const STEP = 0.05; // time per plot
const SPROUT_AFTER = 0.25;
const GROWN_AFTER = 0.8;
const EXIT = 1.0;
const HOLD = 4.5;
const FADE = 0.8;

// ---------------------------------------------------------------------------
// Sprite helpers

function spriteRects(rows, palette = PALETTE) {
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

const def = (id, rows) => `<g id="${id}">${spriteRects(rows)}</g>`;

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// Deterministic jitter so the farm looks hand-planted but stays stable.
function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------

/**
 * @param {object} opts
 * @param {string} opts.user
 * @param {number} opts.total
 * @param {Array<Array<{date:string, level:number}|null>>} opts.weeks  weeks[w][weekday]
 * @param {string} opts.crop   key of CROPS
 * @param {string} [opts.language]
 */
export function renderFarm({ user, total, weeks, crop = "wheat", language }) {
  const cropSprites = CROPS[crop] ?? CROPS.wheat;
  const W = weeks.length;
  const gridW = W * PITCH - GAP;
  const gridH = 7 * PITCH - GAP;
  const width = MARGIN_X * 2 + gridW;
  const height = GRID_TOP + gridH + BOTTOM;

  const cellX = (w) => MARGIN_X + w * PITCH;
  const cellY = (d) => GRID_TOP + d * PITCH;

  // Farmer path: down even columns, up odd columns (boustrophedon).
  const path = [];
  for (let w = 0; w < W; w++) {
    for (let k = 0; k < 7; k++) path.push([w, w % 2 === 0 ? k : 6 - k]);
  }
  const N = path.length;
  const walkEnd = START + (N - 1) * STEP;
  const T = walkEnd + Math.max(EXIT, GROWN_AFTER) + HOLD + FADE;
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

  const base = [];
  const crops = [];
  path.forEach(([w, d], i) => {
    const day = weeks[w]?.[d];
    const x = cellX(w);
    const y = cellY(d);
    base.push(`<use href="#grass" x="${x}" y="${y}"/>`);
    if (!day) return;

    const t = START + i * STEP;
    const anim = (name) => `class="a" style="animation-name:${name}"`;
    crops.push(`<use href="#soil" x="${x}" y="${y}" ${anim(on(t))}/>`);

    const level = day.level;
    if (level === 0) {
      // Skipped days grow the occasional weed once the farmer has moved on.
      if (hash(i * 31 + 7) < 0.2) {
        crops.push(`<use href="#weed" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER * 2))}/>`);
      }
    } else if (level === 1) {
      crops.push(`<use href="#sprout" x="${x}" y="${y}" ${anim(on(t + SPROUT_AFTER))}/>`);
    } else if (level >= 2) {
      crops.push(`<use href="#sprout" x="${x}" y="${y}" ${anim(windowed(t + SPROUT_AFTER, t + GROWN_AFTER))}/>`);
      const final = level === 2 ? "small" : level === 3 ? "grown" : "harvest";
      if (level === 4) {
        const delay = (hash(i) * 2).toFixed(2);
        crops.push(
          `<g ${anim(on(t + GROWN_AFTER))}><use href="#${final}" x="${x}" y="${y}"/>` +
          `<use href="#sparkle" x="${x + 10}" y="${y - 1}" class="tw" style="animation-delay:${delay}s"/></g>`,
        );
      } else {
        crops.push(`<use href="#${final}" x="${x}" y="${y}" ${anim(on(t + GROWN_AFTER))}/>`);
      }
    }
  });

  // Farmer movement keyframes: feet on the plot he is tilling.
  const fx = (w) => cellX(w) + CELL / 2 - 12;
  const fy = (d) => cellY(d) + CELL - 2 - 32;
  const moves = [`0%{transform:translate(${MARGIN_X - 30}px,${fy(0)}px)}`];
  path.forEach(([w, d], i) => {
    moves.push(`${pct(START + i * STEP)}{transform:translate(${fx(w)}px,${fy(d)}px)}`);
  });
  const [lw, ld] = path[N - 1];
  const exitX = width - MARGIN_X + 2 - 12;
  moves.push(`${pct(walkEnd + EXIT)}{transform:translate(${exitX}px,${fy(ld)}px)}`);
  moves.push(`100%{transform:translate(${exitX}px,${fy(ld)}px)}`);

  // Header text
  const title = `${user}'s farm`;
  const cropLabel = language ? `${cropSprites.name} (${language})` : cropSprites.name;
  const subtitle = `${total.toLocaleString("en-US")} contributions in the last year · growing ${cropLabel}`;

  // Legend (right side of header)
  const legendItems = ["soil", "sprout", "small", "grown", "harvest"];
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

  // A few grass tufts in the margins for texture
  let tufts = "";
  for (let k = 0; k < 40; k++) {
    const tx = Math.floor(hash(k * 7 + 1) * (width - 8)) + 4;
    const ty = hash(k * 13 + 5) < 0.5
      ? Math.floor(hash(k * 3 + 2) * 10) + 4
      : height - Math.floor(hash(k * 5 + 9) * 12) - 8;
    tufts += `<rect x="${tx}" y="${ty}" width="2" height="4" fill="#5c9d47"/><rect x="${tx + 2}" y="${ty + 2}" width="2" height="2" fill="#5c9d47"/>`;
  }

  const css = `
.a{opacity:0;animation-duration:${T.toFixed(2)}s;animation-iteration-count:infinite;animation-timing-function:step-end}
.field{animation:fade ${T.toFixed(2)}s linear infinite}
@keyframes fade{0%{opacity:1}${pct(T - FADE)}{opacity:1}100%{opacity:0}}
.farmer{animation:walk ${T.toFixed(2)}s linear infinite}
@keyframes walk{${moves.join("")}}
.fa{animation:legA .32s step-end infinite}
.fb{animation:legB .32s step-end infinite}
@keyframes legA{0%{opacity:1}50%{opacity:0}}
@keyframes legB{0%{opacity:0}50%{opacity:1}}
.tw{animation:tw 1.6s ease-in-out infinite;opacity:0}
@keyframes tw{0%,100%{opacity:0}50%{opacity:1}}
.t1{font:bold 15px 'Courier New',ui-monospace,monospace;fill:#fff3d1}
.t2{font:bold 11px 'Courier New',ui-monospace,monospace;fill:#f3dfae}
.lg{font:bold 11px 'Courier New',ui-monospace,monospace;fill:#e9f5d8}
${[...keyframes.values()].join("\n")}`;

  const signW = Math.max(title.length * 9.2, subtitle.length * 6.7) + 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges" role="img" aria-label="${escapeXml(`${title}: ${subtitle}`)}">
<title>${escapeXml(title)}</title>
<style>${css}</style>
<defs>
${def("grass", TILE_GRASS)}
${def("soil", TILE_SOIL)}
${def("sprout", SPROUT)}
${def("small", SMALL)}
${def("grown", cropSprites.grown)}
${def("harvest", cropSprites.harvest)}
${def("weed", WEED)}
${def("sparkle", SPARKLE)}
${def("farmerA", FARMER_A)}
${def("farmerB", FARMER_B)}
</defs>
<rect width="${width}" height="${height}" rx="10" fill="#3d7530"/>
${tufts}
<rect x="12" y="10" width="${signW.toFixed(0)}" height="40" rx="3" fill="#5e3820"/>
<rect x="14" y="12" width="${(signW - 4).toFixed(0)}" height="36" rx="2" fill="#9a6338"/>
<rect x="14" y="12" width="${(signW - 4).toFixed(0)}" height="2" fill="#b77c4a"/>
<text x="24" y="28" class="t1">${escapeXml(title)}</text>
<text x="24" y="42" class="t2">${escapeXml(subtitle)}</text>
${legend}
${fence(GRID_TOP - 12)}
${fence(GRID_TOP + gridH + 6)}
<g>${base.join("")}</g>
<g class="field">
${crops.join("\n")}
<g class="farmer"><use href="#farmerA" class="fa"/><use href="#farmerB" class="fb"/></g>
</g>
</svg>`;
}
