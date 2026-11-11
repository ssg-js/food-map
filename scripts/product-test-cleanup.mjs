import { readFile, unlink } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
const path = "/private/tmp/food-map-product-test-env.json";
const env = JSON.parse(await readFile(path, "utf8"));
const url = new URL(env.DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  !/^product_test_\d+$/.test(env.schema) ||
  url.searchParams.get("schema") !== env.schema
)
  throw new Error("Unsafe cleanup target");
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
try {
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${env.schema}" CASCADE`);
  await unlink(path);
  console.log(
    "Isolated product test schema removed; application data unchanged",
  );
} finally {
  await db.$disconnect();
}
