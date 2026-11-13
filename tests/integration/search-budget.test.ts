import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import {
  reserveSearchRequest,
  SearchBlockedError,
} from "../../src/shared/lib/google-places/search-budget";
const url = process.env.TEST_DATABASE_URL;
test(
  "PostgreSQL migration, persistence and concurrent budget enforcement",
  { skip: !url },
  async () => {
    const target = new URL(url!);
    const schema = target.searchParams.get("schema") ?? "";
    assert.ok(["localhost", "127.0.0.1"].includes(target.hostname));
    assert.match(schema, /^quota_test_[a-z0-9_]+$/);
    const db = new PrismaClient({ datasourceUrl: url });
    const qualified = (sql: string) =>
      sql.replace(
        /"(RestaurantCategory|Restaurant|Category|GoogleSearchBudget|GoogleSearchDailyUsage|GoogleMonitoringSnapshot|CategoryKind|User|Session|Account|Verification|BootstrapState|LoginAttempt|ApiUsage)"/g,
        `"${schema}"."$1"`,
      );
    try {
      await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      for (const migration of [
        "20260624153000_add_restaurant_model",
        "20260915000000_add_place_registration_categories",
      ]) {
        const sql = await readFile(
          `prisma/migrations/${migration}/migration.sql`,
          "utf8",
        );
        for (const statement of sql.split(";").filter((s) => s.trim()))
          await db.$executeRawUnsafe(qualified(statement));
      }
      await db.$executeRawUnsafe(
        qualified(
          `INSERT INTO "Category" (id,name) VALUES ('legacy','혼합 카테고리')`,
        ),
      );
      await db.$executeRawUnsafe(
        qualified(
          `INSERT INTO "Restaurant" (id,"googlePlaceId","updatedAt") VALUES ('r','test-place',CURRENT_TIMESTAMP)`,
        ),
      );
      await db.$executeRawUnsafe(
        qualified(
          `INSERT INTO "RestaurantCategory" ("restaurantId","categoryId") VALUES ('r','legacy')`,
        ),
      );
      const sql = await readFile(
        "prisma/migrations/20261109000000_category_kinds_and_search_budget/migration.sql",
        "utf8",
      );
      for (const statement of sql
        .split(";")
        .filter((s) => s.replace(/^--.*$/gm, "").trim()))
        await db.$executeRawUnsafe(qualified(statement));
      const versionSql = await readFile(
        "prisma/migrations/20261111000000_category_edit_versions/migration.sql",
        "utf8",
      );
      for (const statement of versionSql.split(";").filter((s) => s.trim()))
        await db.$executeRawUnsafe(qualified(statement));
      const personalSql = await readFile(
        "prisma/migrations/20261114000000_personal_accounts/migration.sql",
        "utf8",
      );
      for (const statement of personalSql
        .split(";")
        .filter((s) => s.replace(/^--.*$/gm, "").trim()))
        await db.$executeRawUnsafe(qualified(statement));
      assert.equal(
        (await db.restaurant.findUniqueOrThrow({ where: { id: "r" } })).ownerId,
        "__legacy_quarantine__",
      );
      assert.equal(
        (await db.restaurantCategory.findFirstOrThrow()).ownerId,
        "__legacy_quarantine__",
      );
      await db.user.create({
        data: { id: "other", name: "Other", email: "other@local.invalid" },
      });
      const foreign = await db.category.create({
        data: { ownerId: "other", name: "Other", kind: "DISH" },
      });
      await assert.rejects(
        db.restaurantCategory.create({
          data: {
            ownerId: "__legacy_quarantine__",
            restaurantId: "r",
            categoryId: foreign.id,
          },
        }),
      );
      assert.equal(
        (await db.category.findUniqueOrThrow({ where: { id: "legacy" } })).kind,
        "UNCLASSIFIED",
      );
      assert.equal(await db.restaurantCategory.count(), 1);
      await db.category.create({
        data: {
          ownerId: "__legacy_quarantine__",
          name: "같은 이름",
          kind: "FOOD",
        },
      });
      await db.category.create({
        data: {
          ownerId: "__legacy_quarantine__",
          name: "같은 이름",
          kind: "PURPOSE",
        },
      });
      await assert.rejects(
        db.category.create({
          data: {
            ownerId: "__legacy_quarantine__",
            name: "같은 이름",
            kind: "FOOD",
          },
        }),
      );
      await assert.rejects(
        reserveSearchRequest(db),
        (e: unknown) =>
          e instanceof SearchBlockedError &&
          e.code === "SEARCH_BUDGET_UNCONFIGURED",
      );
      const [clock] = await db.$queryRaw<
        { month: string; day: string }[]
      >`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month,to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM-DD') AS day`;
      await db.googleSearchBudget.create({
        data: {
          month: clock.month,
          day: clock.day,
          used: 4493,
          limit: 4500,
          dailyUsed: 0,
          dailyLimit: 100,
        },
      });
      const results = await Promise.allSettled(
        Array.from({ length: 30 }, () => reserveSearchRequest(db)),
      );
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 7);
      assert.equal(
        (
          await db.googleSearchBudget.findUniqueOrThrow({
            where: { month: clock.month },
          })
        ).used,
        4500,
      );
      // A second Prisma client simulates a server restart/second instance.
      const other = new PrismaClient({ datasourceUrl: url });
      try {
        await assert.rejects(
          reserveSearchRequest(other),
          (e: unknown) =>
            e instanceof SearchBlockedError &&
            e.code === "SEARCH_LIMIT_REACHED",
        );
      } finally {
        await other.$disconnect();
      }
      await db.googleSearchBudget.update({
        where: { month: clock.month },
        data: {
          used: 20,
          limit: 100,
          day: clock.day,
          dailyUsed: 98,
          dailyLimit: 100,
        },
      });
      const daily = await Promise.allSettled(
        Array.from({ length: 15 }, () => reserveSearchRequest(db)),
      );
      assert.equal(daily.filter((r) => r.status === "fulfilled").length, 2);
      const row = await db.googleSearchBudget.findUniqueOrThrow({
        where: { month: clock.month },
      });
      assert.equal(row.used, 22);
      assert.equal(row.dailyUsed, 100);
      await db.googleSearchBudget.update({
        where: { month: clock.month },
        data: { day: "1999-01-01" },
      });
      await reserveSearchRequest(db);
      assert.equal(
        (
          await db.googleSearchBudget.findUniqueOrThrow({
            where: { month: clock.month },
          })
        ).dailyUsed,
        1,
      );
      await db.googleSearchBudget.delete({ where: { month: clock.month } });
      await db.googleSearchBudget.create({
        data: { month: "1999-01", used: 0, limit: 4500 },
      });
      await assert.rejects(
        reserveSearchRequest(db),
        (e: unknown) =>
          e instanceof SearchBlockedError &&
          e.code === "SEARCH_BUDGET_UNCONFIGURED",
      );
      const dates = await db.$queryRaw<
        { month: string }[]
      >`SELECT to_char(TIMESTAMPTZ '2026-12-01 07:59:59+00' AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month UNION ALL SELECT to_char(TIMESTAMPTZ '2026-12-01 08:00:00+00' AT TIME ZONE 'America/Los_Angeles','YYYY-MM')`;
      assert.deepEqual(
        dates.map((d) => d.month),
        ["2026-11", "2026-12"],
      );
    } finally {
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await db.$disconnect();
    }
  },
);
