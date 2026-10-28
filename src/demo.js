// Fake but believable contribution calendar for previews and tests.
export function demoCalendar(seed = 42, today = new Date()) {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    return s / 4294967296;
  };

  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay()); // align to Sunday

  const weeks = [];
  let total = 0;
  let mood = 0.5; // slowly drifting "motivation" creates streaks and slumps
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0) weeks.push(new Array(7).fill(null));
    mood = Math.min(1, Math.max(0, mood + (rand() - 0.5) * 0.25));
    const weekend = wd === 0 || wd === 6 ? 0.55 : 1;
    const p = mood * weekend;
    const count = rand() < p ? Math.floor(rand() * 14 * p) + 1 : 0;
    total += count;
    weeks[weeks.length - 1][wd] = { date: d.toISOString().slice(0, 10), count };
  }
  return { total, weeks: withLevels(weeks) };
}

// Same idea as GitHub's quartile-based levels.
export function withLevels(weeks) {
  const counts = weeks.flat().filter(Boolean).map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (f) => counts[Math.floor((counts.length - 1) * f)] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return weeks.map((week) => week.map((day) => {
    if (!day) return null;
    const c = day.count;
    const level = c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4;
    return { ...day, level: day.level ?? level };
  }));
}
