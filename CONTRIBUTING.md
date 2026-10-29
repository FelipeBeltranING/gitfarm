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

## Rules of the SVG

- **No JavaScript.** GitHub strips scripts from images, so everything is CSS keyframes.
- **Deterministic.** Use the `hash()` helper instead of `Math.random()`, so the farm doesn't
  change on every run.
- **Mind the size.** The SVG is downloaded on every profile view; keep it under ~300 KB.

## Code style

Plain modern JavaScript (ES modules), 2 spaces, double quotes. Keep functions small and add a
test in `test/` for any logic you add.

## Ideas

Check the [issues](https://github.com/FelipeBeltranING/gitfarm/issues), especially the ones
labelled `good first issue`. Have an idea? Open an issue and let's talk about it!
