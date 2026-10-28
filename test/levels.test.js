import { test } from "node:test";
import assert from "node:assert/strict";
import { withLevels, demoCalendar } from "../src/demo.js";

test("zero contributions is always level 0", () => {
  const [[day]] = withLevels([[{ date: "2026-01-01", count: 0 }]]);
  assert.equal(day.level, 0);
});

test("levels follow quartiles of non-zero days", () => {
  const counts = [1, 2, 3, 4, 5, 6, 7, 8];
  const weeks = withLevels([counts.map((count, i) => ({ date: `2026-01-0${i + 1}`, count }))]);
  const levels = weeks[0].map((d) => d.level);
  assert.deepEqual(levels, [1, 1, 2, 2, 3, 3, 4, 4]);
});

test("levels given by GitHub are kept", () => {
  const [[day]] = withLevels([[{ date: "2026-01-01", count: 3, level: 4 }]]);
  assert.equal(day.level, 4);
});

test("demo calendar is deterministic and covers a year", () => {
  const a = demoCalendar(1, new Date("2026-10-27"));
  const b = demoCalendar(1, new Date("2026-10-27"));
  assert.deepEqual(a, b);
  assert.ok(a.weeks.length >= 52 && a.weeks.length <= 54);
});
