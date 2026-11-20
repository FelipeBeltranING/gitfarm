import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));

test("the npm package ships only what the CLI needs", () => {
  assert.deepEqual(pkg.files, ["src", "!src/action.js"]);
  for (const dir of ["test", "tools", "scripts", "examples", "public", "api"]) {
    assert.ok(!pkg.files.some((f) => f.startsWith(dir)), `${dir} should not be published`);
  }
});

test("the gitfarm command points at a runnable script", () => {
  const bin = pkg.bin.gitfarm;
  assert.equal(bin, "src/cli.js");
  assert.match(read(bin), /^#!\/usr\/bin\/env node\r?\n/, "the CLI needs a shebang to run through npx");
  assert.ok(pkg.engines.node, "declares the Node version it needs");
});

test("publishing to npm happens on a release, with provenance, and checks the version", () => {
  const workflow = read(".github/workflows/publish.yml");
  assert.match(workflow, /release:\s*\n\s*types: \[published\]/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /NPM_TOKEN/);
  assert.match(workflow, /package\.json/, "the release tag is compared with package.json");
});
