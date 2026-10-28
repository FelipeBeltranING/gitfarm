import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats, unlockedAnimals, nextUnlock } from "../src/stats.js";

const week = (counts, start = 1) => [counts.map((count, i) => ({ date: `2026-01-${String(start + i).padStart(2, "0")}`, count }))];

test("longest streak counts consecutive active days", () => {
  assert.equal(computeStats(week([1, 2, 0, 3, 4, 5, 0])).longestStreak, 3);
  assert.equal(computeStats(week([0, 0, 0])).longestStreak, 0);
});

test("current streak ignores today when today has no commits yet", () => {
  assert.equal(computeStats(week([1, 1, 1, 0])).currentStreak, 3);
  assert.equal(computeStats(week([1, 0, 0])).currentStreak, 0);
  assert.equal(computeStats(week([0, 2, 2])).currentStreak, 2);
});

test("best day is the day with most contributions", () => {
  assert.deepEqual(computeStats(week([5, 0, 9, 2])).bestDay, { date: "2026-01-03", count: 9 });
  assert.equal(computeStats(week([0, 0])).bestDay, null);
});

test("streaks continue across weeks and skip padding cells", () => {
  const weeks = [[null, null, { date: "2026-01-01", count: 1 }], [{ date: "2026-01-02", count: 1 }, { date: "2026-01-03", count: 1 }]];
  assert.equal(computeStats(weeks).longestStreak, 3);
});

test("animals unlock at 7/14/21, 30 and 100 days", () => {
  assert.deepEqual(unlockedAnimals(6), { chickens: 0, cow: false, dog: false });
  assert.deepEqual(unlockedAnimals(14), { chickens: 2, cow: false, dog: false });
  assert.deepEqual(unlockedAnimals(30), { chickens: 3, cow: true, dog: false });
  assert.deepEqual(unlockedAnimals(100), { chickens: 3, cow: true, dog: true });
});

test("next unlock hint", () => {
  assert.equal(nextUnlock(0), "7 more days for a chicken");
  assert.equal(nextUnlock(29), "1 more day for a cow");
  assert.equal(nextUnlock(100), null);
});
