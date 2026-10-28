import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/farm.js";
import { loopDuration } from "../tools/record.mjs";

function call(query) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      statusCode: 0,
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(body) { resolve({ status: this.statusCode, headers: this.headers, body }); },
    };
    handler({ query }, res);
  });
}

test("demo farm is served as a cacheable SVG", async () => {
  const r = await call({ demo: "1", streak: "100", season: "winter" });
  assert.equal(r.status, 200);
  assert.match(r.headers["content-type"], /image\/svg\+xml/);
  assert.match(r.headers["cache-control"], /s-maxage=/);
  assert.match(r.body, /^<svg/);
  assert.match(r.body, /class="dog"/);
});

test("invalid usernames get a friendly error image", async () => {
  for (const user of ["", "bad--name", "-start", "a".repeat(40), "../etc"]) {
    const r = await call({ user });
    assert.equal(r.status, 400, `user "${user}"`);
    assert.match(r.body, /your-github-username/);
  }
});

test("bad options become an error image instead of a crash", async () => {
  const r = await call({ demo: "1", crop: "banana" });
  assert.equal(r.status, 200);
  assert.match(r.body, /Unknown crop/);
});

test("recorder reads the loop length from the SVG", () => {
  assert.equal(loopDuration('<style>.a{opacity:0;animation-duration:30.40s;}</style>'), 30.4);
  assert.equal(loopDuration("<svg/>"), 30);
});
