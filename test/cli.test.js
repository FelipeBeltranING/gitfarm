import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("the CLI accepts --option=value as well as --option value", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "gitfarm-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const out = join(dir, "farm.svg");
  execFileSync(process.execPath, ["src/cli.js", "--demo", "--crop=rice", `--out=${out}`], { stdio: "pipe" });
  assert.match(readFileSync(out, "utf8"), /growing rice/);
});
