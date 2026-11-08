// Client-side logic for the GitFarm web generator.
// Kept as a module so the URL, filename and download state can be tested in Node.

export const DEFAULTS = { hat: "#efc96d", shirt: "#d9473b", overalls: "#3d72bd" };

// GitHub usernames: alphanumerics and single hyphens, up to 39 chars.
export const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

// All user-facing text lives here. To add a language, add a new key (e.g. `fr`)
// with the same keys as `en`; missing keys fall back to English.
// Keys matching `data-i18n` / `data-i18n-alt` / `data-i18n-content` in index.html fill the static page.
export const TEXTS = {
  en: {
    title: "GitFarm · your contribution graph, but it's a farm",
    description: "A pixel-art farmer plants your GitHub contributions. Type your username, get a farm for your README.",
    tagline: "Your contribution graph, but it's a farm. A pixel-art farmer plants every commit.",
    username: "GitHub username",
    crops: "Crops",
    season: "Season",
    time: "Time",
    weather: "weather",
    dress: "🧑‍🌾 Dress your farmer",
    hat: "Hat",
    shirt: "Shirt",
    overalls: "Overalls",
    plant: "🌱 Plant my farm",
    previewAlt: "GitFarm preview",
    demoStatus: "This is a demo farm. Type your username to plant yours!",
    pasteTitle: "📋 Paste this in your README",
    copy: "Copy",
    copied: "Copied!",
    selectCopy: "Select & copy",
    download: "Download SVG",
    actionTitle: "🚜 Prefer a GitHub Action?",
    actionText: "Generate the farm in your own profile repo every day, with no external service: see the",
    setupGuide: "setup guide",
    animals: "Animals unlock with your longest streak: 🐔 7 days · 🐄 30 days · 🐕 100 days.",
    madeBy: "Made with 🌱 by",
    star: "⭐ Star on GitHub",
    opt_crop_auto: "auto ✨",
    opt_crop_corn: "🌽 corn",
    opt_crop_sunflower: "🌻 sunflower",
    opt_crop_tomato: "🍅 tomato",
    opt_crop_coffee: "☕ coffee",
    opt_crop_wheat: "🌾 wheat",
    opt_crop_strawberry: "🍓 strawberry",
    opt_crop_pumpkin: "🎃 pumpkin",
    opt_crop_cacao: "🍫 cacao",
    opt_crop_carrot: "🥕 carrot",
    opt_crop_rice: "🍚 rice",
    opt_crop_avocado: "🥑 avocado",
    opt_crop_chili: "🌶️ chili",
    opt_crop_grape: "🍇 grape",
    opt_season_none: "none",
    opt_season_auto: "auto (north)",
    "opt_season_auto-south": "auto (south)",
    opt_season_spring: "🌸 spring",
    opt_season_summer: "☀️ summer",
    opt_season_autumn: "🍂 autumn",
    opt_season_winter: "❄️ winter",
    opt_season_rainy: "🌧️ rainy (tropics)",
    opt_season_dry: "🌵 dry (tropics)",
    opt_time_auto: "auto ✨",
    opt_time_day: "☀️ day",
    opt_time_night: "🌙 night",
    planting: "🚜 Planting...",
    ready: "🌻 Here's your farm! It replants itself every few hours.",
    changed: "Your settings changed. Plant again to download the current farm.",
    empty: "🌱 Type a GitHub username to plant your farm.",
    invalidUser: "That doesn't look like a GitHub username. Use letters, numbers and single hyphens.",
    invalidFarm: "Couldn't plant that farm. Check the username and try again.",
    failed: "Something went wrong. Check the username and try again.",
    downloadFailed: "Couldn't download your farm. Please try again.",
    demoFailed: "Couldn't load the demo farm. Check your connection and try again.",
    downloaded: "📥 Downloaded",
    snippetUser: "your-username",
  },
  es: {
    title: "GitFarm · tu gráfico de contribuciones, pero es una granja",
    description: "Un granjero de pixel art planta tus contribuciones de GitHub. Escribe tu usuario y obtén una granja para tu README.",
    tagline: "Tu gráfico de contribuciones, pero es una granja. Un granjero de pixel art planta cada commit.",
    username: "Usuario de GitHub",
    crops: "Cultivos",
    season: "Estación",
    time: "Hora",
    weather: "clima",
    dress: "🧑‍🌾 Viste a tu granjero",
    hat: "Sombrero",
    shirt: "Camisa",
    overalls: "Overol",
    plant: "🌱 Plantar mi granja",
    previewAlt: "Vista previa de GitFarm",
    demoStatus: "Esta es una granja de demostración. ¡Escribe tu usuario para plantar la tuya!",
    pasteTitle: "📋 Pega esto en tu README",
    copy: "Copiar",
    copied: "¡Copiado!",
    selectCopy: "Selecciona y copia",
    download: "Descargar SVG",
    actionTitle: "🚜 ¿Prefieres una GitHub Action?",
    actionText: "Genera la granja cada día en tu propio repositorio de perfil, sin ningún servicio externo: consulta la",
    setupGuide: "guía de instalación",
    animals: "Los animales se desbloquean con tu racha más larga: 🐔 7 días · 🐄 30 días · 🐕 100 días.",
    madeBy: "Hecho con 🌱 por",
    star: "⭐ Dale una estrella en GitHub",
    opt_crop_auto: "automático ✨",
    opt_crop_corn: "🌽 maíz",
    opt_crop_sunflower: "🌻 girasol",
    opt_crop_tomato: "🍅 tomate",
    opt_crop_coffee: "☕ café",
    opt_crop_wheat: "🌾 trigo",
    opt_crop_strawberry: "🍓 fresa",
    opt_crop_pumpkin: "🎃 calabaza",
    opt_crop_cacao: "🍫 cacao",
    opt_crop_carrot: "🥕 zanahoria",
    opt_crop_rice: "🍚 arroz",
    opt_crop_avocado: "🥑 aguacate",
    opt_crop_chili: "🌶️ chile",
    opt_crop_grape: "🍇 uva",
    opt_season_none: "ninguna",
    opt_season_auto: "automática (norte)",
    "opt_season_auto-south": "automática (sur)",
    opt_season_spring: "🌸 primavera",
    opt_season_summer: "☀️ verano",
    opt_season_autumn: "🍂 otoño",
    opt_season_winter: "❄️ invierno",
    opt_season_rainy: "🌧️ lluviosa (trópico)",
    opt_season_dry: "🌵 seca (trópico)",
    opt_time_auto: "automática ✨",
    opt_time_day: "☀️ día",
    opt_time_night: "🌙 noche",
    planting: "🚜 Plantando...",
    ready: "🌻 ¡Aquí está tu granja! Se vuelve a plantar sola cada pocas horas.",
    changed: "Cambiaste la configuración. Vuelve a plantar para descargar la granja actual.",
    empty: "🌱 Escribe un usuario de GitHub para plantar tu granja.",
    invalidUser: "Eso no parece un usuario de GitHub. Usa letras, números y guiones simples.",
    invalidFarm: "No se pudo plantar esa granja. Revisa el usuario e inténtalo de nuevo.",
    failed: "Algo salió mal. Revisa el usuario e inténtalo de nuevo.",
    downloadFailed: "No se pudo descargar tu granja. Inténtalo de nuevo.",
    demoFailed: "No se pudo cargar la granja de demostración. Revisa tu conexión e inténtalo de nuevo.",
    downloaded: "📥 Descargado",
    snippetUser: "tu-usuario",
  },
};

/** Pick a language from navigator.language: anything starting with "es" is Spanish, otherwise English. */
export function pickLanguage(language) {
  return /^es(?:[-_]|$)/i.test(String(language ?? "")) ? "es" : "en";
}

/** Texts for a language, falling back to English for any missing key. */
export function textsFor(lang) {
  return { ...TEXTS.en, ...TEXTS[lang] };
}

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
  const lang = pickLanguage(navigatorObject?.language);
  const t = textsFor(lang);
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

  // English is already in the HTML, so only other languages need the static text swapped.
  if (lang !== "en" && document.querySelectorAll) {
    document.documentElement.lang = lang;
    const set = (selector, attr, apply) => {
      for (const el of document.querySelectorAll(selector)) {
        const text = t[el.getAttribute(attr)];
        if (text !== undefined) apply(el, text);
      }
    };
    set("[data-i18n]", "data-i18n", (el, text) => { el.textContent = text; });
    set("[data-i18n-alt]", "data-i18n-alt", (el, text) => { el.alt = text; });
    set("[data-i18n-content]", "data-i18n-content", (el, text) => { el.content = text; });
  }

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
    const user = currentUser() || t.snippetUser;
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
      setStatus(t.ready);
    } else {
      loaded = null;
      setStatus(t.changed);
    }
    syncDownload();
  }

  async function validate(req) {
    try {
      const res = await fetchFarm(req.url);
      const svg = await res.text();
      if (request !== req || req.done) return;
      if (!res.ok || isFarmErrorSvg(svg)) return fail(req, t.invalidFarm);
      req.svg = svg;
      settle(req);
    } catch {
      fail(req, t.failed);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = currentUser();
    if (!user) {
      request = null;
      loading = false;
      loaded = null;
      setStatus(t.empty);
      syncDownload();
      return;
    }
    if (!USERNAME.test(user)) {
      request = null;
      loading = false;
      loaded = null;
      setStatus(t.invalidUser);
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
    setStatus(t.planting);
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
      if (!currentUser()) setStatus(t.demoFailed);
      return;
    }
    fail(request, t.failed);
  });

  function onEdit() {
    showSnippet();
    if (loading) {
      syncDownload();
      return;
    }
    if (loaded) {
      setStatus(currentUser() === loaded.user && currentUrl() === loaded.url ? t.ready : t.changed);
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
      setStatus(`${t.downloaded} ${filename}`);
    } catch {
      setStatus(t.downloadFailed);
    }
  });

  copy.addEventListener("click", async () => {
    try {
      await navigatorObject.clipboard.writeText(snippet.textContent);
      copy.textContent = t.copied;
    } catch {
      copy.textContent = t.selectCopy;
    }
    defer(() => { copy.textContent = t.copy; }, 1500);
  });

  const initial = new URLSearchParams(location.search).get("user");
  if (initial) {
    userInput.value = initial;
    form.requestSubmit();
  } else {
    showSnippet();
    syncDownload();
  }
}

if (typeof document !== "undefined") {
  createFarmApp({
    document,
    location: globalThis.location,
    history: globalThis.history,
    fetch: (...args) => globalThis.fetch(...args),
  });
}
