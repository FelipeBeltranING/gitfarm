// How tall each day's plant grows.
//
// A plant's height is proportional to that day's contributions, measured
// against a "harvest cap" a bit below your best day: the 95th percentile of
// the days you contributed. Your top ~5% days all reach the golden harvest,
// and one huge outlier day can't flatten the rest of the farm.

export const STEM_MAX = 7; // extra stem rows (in sprite pixels) at full height
const GOLDEN_SHARE = 0.95;

const amount = (day) => (day ? (day.count ?? day.level ?? 0) : 0);

/** Contributions needed for a golden harvest. */
export function harvestCap(weeks) {
  const counts = weeks.flat().map(amount).filter((c) => c > 0).sort((a, b) => a - b);
  if (!counts.length) return 1;
  return Math.max(1, counts[Math.floor((counts.length - 1) * GOLDEN_SHARE)]);
}

/**
 * What grows on a plot.
 * @returns {{stage:"empty"|"sprout"|"small"|"grown"|"harvest", stem:number, golden:boolean, ratio:number}}
 */
export function plantFor(count, cap) {
  if (!count || count <= 0) return { stage: "empty", stem: 0, golden: false, ratio: 0 };
  const ratio = Math.min(1, count / cap);
  if (ratio < 0.15) return { stage: "sprout", stem: 0, golden: false, ratio };
  if (ratio < 0.3) return { stage: "small", stem: 0, golden: false, ratio };
  const stem = Math.round(((ratio - 0.3) / 0.7) * STEM_MAX);
  return { stage: ratio >= 0.75 ? "harvest" : "grown", stem, golden: ratio >= 1, ratio };
}

export const dayAmount = amount;

// --- Taller sprites ---------------------------------------------------------

const STEM_CHARS = new Set(["L", "l", "D", "d", "m", "V", "W", "."]);

/** The row that gets repeated to make a plant taller: the lowest thin stalk row. */
export function stemRowIndex(rows) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const solid = [...row].filter((ch) => ch !== ".").length;
    if (solid >= 1 && solid <= 4 && [...row].every((ch) => STEM_CHARS.has(ch))) return i;
  }
  return rows.length - 1;
}

/** Insert `extra` stalk rows (with alternating leaves) into an 8×8 crop sprite. */
export function stretchSprite(rows, extra) {
  if (!extra) return rows;
  const at = stemRowIndex(rows);
  const stalk = rows[at];
  const first = stalk.search(/[^.]/);
  const last = stalk.length - 1 - [...stalk].reverse().join("").search(/[^.]/);
  const added = [];
  for (let k = 0; k < extra; k++) {
    const row = [...stalk];
    const side = k % 2 === 0 ? first - 1 : last + 1;
    if (k % 3 !== 2 && side >= 0 && side < row.length && row[side] === ".") row[side] = "l";
    added.push(row.join(""));
  }
  return [...rows.slice(0, at), ...added, ...rows.slice(at)];
}
