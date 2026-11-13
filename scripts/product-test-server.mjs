import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const env = JSON.parse(
  await readFile("/private/tmp/food-map-product-test-env.json", "utf8"),
);
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3300",
  ],
  { env: { ...process.env, ...env }, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
