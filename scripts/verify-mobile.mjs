import { spawnSync } from "node:child_process";
for (const script of [
  "mobile:lint",
  "mobile:typecheck",
  "mobile:doctor",
  "mobile:export",
  "mobile:qa:export",
  "test:mobile-ui",
]) {
  console.log(`\nChecking mobile: ${script}`);
  const result = spawnSync("npm", ["run", script], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
