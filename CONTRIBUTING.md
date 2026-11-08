# Contributing to GitFarm 🌱

Thanks for wanting to help the farm grow! The easiest (and most fun) way to contribute
is **pixel art**: new crops, animals or buildings. No deep JavaScript needed.

## Setup

You only need Node 20+. There are no runtime dependencies.

```bash
git clone https://github.com/FelipeBeltranING/gitfarm.git
cd gitfarm
npm test                     # run the tests
npm run demo                 # regenerate examples/demo.svg
node src/cli.js --help       # all CLI options
npm run dev                  # web generator on http://localhost:3000
```

Open any generated `.svg` in your browser to watch the animation.

## Add a crop 🌽

Each crop is two 8×8 pixel grids in [`src/sprites.js`](src/sprites.js): `grown` (busy days)
and `harvest` (your best ones). Plants get taller on busier days: `src/growth.js` repeats the
lowest thin stalk row of your sprite (the trunk), so keep a 1–4 pixel wide stalk row near the bottom. Every character is a color from `PALETTE`,
and `.` is transparent:

```js
pumpkin: {
  name: "pumpkin",
  grown: [
    "........",
    "........",
    "...lL...",
    "..lLLl..",
    ".lLDLLl.",
    "..LDDl..",
    ".lDLLDl.",
    "..DDDD..",
  ],
  harvest: [
    "...D....",
    "...Dl...",
    "..lD.l..",
    ".11211..",
    "1121121.",
    "1121121.",
    "1121121.",
    ".12112..",
  ],
},
```

1. Add your crop to `CROPS` in `src/sprites.js`. Need a new color? Add a key to `PALETTE`
   (any unused character works, digits included).
2. Add it to `CROP_NAMES` in `src/crops.js` and map some languages to it in `LANGUAGE_CROPS`.
3. Preview it: `node src/cli.js --demo --crop yourcrop --out demo.svg`
4. Add it to the crop table in the README and to the `<select>` in `public/index.html`.
5. Run `npm test` (it checks that every crop is 8×8 and only uses palette colors).
6. Open a PR with a screenshot of your crop. 📸

**Tips:** keep the base of the plant on the bottom rows so it sits on the soil, use a darker
shade on one side for volume, and check it at real size: sprites are tiny on a README!

## Add an animal or a building 🐄

Animals live in the pasture and are drawn with `footDef` in `src/render.js`, which anchors the
sprite at the middle of its feet so it can walk and flip. Look at how the chicken is added
(`CHICKEN_A`, `CHICKEN_B` and the `wander()` helper). If your animal unlocks with something
new, add the rule to `src/stats.js` with a test.

## Add a seasonal touch 🍂

Each season in [`src/themes.js`](src/themes.js) is a palette plus a few flags (`flowers`,
`puddles`, `particles`). To add something that only shows up in one season:

1. Reuse a flag, or add a new one to that season in `src/themes.js`.
2. Draw it in `src/render.js` (search for `theme.flowers` or `theme.puddles` to see how the others
   are placed) and pick its spots with `hash()`, so they're the same on every run.
3. Add a test in `test/render.test.js` that checks it shows up in that season and not in the others.
4. Preview it: `node src/cli.js --demo --season rainy --out demo.svg`

## Rules of the SVG

- **No JavaScript.** GitHub strips scripts from images, so everything is CSS keyframes.
- **Deterministic.** Use the `hash()` helper instead of `Math.random()`, so the farm doesn't
  change on every run.
- **Reduced motion.** Under `prefers-reduced-motion` all animations stop and the farm is shown
  finished. If you animate something new, check how it looks still: anything that moves along a
  keyframe path needs a position in `stillCss` in `src/render.js`, or it ends up in the corner.
- **Mind the size.** The SVG is downloaded on every profile view; keep it under ~300 KB.

## Code style

Plain modern JavaScript (ES modules), 2 spaces, double quotes. Keep functions small and add a
test in `test/` for any logic you add.

## Before you open a PR ✅

- [ ] `npm test` passes.
- [ ] You previewed it with the CLI (`--demo` plus the `--season`, `--time` or `--streak` it needs).
- [ ] It looks right standing still: in Chrome DevTools, open **Rendering** and set
      *Emulate CSS media feature prefers-reduced-motion* to `reduce`.
- [ ] The PR has a screenshot or a short GIF (`node tools/record.mjs demo.svg --out demo.gif`)
      and links its issue (`Closes #18`).

## What to work on

The [issues](https://github.com/FelipeBeltranING/gitfarm/issues) are the roadmap. Pick one by label:

| Label | What you'll do |
| --- | --- |
| [`good first issue`](https://github.com/FelipeBeltranING/gitfarm/labels/good%20first%20issue) | Small and well described, usually a new crop or animal. Perfect for a first PR. |
| [`pixel-art`](https://github.com/FelipeBeltranING/gitfarm/labels/pixel-art) | Mostly drawing sprites, very little JavaScript. |
| [`help wanted`](https://github.com/FelipeBeltranING/gitfarm/labels/help%20wanted) | Bigger features with CSS animation. |

Comment on the issue before you start, so nobody duplicates work.

### More ideas up for grabs

These don't have an issue yet. Open one to claim it, or to propose your own:

- 🌾 **A crop for a language that still grows wheat**: Solidity, Nim, Gleam, Groovy, TeX, COBOL...
- 🐴 **A horse for a 200-day streak**, so long streaks keep unlocking something after the dog.
- 🦉 **An owl on the fence at night** that turns its head now and then.
- ⛄ **A snowman next to the barn in winter.**
- 🐝 **Bees buzzing around the harvest plots in summer.**
- 🌈 **A rainbow after the shower** when `weather` is on.
- 🌍 **The web generator in your language**: add a block to `TEXTS` in `public/app.js` (copy the
  `es` one) and teach `pickLanguage()` to choose it.
