import { test } from "node:test";
import assert from "node:assert/strict";
import { planBirds, seedFrom, rng } from "../src/birds.js";

const base = { columns: 53, colTime: (w) => 0.8 + w * 0.35, walkEnd: 0.8 + 53 * 0.35, loopEnd: 28, avoid: 30 };

test("the PRNG is deterministic", () => {
  const a = rng(42); const b = rng(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  assert.notEqual(seedFrom("octocat|2026-10-29"), seedFrom("octocat|2026-10-30"));
});

test("flocks have 2 to 5 birds, spread out and away from the scarecrow", () => {
  for (let s = 0; s < 50; s++) {
    const plan = planBirds({ ...base, seed: s });
    assert.ok(plan.length >= 2 && plan.length <= 5, `seed ${s}: ${plan.length} birds`);
    const cols = plan.map((b) => b.visits[0].w);
    for (const w of cols) assert.ok(Math.abs(w - base.avoid) > 3);
    for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) assert.ok(Math.abs(cols[i] - cols[j]) > 3);
  }
});

test("birds leave before the farmer reaches them and come back behind him", () => {
  let returns = 0;
  for (let s = 0; s < 50; s++) {
    for (const bird of planBirds({ ...base, seed: s })) {
      const [first, second] = bird.visits;
      assert.ok(first.leave < base.colTime(first.w), "must leave before the farmer arrives");
      assert.ok(first.arrive < first.leave);
      if (second) {
        returns++;
        assert.ok(second.arrive > first.leave);
        assert.ok(base.colTime(second.w) < second.arrive, "must land behind the farmer");
      }
    }
  }
  assert.ok(returns > 10, "some birds should come back");
});
