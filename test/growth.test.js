import { test } from "node:test";
import assert from "node:assert/strict";
import { harvestCap, plantFor, stretchSprite, stemRowIndex, STEM_MAX } from "../src/growth.js";
import { CROPS } from "../src/sprites.js";

const weeksOf = (counts) => [counts.map((count, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, count }))];

test("plants get taller with more contributions", () => {
  const cap = 10;
  const heights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => {
    const p = plantFor(c, cap);
    return ["sprout", "small", "grown", "harvest"].indexOf(p.stage) * 100 + p.stem;
  });
  for (let k = 1; k < heights.length; k++) assert.ok(heights[k] >= heights[k - 1], `${k + 1} commits shorter than ${k}`);
  assert.equal(plantFor(0, cap).stage, "empty");
  assert.deepEqual(plantFor(10, cap), { stage: "harvest", stem: STEM_MAX, golden: true, ratio: 1 });
});

test("the golden cap sits a bit below the best day so several days are golden", () => {
  const counts = Array.from({ length: 100 }, (_, i) => (i % 20) + 1); // 1..20, 5 times each
  const cap = harvestCap(weeksOf(counts));
  assert.ok(cap <= 20, "cap never above the best day");
  const golden = counts.filter((c) => plantFor(c, cap).golden).length;
  assert.ok(golden >= 5 && golden <= 15, `expected a handful of golden days, got ${golden}`);
});

test("one huge outlier day does not flatten the rest of the farm", () => {
  const counts = [...Array.from({ length: 60 }, (_, i) => (i % 6) + 1), 300];
  const cap = harvestCap(weeksOf(counts));
  assert.ok(cap <= 6, `cap ${cap} should follow the usual days, not the outlier`);
  assert.equal(plantFor(6, cap).golden, true);
});

test("a single active day still gets a golden harvest", () => {
  const cap = harvestCap(weeksOf([0, 0, 4, 0]));
  assert.equal(plantFor(4, cap).golden, true);
});

test("stretching keeps the crop's head and inserts stalk rows", () => {
  for (const [name, crop] of Object.entries(CROPS)) {
    for (const stage of ["grown", "harvest"]) {
      const rows = crop[stage];
      const tall = stretchSprite(rows, 5);
      assert.equal(tall.length, rows.length + 5, `${name}.${stage}`);
      assert.deepEqual(tall.slice(0, stemRowIndex(rows)), rows.slice(0, stemRowIndex(rows)));
      assert.deepEqual(tall.slice(-(rows.length - stemRowIndex(rows))), rows.slice(stemRowIndex(rows)));
      for (const r of tall) assert.equal(r.length, 8);
    }
  }
});
