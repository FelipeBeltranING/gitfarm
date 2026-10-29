// Birds that visit the top fence: they land, peck, hop and turn around,
// flee when the farmer gets close, and some come back once he has passed.
// Everything is deterministic for a given seed (user + day), so each daily
// run of the Action brings a different flock while the SVG stays stable.

const FLY = 1.3; // seconds of flight between the sky and the fence
const SKY_DX = 60;
const SKY_DY = 80;

/** Small deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

/**
 * Plan the flock. Pure data, no SVG: easy to test.
 * @param {object} o
 * @param {number} o.columns       number of week columns
 * @param {(w:number)=>number} o.colTime  when the farmer reaches column w (s)
 * @param {number} o.walkEnd       when the farmer leaves the field (s)
 * @param {number} o.loopEnd       when the field starts fading (s)
 * @param {number} o.avoid         column to keep free (the scarecrow's)
 * @param {number} o.seed
 */
export function planBirds({ columns, colTime, walkEnd, loopEnd, avoid = -99, seed }) {
  const r = rng(seed);
  const count = 2 + Math.floor(r() * 4); // 2..5
  const taken = [];
  const free = (w) => w >= 3 && w <= columns - 4 && Math.abs(w - avoid) > 3 && taken.every((u) => Math.abs(u - w) > 3);
  const farmerCol = (t) => {
    let w = 0;
    while (w + 1 < columns && colTime(w + 1) <= t) w++;
    return w;
  };

  const birds = [];
  for (let b = 0; b < count; b++) {
    let w = -1;
    for (let tries = 0; tries < 40 && w < 0; tries++) {
      const pick = 3 + Math.floor(r() * (columns - 6));
      if (free(pick)) w = pick;
    }
    if (w < 0) break;
    taken.push(w);

    const leave = Math.max(0.6, colTime(w) - 0.5 - r() * 0.6);
    const lateArrival = r() < 0.4 && leave > 4;
    const arrive = lateArrival ? 0.5 + r() * (leave - 3) : 0;
    const visits = [{ w, arrive, leave, fromLeft: r() < 0.5, toLeft: r() < 0.5, offset: Math.floor(r() * 7) }];

    // Some come back and land behind the farmer once he has passed.
    const back = leave + FLY + 1 + r() * 3;
    if (r() < 0.55 && back < walkEnd - 1) {
      const passed = farmerCol(back) - 4;
      const lo = Math.max(2, passed - 14);
      if (passed > lo) {
        const w2 = lo + Math.floor(r() * (passed - lo));
        if (Math.abs(w2 - avoid) > 2) {
          visits.push({ w: w2, arrive: back, leave: loopEnd, fromLeft: r() < 0.5, toLeft: r() < 0.5, offset: Math.floor(r() * 7) });
        }
      }
    }

    birds.push({
      visits,
      peck: 1.6 + r() * 2.2, // seconds per peck cycle
      hop: 2.4 + r() * 2.6,
      turn: 4 + r() * 6,
      phase: r() * 4,
    });
  }
  return birds;
}

/**
 * Turn the plan into SVG markup + CSS.
 * @param {ReturnType<typeof planBirds>} plan
 * @param {object} o  { T, fenceTop, cellX, pct }
 */
export function renderBirds(plan, { T, fenceTop, cellX, pct }) {
  const css = [
    ".bpA{animation:pkA 2s step-end infinite}.bpB{animation:pkB 2s step-end infinite}",
    ".bturn{animation:bturn 6s step-end infinite}@keyframes bturn{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}}",
    ".bhop{animation:bhop 3s linear infinite}@keyframes bhop{0%,80%,100%{transform:translateY(0)}86%{transform:translateY(-3px)}92%{transform:translateY(0)}95%{transform:translateY(-1.5px)}98%{transform:translateY(0)}}",
  ];
  const markup = [];
  const vis = (name, windows) => {
    let k = `0%{opacity:0}`;
    for (const [a, b] of windows) k += `${pct(a)}{opacity:1}${pct(b)}{opacity:0}`;
    css.push(`@keyframes ${name}{${k}100%{opacity:0}}`);
    return `style="opacity:0;animation:${name} ${T.toFixed(2)}s step-end infinite"`;
  };

  plan.forEach((bird, b) => {
    const pts = [];
    const perched = [];
    const flights = [];
    const at = (w, offset) => cellX(w) + 2 + offset;
    bird.visits.forEach((v) => {
      const x = at(v.w, v.offset);
      const skyIn = [x + (v.fromLeft ? -SKY_DX : SKY_DX), fenceTop - SKY_DY];
      const skyOut = [x + (v.toLeft ? -SKY_DX : SKY_DX), fenceTop - SKY_DY];
      const out = Math.min(v.leave, T - FLY);
      if (v.arrive > 0) {
        pts.push([v.arrive, ...skyIn], [v.arrive + FLY, x, fenceTop]);
        flights.push({ from: v.arrive, to: v.arrive + FLY, left: !v.fromLeft });
        perched.push([v.arrive + FLY, out]);
      } else {
        pts.push([0, x, fenceTop]);
        perched.push([0, out]);
      }
      pts.push([out, x, fenceTop], [out + FLY, ...skyOut]);
      flights.push({ from: out, to: out + FLY, left: v.toLeft });
    });
    if (pts[0][0] > 0) pts.unshift([0, ...pts[0].slice(1)]);
    const last = pts.at(-1);
    const frames = pts.map(([t, x, y]) => `${pct(t)}{transform:translate(${x.toFixed(1)}px,${y}px)}`).join("") +
      `100%{transform:translate(${last[1].toFixed(1)}px,${last[2]}px)}`;
    css.push(`@keyframes bird${b}{${frames}}`);

    const d = (s) => `-${(bird.phase + s).toFixed(2)}s`;
    let g = `<g class="bird" style="animation:bird${b} ${T.toFixed(2)}s linear infinite"><g transform="scale(1.5)">`;
    g += `<g ${vis(`bp${b}`, perched)}>` +
      `<g class="bturn" style="animation-duration:${bird.turn.toFixed(2)}s;animation-delay:${d(0)}">` +
      `<g class="bhop" style="animation-duration:${bird.hop.toFixed(2)}s;animation-delay:${d(1)}">` +
      `<use href="#birdP" class="bpA" style="animation-duration:${bird.peck.toFixed(2)}s;animation-delay:${d(2)}"/>` +
      `<use href="#birdK" class="bpB" style="animation-duration:${bird.peck.toFixed(2)}s;animation-delay:${d(2)}"/>` +
      `</g></g></g>`;
    flights.forEach((f, k) => {
      g += `<g ${vis(`bf${b}_${k}`, [[f.from, f.to]])}><g transform="scale(${f.left ? -1 : 1},1)">` +
        `<use href="#birdA" class="fa"/><use href="#birdB" class="fb"/></g></g>`;
    });
    g += "</g></g>";
    markup.push(g);
  });
  return { markup: markup.join("\n"), css: css.join("\n") };
}
