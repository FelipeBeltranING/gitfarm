// Serverless endpoint (Vercel): GET /api/farm?user=octocat&crop=auto&season=none&time=auto
// Returns the farm SVG, cached at the edge so GitHub's image proxy can embed it.
import { buildFarm, parseBool } from "../src/farm.js";

// GitHub usernames: alphanumerics and single hyphens, up to 39 chars.
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

function errorSvg(message) {
  const safe = String(message).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`).slice(0, 90);
  const w = Math.max(300, safe.length * 7 + 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 60" width="${w}" height="60">` +
    `<rect width="${w}" height="60" rx="8" fill="#3d7530"/><rect x="10" y="10" width="${w - 20}" height="40" rx="3" fill="#5e3820"/>` +
    `<rect x="12" y="12" width="${w - 24}" height="36" rx="2" fill="#9a6338"/>` +
    `<text x="${w / 2}" y="35" text-anchor="middle" font-family="'Courier New',monospace" font-weight="bold" font-size="12" fill="#fff3d1">🌾 ${safe}</text></svg>`;
}

function send(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.end(body);
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const demo = parseBool(q.demo, false);
  const user = String(q.user ?? "").trim();

  if (!demo && !USERNAME.test(user)) {
    return send(res, 400, errorSvg("Add ?user=your-github-username"), "public, max-age=300");
  }

  try {
    const { svg } = await buildFarm({
      user: user || "octocat",
      token: process.env.GITHUB_TOKEN,
      demo: demo ? 7 : false,
      crop: q.crop || (demo ? "corn,sunflower,tomato" : "auto"),
      season: q.season || "none",
      time: q.time || "auto",
      timezone: q.timezone || "UTC",
      weather: parseBool(q.weather, true),
      farmer: { hat: q.hat || undefined, shirt: q.shirt || undefined, overalls: q.overalls || undefined },
      streak: demo && q.streak ? Number(q.streak) : undefined,
    });
    // Contributions change during the day; refresh every few hours, serve stale while revalidating.
    return send(res, 200, svg, "public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400");
  } catch (e) {
    const message = /fetch failed|ENOTFOUND|ETIMEDOUT/i.test(e.message) ? "Could not reach GitHub, try again in a minute" : e.message;
    return send(res, 200, errorSvg(message), "public, max-age=300");
  }
}
