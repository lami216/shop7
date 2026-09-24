import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const frontendPackageJson = JSON.parse(
  await readFile(new URL("../frontend/package.json", import.meta.url), "utf8"),
);
const viteConfig = await readFile(new URL("../frontend/vite.config.js", import.meta.url), "utf8");

test("root build installs frontend dependencies from its lockfile", () => {
  assert.match(packageJson.scripts.build, /npm ci --prefix frontend/);
  assert.match(packageJson.scripts.build, /npm run build --prefix frontend/);
});

test("development proxy and runtime requirements match the deployment runtime", () => {
  assert.equal(packageJson.engines.node, ">=20.19");
  assert.equal(frontendPackageJson.engines.node, ">=20.19");
  assert.match(viteConfig, /127\.0\.0\.1:10007/);
});
