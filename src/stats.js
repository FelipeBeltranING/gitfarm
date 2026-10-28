// Stats derived from the contribution calendar.

/** Days in chronological order, skipping the empty padding cells. */
function days(weeks) {
  return weeks.flat().filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}

const active = (day) => (day.count ?? 0) > 0 || (day.level ?? 0) > 0;

export function computeStats(weeks) {
  const list = days(weeks);
  let longest = 0;
  let run = 0;
  let best = null;
  for (const day of list) {
    run = active(day) ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (!best || (day.count ?? 0) > (best.count ?? 0)) best = day;
  }

  // Current streak: today without commits yet doesn't break it.
  let current = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    if (active(list[i])) current++;
    else if (i === list.length - 1) continue;
    else break;
  }

  return { longestStreak: longest, currentStreak: current, bestDay: best && best.count > 0 ? best : null };
}

// --- Animals ---------------------------------------------------------------

export const CHICKEN_EVERY = 7;
export const MAX_CHICKENS = 3;
export const COW_AT = 30;
export const DOG_AT = 100;

export function unlockedAnimals(streak) {
  return {
    chickens: Math.min(MAX_CHICKENS, Math.floor(streak / CHICKEN_EVERY)),
    cow: streak >= COW_AT,
    dog: streak >= DOG_AT,
  };
}

/** Short hint about the next animal to unlock, or null when everything is unlocked. */
export function nextUnlock(streak) {
  const goals = [];
  for (let k = 1; k <= MAX_CHICKENS; k++) goals.push([k * CHICKEN_EVERY, "a chicken"]);
  goals.push([COW_AT, "a cow"], [DOG_AT, "a dog"]);
  goals.sort((a, b) => a[0] - b[0]);
  const next = goals.find(([at]) => at > streak);
  if (!next) return null;
  const missing = next[0] - streak;
  return `${missing} more day${missing === 1 ? "" : "s"} for ${next[1]}`;
}
