import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createFarmApp, safeFilename, buildFarmUrl, isFarmErrorSvg, DEFAULTS,
} from "../public/app.js";

const FARM_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>farm</title></svg>';
const ERROR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" data-gitfarm-error="true"><text>error</text></svg>';
const tick = () => new Promise((resolve) => setImmediate(resolve));

class FakeElement {
  constructor(id) {
    this.id = id;
    this.value = "";
    this.checked = false;
    this.textContent = "";
    this.src = "";
    this.disabled = false;
    this.href = "";
    this.download = "";
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatch(type, extra = {}) {
    const event = { type, target: this, preventDefault() {}, ...extra };
    for (const listener of this.listeners.get(type) ?? []) listener(event);
    return event;
  }
  requestSubmit() {
    return this.dispatch("submit");
  }
  click() {
    return this.dispatch("click");
  }
  remove() {
    this.parentNode?.removeChild(this);
    this.removed = true;
  }
}

function setup({ search = "", fetch: fetchImpl, clipboard } = {}) {
  const ids = [
    "form", "user", "crop", "season", "time", "weather", "hat", "shirt", "overalls",
    "farm", "status", "snippet", "copy", "download",
  ];
  const els = Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]));
  Object.assign(els.crop, { value: "auto" });
  Object.assign(els.season, { value: "none" });
  Object.assign(els.time, { value: "auto" });
  els.weather.checked = true;
  els.hat.value = DEFAULTS.hat;
  els.shirt.value = DEFAULTS.shirt;
  els.overalls.value = DEFAULTS.overalls;

  const downloads = [];
  const blobs = [];
  const revoked = [];
  const timers = [];
  const copied = [];
  const body = {
    children: [],
    appendChild(el) { el.parentNode = this; this.children.push(el); },
    removeChild(el) { this.children = this.children.filter((child) => child !== el); el.parentNode = null; },
  };
  const document = {
    getElementById: (id) => els[id],
    createElement(tag) {
      const el = new FakeElement(tag);
      if (tag === "a") el.click = () => downloads.push({ href: el.href, download: el.download });
      return el;
    },
    body,
  };
  const location = { href: "https://gitfarm.test/", search };
  const history = {
    calls: [],
    replaceState(...args) { this.calls.push(args); },
  };
  const nav = clipboard === undefined
    ? { clipboard: { writeText: async (text) => copied.push(text) } }
    : { clipboard };

  const fetchCalls = [];
  const fetch = fetchImpl ?? ((url) => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    fetchCalls.push({ url, resolve, reject });
    return promise;
  });

  createFarmApp({
    document,
    location,
    history,
    fetch,
    navigator: nav,
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
    createObjectURL: (blob) => { blobs.push(blob); return `blob:test/${blobs.length}`; },
    revokeObjectURL: (url) => revoked.push(url),
  });

  return { els, document, location, history, fetchCalls, downloads, blobs, revoked, timers, copied };
}

function respond(call, { svg = FARM_SVG, ok = true, status = 200 } = {}) {
  call.resolve({ ok, status, text: async () => svg });
}

test("the page wires the disabled Download SVG button to the app module", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const button = html.match(/<button\b[^>]*\bid="download"[^>]*>[\s\S]*?<\/button>/i)?.[0];
  assert.ok(button, "Download SVG button is present");
  assert.match(button, /\bdisabled\b/i, "Download SVG starts disabled");
  assert.match(button, />\s*Download SVG\s*</i);
  assert.match(html, /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="app\.js")[^>]*>\s*<\/script>/i);
});

test("safe filenames strip unsafe characters and never escape the download folder", () => {
  assert.equal(safeFilename("vinay"), "vinay-farm.svg");
  assert.equal(safeFilename("../../etc/passwd"), "etc-passwd-farm.svg");
  assert.equal(safeFilename("bad--name"), "bad-name-farm.svg");
  assert.equal(safeFilename("   "), "gitfarm-farm.svg");
  assert.equal(safeFilename("x".repeat(100)), `${"x".repeat(39)}-farm.svg`);
});

test("farm URLs use every selected option and omit defaults", () => {
  const base = "https://gitfarm.test/";
  assert.equal(
    buildFarmUrl(base, { user: "vinay", crop: "auto", season: "none", time: "auto", weather: true, ...DEFAULTS }),
    `${base}api/farm?user=vinay`,
  );
  const url = new URL(buildFarmUrl(base, {
    user: "vinay", crop: "corn", season: "winter", time: "night", weather: false,
    hat: "#111111", shirt: "#222222", overalls: "#333333",
  }));
  assert.equal(url.searchParams.get("user"), "vinay");
  assert.equal(url.searchParams.get("crop"), "corn");
  assert.equal(url.searchParams.get("season"), "winter");
  assert.equal(url.searchParams.get("time"), "night");
  assert.equal(url.searchParams.get("weather"), "false");
  assert.equal(url.searchParams.get("hat"), "#111111");
  assert.equal(url.searchParams.get("shirt"), "#222222");
  assert.equal(url.searchParams.get("overalls"), "#333333");
});

test("the download button is disabled on the demo farm", () => {
  const { els, downloads, blobs } = setup();
  assert.equal(els.download.disabled, true);
  assert.match(els.snippet.textContent, /your-username/);
  els.download.click();
  assert.equal(downloads.length, 0);
  assert.equal(blobs.length, 0);
});

test("a successfully loaded farm downloads with its URL, options and filename", async () => {
  const { els, history, fetchCalls, downloads, blobs, revoked, timers } = setup();
  els.user.value = "Vinay";
  els.crop.value = "corn";
  els.season.value = "winter";
  els.time.value = "night";
  els.weather.checked = false;
  els.hat.value = "#111111";
  els.shirt.value = "#222222";
  els.overalls.value = "#333333";

  els.form.requestSubmit();
  assert.equal(fetchCalls.length, 1);
  assert.equal(els.download.disabled, true, "disabled while the farm loads");
  assert.equal(els.farm.src, fetchCalls[0].url);
  assert.equal(history.calls.at(-1)[2], "?user=Vinay");
  for (const [key, value] of Object.entries({
    user: "Vinay", crop: "corn", season: "winter", time: "night", weather: "false",
    hat: "#111111", shirt: "#222222", overalls: "#333333",
  })) {
    assert.equal(new URL(fetchCalls[0].url).searchParams.get(key), value, key);
  }

  respond(fetchCalls[0]);
  await tick();
  assert.equal(els.download.disabled, true, "still disabled until the image loads");

  els.farm.dispatch("load");
  assert.equal(els.download.disabled, false);
  els.download.click();

  assert.deepEqual(downloads, [{ href: "blob:test/1", download: "Vinay-farm.svg" }]);
  assert.equal(await blobs[0].text(), FARM_SVG);
  assert.equal(blobs[0].type, "image/svg+xml;charset=utf-8");
  assert.match(els.status.textContent, /Downloaded Vinay-farm\.svg/);
  timers.at(-1).fn();
  assert.deepEqual(revoked, ["blob:test/1"]);
});

test("a new submission disables download until the new farm loads", async () => {
  const { els, fetchCalls, downloads } = setup();
  els.user.value = "vinay";
  els.form.requestSubmit();
  respond(fetchCalls[0]);
  await tick();
  els.farm.dispatch("load");
  assert.equal(els.download.disabled, false);

  els.user.value = "octocat";
  els.form.requestSubmit();
  assert.equal(fetchCalls.length, 2);
  assert.equal(els.download.disabled, true);
  assert.equal(els.status.textContent, "🚜 Planting...");
  els.download.click();
  assert.equal(downloads.length, 0, "the old farm must not be downloaded");

  respond(fetchCalls[1]);
  await tick();
  els.farm.dispatch("load");
  assert.equal(els.download.disabled, false);
  assert.equal(new URL(fetchCalls[1].url).searchParams.get("user"), "octocat");
});

test("re-planting the same farm re-enables download without a second load event", async () => {
  const { els, fetchCalls } = setup();
  els.user.value = "vinay";
  els.form.requestSubmit();
  respond(fetchCalls[0]);
  await tick();
  els.farm.dispatch("load");
  assert.equal(els.download.disabled, false);

  els.farm.complete = true;
  els.farm.naturalWidth = 1008;
  els.form.requestSubmit();
  respond(fetchCalls[1]);
  await tick();
  assert.equal(els.download.disabled, false);
});

test("failed image loads keep download disabled with a useful message", async () => {
  const { els, fetchCalls } = setup();
  els.user.value = "vinay";
  els.form.requestSubmit();
  respond(fetchCalls[0]);
  await tick();

  els.farm.dispatch("error");
  assert.equal(els.download.disabled, true);
  assert.equal(els.status.textContent, "Something went wrong. Check the username and try again.");
});

test("API error images are never treated as downloadable farms", async () => {
  assert.equal(isFarmErrorSvg(ERROR_SVG), true);
  assert.equal(isFarmErrorSvg(FARM_SVG), false);

  const { els, fetchCalls } = setup();
  els.user.value = "nobody-here";
  els.form.requestSubmit();
  respond(fetchCalls[0], { svg: ERROR_SVG });
  await tick();
  els.farm.dispatch("load");

  assert.equal(els.download.disabled, true);
  assert.match(els.status.textContent, /Couldn't plant that farm/);
});

test("invalid or empty usernames never start a farm load", () => {
  const { els, fetchCalls } = setup();
  els.user.value = "bad--name";
  els.form.requestSubmit();
  assert.equal(fetchCalls.length, 0);
  assert.equal(els.download.disabled, true);
  assert.match(els.status.textContent, /doesn't look like a GitHub username/);

  els.user.value = "   ";
  els.form.requestSubmit();
  assert.equal(fetchCalls.length, 0);
  assert.equal(els.download.disabled, true);
  assert.match(els.status.textContent, /Type a GitHub username/);
});

test("editing the username or settings invalidates the loaded download", async () => {
  const { els, fetchCalls, downloads } = setup();
  els.user.value = "vinay";
  els.form.requestSubmit();
  respond(fetchCalls[0]);
  await tick();
  els.farm.dispatch("load");
  assert.equal(els.download.disabled, false);

  els.user.value = "octocat";
  els.form.dispatch("input");
  assert.equal(els.download.disabled, true);
  assert.match(els.status.textContent, /settings changed/i);
  els.download.click();
  assert.equal(downloads.length, 0);

  els.user.value = "vinay";
  els.form.dispatch("input");
  assert.equal(els.download.disabled, false, "reverting restores the matching preview");

  els.crop.value = "corn";
  els.form.dispatch("change");
  assert.equal(els.download.disabled, true);
  els.crop.value = "auto";
  els.form.dispatch("change");
  assert.equal(els.download.disabled, false);
});

test("editing during an in-flight load leaves download disabled", async () => {
  const { els, fetchCalls, downloads } = setup();
  els.user.value = "vinay";
  els.form.requestSubmit();
  respond(fetchCalls[0]);
  await tick();

  // The fetch has resolved, but the preview image has not fired its load event yet.
  els.user.value = "octocat";
  els.form.dispatch("input");
  els.farm.dispatch("load");

  assert.equal(els.download.disabled, true);
  assert.match(els.status.textContent, /settings changed/i);
  els.download.click();
  assert.equal(downloads.length, 0);
});

test("query-string usernames still plant automatically", () => {
  const { els, fetchCalls } = setup({ search: "?user=octocat" });
  assert.equal(els.user.value, "octocat");
  assert.equal(fetchCalls.length, 1);
  assert.equal(new URL(fetchCalls[0].url).searchParams.get("user"), "octocat");
  assert.equal(els.download.disabled, true);
});

test("the Copy button still copies the generated README snippet", async () => {
  const { els, copied, timers } = setup();
  els.user.value = "vinay";
  els.form.dispatch("input");
  const snippet = els.snippet.textContent;
  assert.match(snippet, /!\[vinay's GitHub farm\]/);
  assert.match(snippet, /api\/farm\?user=vinay/);

  els.copy.dispatch("click");
  await tick();
  assert.deepEqual(copied, [snippet]);
  assert.equal(els.copy.textContent, "Copied!");

  timers.at(-1).fn();
  assert.equal(els.copy.textContent, "Copy");
});

test("the Copy button falls back when the clipboard is unavailable", async () => {
  const { els, timers } = setup({
    clipboard: { writeText: async () => { throw new Error("denied"); } },
  });
  els.copy.dispatch("click");
  await tick();
  assert.equal(els.copy.textContent, "Select & copy");
  timers.at(-1).fn();
  assert.equal(els.copy.textContent, "Copy");
});
