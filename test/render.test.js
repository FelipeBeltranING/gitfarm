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
