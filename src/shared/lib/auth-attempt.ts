import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
const WINDOW_MS = 15 * 60_000;
const RETENTION_WINDOWS = (24 * 60 * 60_000) / WINDOW_MS;
const PREFIX = "auth-attempt:";
let nextCleanupAt = 0;
export function authAttemptId(scope: string, now: number): string {
  const bucket = String(Math.floor(now / WINDOW_MS)).padStart(12, "0");
  return `${PREFIX}${bucket}:${createHash("sha256").update(scope).digest("hex")}`;
}
export async function recordAuthAttempt(
  scope: string,
  db: PrismaClient = prisma,
  now = Date.now(),
) {
  // Cleanup is maintenance, not the rate-limit boundary. Limit both frequency and batch size.
  if (now >= nextCleanupAt) {
    nextCleanupAt = now + 60 * 60_000;
    const cutoff = String(
      Math.floor(now / WINDOW_MS) - RETENTION_WINDOWS,
    ).padStart(12, "0");
    try {
      const expired = await db.loginAttempt.findMany({
        where: { id: { startsWith: PREFIX, lt: `${PREFIX}${cutoff}:` } },
        select: { id: true },
        take: 100,
      });
      if (expired.length)
        await db.loginAttempt.deleteMany({
          where: { id: { in: expired.map((r) => r.id) } },
        });
    } catch {
      // A cleanup failure must not skip the persisted rate-limit write below.
      nextCleanupAt = now + 5 * 60_000;
    }
  }
  const id = authAttemptId(scope, now);
  return db.loginAttempt.upsert({
    where: { id },
    create: { id, count: 1 },
    update: { count: { increment: 1 } },
  });
}
