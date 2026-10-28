import { test } from "node:test";
import assert from "node:assert/strict";
import { mixCrops, parseCropList, cropForLanguage } from "../src/crops.js";

test("languages map to crops", () => {
  assert.equal(cropForLanguage("Python"), "corn");
  assert.equal(cropForLanguage("C++"), "coffee");
  assert.equal(cropForLanguage("Haskell"), "wheat");
});

test("languages growing the same crop are merged", () => {
  const mix = mixCrops([
    { language: "JavaScript", share: 0.35 },
    { language: "TypeScript", share: 0.25 },
    { language: "Python", share: 0.4 },
  ]);
  assert.deepEqual(mix.map((c) => c.crop), ["sunflower", "corn"]);
  assert.ok(Math.abs(mix[0].share - 0.6) < 1e-9);
});

test("small languages are dropped and shares renormalized (max 3 crops)", () => {
  const mix = mixCrops([
    { language: "Python", share: 0.5 },
    { language: "Rust", share: 0.2 },
    { language: "Java", share: 0.18 },
    { language: "Haskell", share: 0.08 },
    { language: "Go", share: 0.04 },
  ]);
  assert.deepEqual(mix.map((c) => c.crop), ["corn", "tomato", "coffee"]);
  assert.ok(Math.abs(mix.reduce((s, c) => s + c.share, 0) - 1) < 1e-9);
});

test("no languages grows wheat", () => {
  assert.deepEqual(mixCrops([]), [{ crop: "wheat", share: 1, language: null }]);
});

test("crop lists from the crop input", () => {
  assert.deepEqual(parseCropList("corn, Tomato").map((c) => c.crop), ["corn", "tomato"]);
  assert.throws(() => parseCropList("banana"), /Unknown crop/);
});
