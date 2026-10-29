// Client-side logic for the GitFarm web generator.
// Kept as a module so the URL, filename and download state can be tested in Node.

export const DEFAULTS = { hat: "#efc96d", shirt: "#d9473b", overalls: "#3d72bd" };

// GitHub usernames: alphanumerics and single hyphens, up to 39 chars.
export const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

const STATUS = {
  planting: "🚜 Planting...",
  ready: "🌻 Here's your farm! It replants itself every few hours.",
  changed: "Your settings changed. Plant again to download the current farm.",
  empty: "🌱 Type a GitHub username to plant your farm.",
  invalidUser: "That doesn't look like a GitHub username. Use letters, numbers and single hyphens.",
  invalidFarm: "Couldn't plant that farm. Check the username and try again.",
  failed: "Something went wrong. Check the username and try again.",
  downloadFailed: "Couldn't download your farm. Please try again.",
};

/** Turn a username into a safe file name, e.g. "vinay" → "vinay-farm.svg". */
export function safeFilename(user) {
  const safe = String(user ?? "")
    .trim()
    .replace(/[^a-z\d-]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 39);
  return `${safe || "gitfarm"}-farm.svg`;
}

/** Build the farm URL for the given form values, omitting defaults like the page always has. */
export function buildFarmUrl(baseHref, options) {
  const { user, crop, season, time, weather, hat, shirt, overalls } = options;
  const p = new URLSearchParams({ user: String(user ?? "").trim() });
  for (const [key, fallback] of [["crop", "auto"], ["season", "none"], ["time", "auto"]]) {
    const value = options[key] ?? fallback;
    if (value !== fallback) p.set(key, value);
  }
  if (weather === false) p.set("weather", "false");
  for (const [key, value] of [["hat", hat], ["shirt", shirt], ["overalls", overalls]]) {
    if (value && value !== DEFAULTS[key]) p.set(key, value);
  }
  return new URL(`api/farm?${p}`, baseHref).href;
}

/** Error images from the API carry this marker so the page never offers them as a download. */
export function isFarmErrorSvg(svg) {
  return /<svg[^>]*\sdata-gitfarm-error(?:\s|=|>)/.test(svg);
}

export function createFarmApp({
  document,
  location,
  history,
  fetch: fetchFarm,
  navigator: navigatorObject = globalThis.navigator,
  setTimeout: defer = globalThis.setTimeout,
  createObjectURL = (blob) => URL.createObjectURL(blob),
  revokeObjectURL = (url) => URL.revokeObjectURL(url),
}) {
  const $ = (id) => document.getElementById(id);
  const form = $("form");
  const userInput = $("user");
  const farm = $("farm");
  const status = $("status");
  const snippet = $("snippet");
  const copy = $("copy");
  const download = $("download");

  let request = null;
  let loading = false;
  let loaded = null;

  const currentUser = () => userInput.value.trim();

  function readOptions() {
    return {
      crop: $("crop").value,
      season: $("season").value,
      time: $("time").value,
      weather: $("weather").checked,
      hat: $("hat").value,
      shirt: $("shirt").value,
      overalls: $("overalls").value,
    };
  }

  function currentUrl(user = currentUser()) {
    return buildFarmUrl(location.href, { ...readOptions(), user });
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function syncDownload() {
    const matches = !loading && loaded &&
      currentUser() === loaded.user && currentUrl() === loaded.url;
    download.disabled = !matches;
  }

  function showSnippet() {
    const user = currentUser() || "your-username";
    snippet.textContent = `![${user}'s GitHub farm](${currentUrl(user)})`;
  }

  function fail(req, message) {
    if (request !== req || req.done) return;
    req.done = true;
    req.failed = true;
    loading = false;
    loaded = null;
    setStatus(message);
    syncDownload();
  }

  function settle(req) {
    if (request !== req || req.done || req.failed || !req.imageLoaded || !req.svg) return;
    req.done = true;
    loading = false;
    if (currentUser() === req.user && currentUrl() === req.url) {
      loaded = { user: req.user, url: req.url, svg: req.svg };
      setStatus(STATUS.ready);
    } else {
      loaded = null;
      setStatus(STATUS.changed);
    }
    syncDownload();
  }

  async function validate(req) {
    try {
      const res = await fetchFarm(req.url);
      const svg = await res.text();
      if (request !== req || req.done) return;
      if (!res.ok || isFarmErrorSvg(svg)) return fail(req, STATUS.invalidFarm);
      req.svg = svg;
      settle(req);
    } catch {
      fail(req, STATUS.failed);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = currentUser();
    if (!user) {
      request = null;
      loading = false;
      loaded = null;
      setStatus(STATUS.empty);
      syncDownload();
      return;
    }
    if (!USERNAME.test(user)) {
      request = null;
      loading = false;
      loaded = null;
      setStatus(STATUS.invalidUser);
      syncDownload();
      return;
    }

    const req = {
      user,
      url: currentUrl(user),
      imageLoaded: false,
      svg: null,
      failed: false,
      done: false,
    };
    request = req;
    loading = true;
    loaded = null;
    syncDownload();
    setStatus(STATUS.planting);
    // Re-submitting the same farm may not fire a new load event.
    const alreadyLoaded = farm.src === req.url && farm.complete && farm.naturalWidth > 0;
    farm.src = req.url;
    if (alreadyLoaded) req.imageLoaded = true;
    showSnippet();
    history.replaceState(null, "", `?user=${encodeURIComponent(user)}`);
    validate(req);
  });

  farm.addEventListener("load", () => {
    if (!request || request.done || farm.src !== request.url) return;
    request.imageLoaded = true;
    settle(request);
  });

  farm.addEventListener("error", () => {
    if (!request) {
      if (!currentUser()) setStatus("Couldn't load the demo farm. Check your connection and try again.");
      return;
    }
    fail(request, STATUS.failed);
  });

  function onEdit() {
    showSnippet();
    if (loading) {
      syncDownload();
      return;
    }
    if (loaded) {
      setStatus(currentUser() === loaded.user && currentUrl() === loaded.url ? STATUS.ready : STATUS.changed);
    }
    syncDownload();
  }

  form.addEventListener("input", onEdit);
  form.addEventListener("change", onEdit);

  download.addEventListener("click", () => {
    const user = currentUser();
    if (download.disabled || !loaded || !user ||
      loaded.user !== user || loaded.url !== currentUrl(user)) {
      syncDownload();
      return;
    }
    const filename = safeFilename(user);
    try {
      const blob = new Blob([loaded.svg], { type: "image/svg+xml;charset=utf-8" });
      const href = createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      defer(() => revokeObjectURL(href), 0);
      setStatus(`📥 Downloaded ${filename}`);
    } catch {
      setStatus(STATUS.downloadFailed);
    }
  });

  copy.addEventListener("click", async () => {
    try {
      await navigatorObject.clipboard.writeText(snippet.textContent);
      copy.textContent = "Copied!";
    } catch {
      copy.textContent = "Select & copy";
    }
    defer(() => { copy.textContent = "Copy"; }, 1500);
  });

  const initial = new URLSearchParams(location.search).get("user");
  if (initial) {
    userInput.value = initial;
    form.requestSubmit();
  } else {
    showSnippet();
    syncDownload();
  }

  return { currentUrl, showSnippet, syncDownload };
}

if (typeof document !== "undefined") {
  createFarmApp({
    document,
    location: globalThis.location,
    history: globalThis.history,
    fetch: (...args) => globalThis.fetch(...args),
  });
}
