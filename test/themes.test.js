import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveSeason, seasonForDate, farmerPalette, parseColor, darken, timeOfDayFromActivity,
} from "../src/themes.js";

test("auto seasons follow the calendar in each hemisphere", () => {
  assert.equal(seasonForDate(new Date("2026-01-15"), "north"), "winter");
  assert.equal(seasonForDate(new Date("2026-04-15"), "north"), "spring");
  assert.equal(seasonForDate(new Date("2026-07-15"), "north"), "summer");
  assert.equal(seasonForDate(new Date("2026-10-15"), "north"), "autumn");
  assert.equal(seasonForDate(new Date("2026-01-15"), "south"), "summer");
  assert.equal(resolveSeason("auto-south", new Date("2026-07-01")), "winter");
});

test("unknown seasons are rejected", () => {
  assert.equal(resolveSeason("rainy"), "rainy");
  assert.throws(() => resolveSeason("monsoon"), /Unknown season/);
});

test("farmer colors are validated and get a darker shade", () => {
  assert.equal(parseColor("D9473B"), "#d9473b");
  assert.throws(() => parseColor("red"), /Invalid/);
  assert.equal(darken("#ffffff", 0.5), "#808080");
  assert.deepEqual(farmerPalette({ shirt: "#ffffff" }), { P: "#ffffff", p: "#bfbfbf" });
  assert.deepEqual(farmerPalette({}), {});
});

test("night owls are detected from activity hours", () => {
  const nights = ["2026-10-01T03:00:00Z", "2026-10-02T23:30:00Z", "2026-10-03T22:10:00Z"];
  const days = ["2026-10-01T14:00:00Z", "2026-10-02T15:30:00Z", "2026-10-03T16:10:00Z"];
  assert.equal(timeOfDayFromActivity(nights), "night");
  assert.equal(timeOfDayFromActivity(days), "day");
  assert.equal(timeOfDayFromActivity([]), "day");
  // 14:00 UTC is 21:00 in Jakarta
  assert.equal(timeOfDayFromActivity(days, "Asia/Jakarta"), "night");
});
