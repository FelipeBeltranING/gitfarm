import { test } from "node:test";
import assert from "node:assert/strict";
import { renderFarm } from "../src/render.js";
import { demoCalendar } from "../src/demo.js";

const cal = demoCalendar(7, new Date("2026-10-27"));
const render = (opts = {}) => renderFarm({ user: "octocat", total: cal.total, weeks: cal.weeks, crop: "corn", ...opts });

// Tiny well-formedness check: balanced tags and no duplicated attributes.
function assertWellFormed(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name, attrs, selfClosing] = m;
    const seen = new Set();
    for (const a of attrs.matchAll(/\s([\w:-]+)=/g)) {
      assert.ok(!seen.has(a[1]), `duplicated attribute "${a[1]}" in <${name}${attrs}>`);
      seen.add(a[1]);
    }
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `unexpected </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], "unclosed tags");
}

test("renders a well-formed SVG", () => {
  const svg = render();
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assertWellFormed(svg);
});

test("no JavaScript in the SVG (GitHub strips it)", () => {
  assert.doesNotMatch(render(), /<script|on\w+="/i);
});

test("one tilled plot per day of the calendar", () => {
  const days = cal.weeks.flat().filter(Boolean).length;
  const plots = render().match(/<use href="#soil" x="\d+" y="\d+" class="a"/g).length;
  assert.equal(plots, days);
});

test("animals depend on the streak", () => {
  assert.doesNotMatch(render({ streak: 3 }), /href="#chickenA"/);
  assert.match(render({ streak: 7 }), /href="#chickenA"/);
  assert.match(render({ streak: 30 }), /href="#cowA"/);
  assert.match(render({ streak: 100 }), /class="dog"/);
});

test("building grows with total contributions", () => {
  assert.match(render({ total: 50 }), /href="#shack" x=/);
  assert.match(render({ total: 500 }), /href="#barn" x=/);
  assert.match(render({ total: 5000 }), /href="#silo" x=/);
});

test("header shows stats and escapes the username", () => {
  const svg = render({ user: "<b>&" });
  assert.match(svg, /&lt;b&gt;&amp;&#39;s farm/);
  assert.match(svg, /current streak: /);
  assert.match(svg, /best day: /);
});

test("every season and night render well-formed SVGs", () => {
  for (const season of ["none", "spring", "summer", "autumn", "winter", "rainy", "dry", "auto", "auto-south"]) {
    for (const time of ["day", "night"]) {
      assertWellFormed(render({ season, time, streak: 100 }));
    }
  }
});

test("night adds a moon and fireflies", () => {
  assert.doesNotMatch(render({ time: "day" }), /class="fly"/);
  assert.match(render({ time: "night" }), /class="fly"/);
});

test("weather can be turned off", () => {
  assert.match(render({ weather: true }), /class="cloudA"/);
  assert.doesNotMatch(render({ weather: false }), /class="cloudA"|class="shower"/);
});

test("the farmer stops to water the best days", () => {
  const svg = render();
  assert.match(svg, /href="#farmerW" class="watering"/);
  assert.ok(svg.match(/href="#drops"/g).length <= 12);
});

test("mixed crops define one sprite set per crop", () => {
  const svg = render({ crop: undefined, crops: [{ crop: "corn", share: 0.5 }, { crop: "tomato", share: 0.5 }] });
  assert.match(svg, /id="(grown|harvest)-corn-\d"/);
  assert.match(svg, /id="(grown|harvest)-tomato-\d"/);
  assert.match(svg, /growing corn &amp; tomato/);
});

test("farmer colors end up in the sprites", () => {
  assert.match(render({ farmer: { shirt: "#123456" } }), /fill="#123456"/);
});

test("days without contributions stay as clean soil (no weeds)", () => {
  const svg = render({ season: "none" });
  assert.doesNotMatch(svg, /weed/);
});

test("rainy season still has puddles on empty days", () => {
  assert.match(render({ season: "rainy" }), /href="#puddle"/);
});

test("only the best day of the year gets a golden plot", () => {
  const svg = render();
  assert.equal(svg.match(/<use href="#gold"/g).length, 1);
});

test("top days sparkle and the farmer waters them", () => {
  const svg = render();
  assert.match(svg, /href="#sparkle"[^>]*class="tw"/);
  assert.match(svg, /href="#farmerW" class="watering"/);
});

test("plants are drawn back to front so tall ones overlap the row behind", () => {
  const svg = render();
  const ys = [...svg.matchAll(/<use href="#(?:grown|harvest)-\w+-\d" x="(\d+)" y="(\d+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  for (let k = 1; k < ys.length; k++) {
    const [x0, y0] = ys[k - 1];
    const [x1, y1] = ys[k];
    if (x0 === x1) assert.ok(y1 >= y0 - 20, "same column must be drawn top to bottom");
  }
});

test("birds visit the fence: 2 to 5, different each day, stable for the same day", () => {
  const day1 = render({ date: new Date("2026-10-29") });
  const again = render({ date: new Date("2026-10-29") });
  const day2 = render({ date: new Date("2026-10-30") });
  const count = (svg) => (svg.match(/class="bird"/g) ?? []).length;
  assert.equal(day1, again);
  assert.ok(count(day1) >= 2 && count(day1) <= 5);
  const flocks = new Set(Array.from({ length: 8 }, (_, k) => render({ date: new Date(Date.UTC(2026, 10, k + 1)) }).match(/@keyframes bird0\{[^}]*\}/)[0]));
  assert.ok(flocks.size > 1, "the flock should change between days");
});

test("a cat naps on the barn roof while the current streak is 3+ days", () => {
  assert.doesNotMatch(render({ streak: 2 }), /href="#cat"/);
  assert.match(render({ streak: 3 }), /href="#cat"/);
});

test("perched birds swap between two frames (normal and pecking), never one alone", () => {
  const svg = render();
  assert.equal((svg.match(/href="#birdP" class="bpA"/g) ?? []).length, (svg.match(/href="#birdK" class="bpB"/g) ?? []).length);
});
