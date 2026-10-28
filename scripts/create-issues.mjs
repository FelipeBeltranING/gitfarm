// Creates the labels and issues listed in backlog.json using the GitHub CLI.
// Usage: gh auth login   (once)
//        node scripts/create-issues.mjs [owner/repo]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const repo = process.argv[2] ?? "FelipeBeltranING/gitfarm";
const { labels, issues } = JSON.parse(readFileSync(new URL("./backlog.json", import.meta.url), "utf8"));
const gh = (...args) => execFileSync("gh", [...args, "--repo", repo], { encoding: "utf8" }).trim();

for (const l of labels) {
  gh("label", "create", l.name, "--color", l.color, "--description", l.description, "--force");
  console.log(`🏷️  ${l.name}`);
}

const existing = new Set(JSON.parse(gh("issue", "list", "--state", "all", "--limit", "200", "--json", "title")).map((i) => i.title));
for (const issue of issues) {
  if (existing.has(issue.title)) { console.log(`⏭️  ${issue.title} (already exists)`); continue; }
  const args = ["issue", "create", "--title", issue.title, "--body", issue.body];
  for (const label of issue.labels) args.push("--label", label);
  console.log(`✅ ${issue.title} → ${gh(...args)}`);
}
