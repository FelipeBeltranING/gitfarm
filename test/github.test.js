import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchCalendar } from "../src/github.js";

// Minimal copy of the markup GitHub serves at /users/<name>/contributions.
function fakeContributionsHtml(start, days) {
  let html = `<h2 class="f4 text-normal mb-2">\n  1,234 contributions\n  in the last year\n</h2><table>`;
  const d = new Date(`${start}T00:00:00Z`);
  for (let i = 0; i < days; i++, d.setUTCDate(d.getUTCDate() + 1)) {
    const level = i % 5;
    const id = `contribution-day-component-${d.getUTCDay()}-${i}`;
    html += `<td tabindex="0" data-ix="${i}" aria-selected="false" style="width: 10px" data-date="${d.toISOString().slice(0, 10)}" id="${id}" data-level="${level}" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>`;
    html += `<tool-tip id="tooltip-${i}" for="${id}" popover="manual" data-direction="n" data-type="label" data-view-component="true" class="sr-only position-absolute">${level ? `${level * 3} contributions` : "No contributions"} on some day.</tool-tip>`;
  }
  return html;
}

test("scrapes the public contributions calendar without a token", async (t) => {
  const html = fakeContributionsHtml("2025-10-26", 367);
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, status: 200, text: async () => html }));

  const cal = await fetchCalendar("octocat");
  assert.equal(cal.total, 1234);
  assert.equal(cal.weeks.length, 53);
  assert.equal(cal.weeks[0][0].date, "2025-10-26"); // a Sunday
  assert.deepEqual(cal.weeks[0][1], { date: "2025-10-27", level: 1, count: 3 });
  assert.equal(cal.weeks.at(-1).filter(Boolean).length, 3);
});

test("reports a clear error when the user does not exist", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404, text: async () => "" }));
  await assert.rejects(fetchCalendar("nobody-here"), /HTTP 404/);
});
