import { spawnSync } from "node:child_process";
for (const script of ["lint", "typecheck", "test", "qa:build", "test:e2e"]) {
  console.log(`\nChecking web: ${script}`);
  const result = spawnSync("npm", ["run", script], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
