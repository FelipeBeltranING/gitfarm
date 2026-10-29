<div align="center">

# 🌻 GitFarm

**Your contribution graph, but it's a farm.**
A little pixel-art farmer walks your last year of GitHub activity, tills every day,
and plants a crop wherever you committed. The more you code, the bigger the harvest.

<img src="examples/demo.svg" alt="GitFarm demo: a farmer planting corn, sunflowers and tomatoes over a contribution graph" width="100%">

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-GitFarm-green?logo=github)](https://github.com/marketplace/actions/gitfarm-contribution-farm)

**[🌐 Try it in your browser](https://gitfarm-nu.vercel.app)** · **[🚜 Use the GitHub Action](#plant-your-own-farm-2-minutes)** · **[🎞️ Share it as a video](#share-it-as-a-video)**

</div>

## How it grows

**The more you contribute in a day, the taller that day's plant grows**, so your farm reads like a bar chart
of crops. Each plant is measured against your own year, not someone else's:

| Your day | On the farm |
| --- | --- |
| No contributions | Clean tilled soil |
| A few | A sprout 🌱, then a small plant |
| More | A crop that grows taller with every extra contribution |
| Your top ~5% days | Full harvest at full height, with a sparkle ✨, and the farmer waters it 🚿 |

The full-harvest line sits a bit below your best day (the 95th percentile of the days you contributed),
so you get several full harvests a year, and one huge outlier day can't flatten the rest of your farm.

Your crops depend on the languages you use. If you code in several, your field mixes up to 3 crops
in proportion (languages under 15% are left out):

| Language | Crop |
| --- | --- |
| Python, Jupyter | 🌽 Corn |
| JavaScript, TypeScript, HTML, CSS, Vue, Svelte | 🌻 Sunflower |
| Rust, Go, Ruby | 🍅 Tomato |
| PHP | 🥑 Avocado |
| C, C++, C#, Java | ☕ Coffee |
| Kotlin, Swift, Dart, Objective-C | 🍓 Strawberry |
| Lua, GDScript, Haxe, shaders | 🎃 Pumpkin |
| R, Julia, MATLAB, Fortran | 🍫 Cacao |
| Haskell, Elixir, Erlang, Scala, Clojure, OCaml, F#, Elm | 🥕 Carrot |
| Shell, PowerShell, Dockerfile, HCL, Nix, Makefile | 🍚 Rice |
| Everything else | 🌾 Wheat |

Don't like your crops? Pick them yourself with `crop: tomato` or `crop: corn,coffee`.

## Animals 🐔🐄🐕

Your **longest streak of the year** unlocks animals. They live in the pasture below the field,
and a little sign tells you how many days you need for the next one.

| Best streak | Unlocks |
| --- | --- |
| 7 days | 🐔 A chicken (one more every 7 days, up to 3) |
| 30 days | 🐄 A cow |
| 100 days | 🐕 A dog that follows the farmer around |

Longest streak, not current: breaking your streak never takes your animals away.

## Around the farm

- 🪧 **The sign** shows your total, your crop, your current streak and your best day.
- 🎃 **Your best day of the year** gets a golden plot, and a scarecrow stands on the fence above it with a little sign showing the count.
- 🏠 **Your building grows** with your contributions in the last year:

  | Contributions | Building |
  | --- | --- |
  | Less than 100 | A small shack |
  | 100 – 999 | A red barn |
  | 1,000+ | A red barn with a silo |

- 🧺 **Harvest counter:** when the farmer finishes, a speech bubble counts up your contributions.
- 🐦 **Birds** visit the fence, a different flock every day: they peck, hop and look around, flee when the farmer gets close, and some land again behind him.
- 🐱 **A cat** naps on the barn roof while your current streak is 3 days or more.
- 🚿 **Watering:** the farmer stops on your full-harvest days (up to 12) and waters them.

## Seasons, weather and time of day

| Option | Values | What you get |
| --- | --- | --- |
| `season` | `none` (default), `spring`, `summer`, `autumn`, `winter`, `rainy`, `dry` | Spring flowers, falling autumn leaves, snow, puddles in the rainy season, a yellow dry season |
| | `auto` / `auto-south` | Follows the calendar in the northern / southern hemisphere |
| `time` | `auto` (default), `day`, `night` | Night owls (40%+ of activity between 20:00 and 05:00) get a night farm with a moon and fireflies |
| `timezone` | `UTC` (default) or any IANA zone, e.g. `America/Bogota` | Used by `time: auto` |
| `weather` | `true` (default) / `false` | Cloud shadows drifting over the field and the occasional shower |

Living in the tropics? `rainy` and `dry` are made for you 🌴

## Dress your farmer

```yaml
farmer_hat: "#efc96d"
farmer_shirt: "#d9473b"
farmer_overalls: "#3d72bd"
```

## Web generator

No setup at all: go to **[gitfarm-nu.vercel.app](https://gitfarm-nu.vercel.app)**, type your username, pick your options and copy the Markdown line into your README.
The image is generated on the fly and refreshed every few hours.

```md
![My GitHub farm](https://gitfarm-nu.vercel.app/api/farm?user=your-username&season=auto)
```

All the options below work as query parameters (`crop`, `season`, `time`, `timezone`, `weather`,
`hat`, `shirt`, `overalls`).

**Deploy your own** (free on Vercel): import this repo at [vercel.com/new](https://vercel.com/new),
optionally add a `GITHUB_TOKEN` environment variable for higher API limits, and you're done.
Locally: `npm run dev` → <http://localhost:3000>.

## Plant your own farm (2 minutes)

**1.** In your profile repo (`your-username/your-username`), create `.github/workflows/farm.yml`:

```yaml
name: Plant my farm

on:
  schedule:
    - cron: "17 3 * * *" # every day
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  farm:
    runs-on: ubuntu-latest
    steps:
      - uses: FelipeBeltranING/gitfarm@v1
        with:
          github_user_name: ${{ github.repository_owner }}
          output: dist/farm.svg
          # crop: auto            # or corn, sunflower, tomato, coffee, avocado, wheat (comma separated)
          # season: auto          # or none, spring, summer, autumn, winter, rainy, dry, auto-south
          # time: auto            # or day, night
          # timezone: America/Bogota

      - uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**2.** Run it once from the **Actions** tab (or wait for the daily run).

**3.** Add this to your `README.md`:

```md
![My GitHub farm](https://raw.githubusercontent.com/your-username/your-username/output/farm.svg)
```

That's it. Your farm replants itself every day.

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `github_user_name` | repo owner | Whose contributions grow on the farm |
| `github_token` | `github.token` | Used to read the contribution calendar |
| `output` | `dist/farm.svg` | Where the SVG is written |
| `crop` | `auto` | `auto` (mix of your languages) or a comma-separated list: `corn`, `sunflower`, `tomato`, `coffee`, `avocado`, `wheat` |
| `season` | `none` | `none`, `spring`, `summer`, `autumn`, `winter`, `rainy`, `dry`, `auto`, `auto-south` |
| `time` | `auto` | `auto`, `day` or `night` |
| `timezone` | `UTC` | IANA time zone used by `time: auto` |
| `weather` | `true` | Clouds and showers |
| `farmer_hat` / `farmer_shirt` / `farmer_overalls` | classic farmer | Hex colors |

## Run it locally

No dependencies, just Node 20+:

```bash
node src/cli.js --user your-username --out farm.svg          # real data (token optional: --token or GITHUB_TOKEN)
node src/cli.js --demo --user octocat --crop corn --out demo.svg  # fake data, no network
node src/cli.js --demo --user octocat --streak 100 --out demo.svg # preview all animals
node src/cli.js --demo --season winter --time night --out demo.svg # try a theme
node src/cli.js --help                                             # all options
```

## Share it as a video

SVGs don't play on Reddit, X or Discord, so you can record your farm as an MP4 or a GIF:

```bash
npm install && npx playwright install chromium   # once
node tools/record.mjs farm.svg --out farm.mp4     # or farm.gif (--fps, --width, --seconds)
```

Needs [ffmpeg](https://ffmpeg.org/download.html) on your PATH.

## Contributing

PRs are very welcome, especially new crops and animals (it's just pixel art in `src/sprites.js`).
Read the [contributing guide](CONTRIBUTING.md) and check the [issues](../../issues) labelled `good first issue`.

```bash
npm test        # node:test, no dependencies
npm run demo    # regenerate examples/demo.svg
```

## How it works

The SVG is pure pixel art drawn with `<rect>`s, animated with CSS keyframes only (no JavaScript),
so it renders inside GitHub READMEs. Each plot gets a keyframe for the moment the farmer reaches it,
and the whole field fades and replants in a loop.

## Ideas / roadmap

See the [issues](../../issues) for what's planned next. More crops and animals are always welcome!

## License

MIT © David Felipe Beltrán Tabares
