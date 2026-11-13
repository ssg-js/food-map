import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
let url = new URL(process.env.DATABASE_URL);
if (url.protocol === "prisma+postgres:") {
  const data = JSON.parse(
    Buffer.from(url.searchParams.get("api_key"), "base64url").toString(),
  );
  url = new URL(data.databaseUrl);
}
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Tests require local DB");
const schema = `product_test_${Date.now()}`;
url.searchParams.set("schema", schema);
url.searchParams.set("pgbouncer", "true");
url.searchParams.set("connection_limit", "1");
const env = { ...process.env, DATABASE_URL: url.toString() };
const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "db", "push", "--skip-generate"],
  { env, stdio: "pipe" },
);
if (result.status !== 0) {
  console.error("Isolated database setup failed");
  process.exit(1);
}
const db = new PrismaClient({ datasourceUrl: url.toString() });
try {
  const { hashPassword } = await import("better-auth/crypto");
  for (const [id, role] of [
    ["testa", "OPERATOR"],
    ["testb", "USER"],
  ]) {
    await db.user.create({
      data: { id, name: id, username: id, email: `${id}@local.invalid`, role },
    });
    await db.account.create({
      data: {
        id: `account-${id}`,
        userId: id,
        accountId: id,
        providerId: "credential",
        password: await hashPassword("Test-password-12345"),
      },
    });
  }
  await db.bootstrapState.create({ data: { id: "personal", state: "DONE" } });
  const [clock] =
    await db.$queryRaw`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month`;
  await db.googleSearchBudget.create({
    data: { month: clock.month, used: 0, limit: 4500, dailyLimit: 100 },
  });
  await writeFile(
    "/private/tmp/food-map-product-test-env.json",
    JSON.stringify({
      DATABASE_URL: url.toString(),
      EXTERNAL_API_MODE: "mock",
      API_DAILY_LIMIT: "80",
      API_MONTHLY_LIMIT: "1000",
      BETTER_AUTH_SECRET: "testauth-only-secret-01234567890123456789",
      PERSONAL_SETUP_TOKEN: "test-setup-only-token",
      AUTH_BASE_URL: "http://127.0.0.1:3300",
      AUTH_TRUSTED_ORIGINS: "http://127.0.0.1:3300",
      ADMIN_ACCESS_KEY: "product-test-only-access-key-0123456789",
      GOOGLE_PLACES_ENABLED: "true",
      GOOGLE_PLACES_API_KEY: "product-test-key",
      GOOGLE_SEARCH_LIMITS_DISABLED: "false",
      FOOD_MAP_PRODUCT_TEST: "true",
      schema,
    }),
  );
  console.log("Isolated product DB prepared; external Google calls mocked");
} finally {
  await db.$disconnect();
}
