import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";
let url = new URL(process.env.DATABASE_URL);
if (url.protocol === "prisma+postgres:")
  url = new URL(
    JSON.parse(
      Buffer.from(url.searchParams.get("api_key"), "base64url").toString(),
    ).databaseUrl,
  );
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("This helper only backs up local development data");
url.searchParams.set("pgbouncer", "true");
url.searchParams.set("connection_limit", "1");
const db = new PrismaClient({ datasourceUrl: url.toString() });
try {
  const data = {};
  for (const table of [
    "Restaurant",
    "Category",
    "RestaurantCategory",
    "GoogleSearchBudget",
    "GoogleSearchDailyUsage",
    "GoogleMonitoringSnapshot",
  ])
    data[table] = await db.$queryRawUnsafe(`SELECT * FROM public."${table}"`);
  const path = `/private/tmp/food-map-before-personal-${Date.now()}.json`;
  await writeFile(path, JSON.stringify(data), { mode: 0o600 });
  console.log(`Local backup saved: ${path}`);
  console.log(
    `Preserved ${data.Restaurant.length} restaurants, ${data.Category.length} categories, ${data.RestaurantCategory.length} links`,
  );
} finally {
  await db.$disconnect();
}
