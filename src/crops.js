// Which crop grows on your farm depends on your most-used language.
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

export function cropForLanguage(language) {
  return LANGUAGE_CROPS[language] ?? "wheat";
}
