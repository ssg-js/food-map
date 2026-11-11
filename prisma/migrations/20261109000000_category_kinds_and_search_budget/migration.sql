CREATE TYPE "CategoryKind" AS ENUM ('FOOD', 'PURPOSE', 'UNCLASSIFIED');
ALTER TABLE "Category" ADD COLUMN "kind" "CategoryKind" NOT NULL DEFAULT 'UNCLASSIFIED';
DROP INDEX "Category_name_key";
CREATE UNIQUE INDEX "Category_kind_name_key" ON "Category"("kind", "name");
CREATE TABLE "GoogleSearchBudget" (
  "month" TEXT PRIMARY KEY,
  "used" INTEGER NOT NULL,
  "limit" INTEGER NOT NULL,
  "day" TEXT NOT NULL DEFAULT '',
  "dailyUsed" INTEGER NOT NULL DEFAULT 0,
  "dailyLimit" INTEGER NOT NULL DEFAULT 100,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budget_limits" CHECK ("used" >= 0 AND "limit" BETWEEN 0 AND 4500 AND "dailyUsed" >= 0 AND "dailyLimit" BETWEEN 0 AND 100),
  CONSTRAINT "budget_month" CHECK ("month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
-- No initial budget: unknown prior billing usage must not be treated as zero.

CREATE TABLE "GoogleSearchDailyUsage" ("day" TEXT PRIMARY KEY, "used" INTEGER NOT NULL DEFAULT 0 CHECK ("used" >= 0));
CREATE TABLE "GoogleMonitoringSnapshot" ("id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL, "month" TEXT NOT NULL, "payload" JSONB NOT NULL, "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
