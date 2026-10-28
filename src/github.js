import { withLevels } from "./demo.js";

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const UA = { "User-Agent": "gitfarm" };

async function graphql(query, variables, token) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...UA, Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors ?? json.message ?? res.status)}`);
  }
  return json.data;
}

/** Returns { total, weeks: weeks[w][weekday] = {date, count, level} | null } */
export async function fetchCalendar(user, token) {
  if (token) {
    const data = await graphql(
      `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
        totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}`,
      { login: user },
      token,
    );
    if (!data.user) throw new Error(`GitHub user "${user}" not found.`);
    const cal = data.user.contributionsCollection.contributionCalendar;
    const weeks = cal.weeks.map((w) => {
      const days = new Array(7).fill(null);
      for (const d of w.contributionDays) {
        days[d.weekday] = { date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 };
      }
      return days;
    });
    return { total: cal.totalContributions, weeks };
  }
  return scrapeCalendar(user);
}

// Token-free fallback: the public contributions fragment GitHub renders on profiles.
async function scrapeCalendar(user) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(user)}/contributions`, { headers: UA });
  if (!res.ok) throw new Error(`Could not load contributions for "${user}" (HTTP ${res.status}).`);
  const html = await res.text();

  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^([\d,]+) contribution/);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days = [];
  for (const m of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = tag.match(/id="([^"]+)"/)?.[1];
    if (date) days.push({ date, level, count: counts.get(id) ?? (level > 0 ? 1 : 0) });
  }
  if (!days.length) throw new Error("Could not parse the contribution calendar (GitHub markup may have changed). Try passing a token.");

  days.sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const firstSunday = new Date(first);
  firstSunday.setUTCDate(first.getUTCDate() - first.getUTCDay());

  const weeks = [];
  for (const day of days) {
    const dt = new Date(`${day.date}T00:00:00Z`);
    const w = Math.floor((dt - firstSunday) / (7 * 86400000));
    while (weeks.length <= w) weeks.push(new Array(7).fill(null));
    weeks[w][dt.getUTCDay()] = day;
  }

  const totalMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : days.reduce((s, d) => s + d.count, 0);
  return { total, weeks: withLevels(weeks) };
}

/** Most-used language across the user's own (non-fork) repos. */
export async function fetchTopLanguage(user, token) {
  const tally = new Map();
  if (token) {
    const data = await graphql(
      `query($login:String!){user(login:$login){repositories(first:100,ownerAffiliations:OWNER,isFork:false,orderBy:{field:PUSHED_AT,direction:DESC}){
        nodes{languages(first:5,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}}}`,
      { login: user },
      token,
    );
    for (const repo of data.user?.repositories.nodes ?? []) {
      for (const e of repo.languages.edges) tally.set(e.node.name, (tally.get(e.node.name) ?? 0) + e.size);
    }
  } else {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, { headers: UA });
    if (!res.ok) return null;
    for (const repo of await res.json()) {
      if (!repo.fork && repo.language) tally.set(repo.language, (tally.get(repo.language) ?? 0) + 1);
    }
  }
  let best = null;
  for (const [lang, n] of tally) if (!best || n > best[1]) best = [lang, n];
  return best?.[0] ?? null;
}
