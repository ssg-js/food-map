import { spawnSync } from "node:child_process";
function run(args) {
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`Check failed: ${args.join(" ")}`);
}
let prepared = false;
try {
  run(["scripts/product-test-prepare.mjs"]);
  prepared = true;
  run(["node_modules/next/dist/bin/next", "build"]);
  run([
    "node_modules/@playwright/test/cli.js",
    "test",
    "--config",
    "playwright.mobile.config.ts",
  ]);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (prepared) run(["scripts/product-test-cleanup.mjs"]);
}
