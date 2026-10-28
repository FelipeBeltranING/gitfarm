// Which crop grows on your farm depends on the languages you use.
const LANGUAGE_CROPS = {
  Python: "corn",
  "Jupyter Notebook": "corn",
  JavaScript: "sunflower",
  TypeScript: "sunflower",
  HTML: "sunflower",
  CSS: "sunflower",
  Vue: "sunflower",
  Svelte: "sunflower",
  Rust: "tomato",
  Go: "tomato",
  Ruby: "tomato",
  PHP: "tomato",
  C: "coffee",
  "C++": "coffee",
  "C#": "coffee",
  Java: "coffee",
  Kotlin: "coffee",
  Swift: "coffee",
};

export const CROP_NAMES = ["corn", "sunflower", "tomato", "coffee", "wheat"];

export const MIN_SHARE = 0.15;
export const MAX_CROPS = 3;

export function cropForLanguage(language) {
  return LANGUAGE_CROPS[language] ?? "wheat";
}

/**
 * Turn language shares into up to 3 crops, merging languages that grow the same crop.
 * @param {{language:string, share:number}[]} languages
 * @returns {{crop:string, share:number, language:string}[]} sorted by share, shares sum to 1
 */
export function mixCrops(languages) {
  if (!languages?.length) return [{ crop: "wheat", share: 1, language: null }];
  const byCrop = new Map();
  for (const { language, share } of languages) {
    const crop = cropForLanguage(language);
    const entry = byCrop.get(crop) ?? { crop, share: 0, language };
    entry.share += share;
    byCrop.set(crop, entry);
  }
  const total = [...byCrop.values()].reduce((s, e) => s + e.share, 0) || 1;
  let mix = [...byCrop.values()]
    .map((e) => ({ ...e, share: e.share / total }))
    .sort((a, b) => b.share - a.share)
    .filter((e, i) => i === 0 || e.share >= MIN_SHARE)
    .slice(0, MAX_CROPS);
  const kept = mix.reduce((s, e) => s + e.share, 0);
  mix = mix.map((e) => ({ ...e, share: e.share / kept }));
  return mix;
}

/** "corn" or "corn,tomato" → equal shares. */
export function parseCropList(value) {
  const crops = String(value).split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  for (const c of crops) {
    if (!CROP_NAMES.includes(c)) throw new Error(`Unknown crop "${c}". Choose from: ${CROP_NAMES.join(", ")}`);
  }
  const unique = [...new Set(crops)].slice(0, MAX_CROPS);
  return unique.map((crop) => ({ crop, share: 1 / unique.length, language: null }));
}
