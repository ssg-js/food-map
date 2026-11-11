import "dotenv/config";
import { spawnSync } from "node:child_process";
let url = new URL(process.env.DATABASE_URL);
if (url.protocol === "prisma+postgres:")
  url = new URL(
    JSON.parse(
      Buffer.from(url.searchParams.get("api_key"), "base64url").toString(),
    ).databaseUrl,
  );
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Integration tests require local database");
url.searchParams.set("schema", `quota_test_${Date.now()}`);
url.searchParams.set("pgbouncer", "true");
url.searchParams.set("connection_limit", "1");
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "tests/integration/search-budget.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, TEST_DATABASE_URL: url.toString() },
  },
);
process.exitCode = r.status ?? 1;
