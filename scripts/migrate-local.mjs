import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
let url = new URL(process.env.DATABASE_URL);
if (url.protocol === "prisma+postgres:")
  url = new URL(
    JSON.parse(
      Buffer.from(url.searchParams.get("api_key"), "base64url").toString(),
    ).databaseUrl,
  );
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Local DB only");
url.searchParams.set("schema", "public");
url.searchParams.set("pgbouncer", "true");
url.searchParams.set("connection_limit", "1");
const db = new PrismaClient({ datasourceUrl: url.toString() });
try {
  await db.$executeRawUnsafe("SET search_path TO public");
} finally {
  await db.$disconnect();
}
const r = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "inherit" },
);
process.exitCode = r.status ?? 1;
