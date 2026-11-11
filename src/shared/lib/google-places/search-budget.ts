import type { PrismaClient } from "@prisma/client";

export class SearchBlockedError extends Error {
  constructor(
    public code: "SEARCH_BUDGET_UNCONFIGURED" | "SEARCH_LIMIT_REACHED" | "SEARCH_BUDGET_UNAVAILABLE",
    message: string,
    public resetAt?: string,
  ) { super(message); this.name = "SearchBlockedError"; }
}

/** Committed reservation BEFORE fetch. Failures/timeouts are never refunded. */
export async function reserveSearchRequest(db: PrismaClient): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      // DB time is shared across machines and uses Google's Pacific billing calendar.
      const [clock] = await tx.$queryRaw<{ month: string; day: string; nextDay: Date; nextMonth: Date }[]>`
        SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM') AS month,
          to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles', 'YYYY-MM-DD') AS day,
          (date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles') + interval '1 day') AT TIME ZONE 'America/Los_Angeles' AS "nextDay",
          (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles') + interval '1 month') AT TIME ZONE 'America/Los_Angeles' AS "nextMonth"
      `;
      if (!clock) throw new Error("No database clock");
      // Serialize only the short reservation transaction across every process.
      // ORM operations respect Prisma's configured DB schema; network fetch is outside this lock.
      await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(713260091::bigint)`;
      const budget = await tx.googleSearchBudget.findUnique({ where: { month: clock.month } });
      if (!budget) throw new SearchBlockedError("SEARCH_BUDGET_UNCONFIGURED", "이번 달 검색 사용량을 확인하고 있어요. 추가 비용을 막기 위해 검색을 잠시 중단했어요.");
      const dayUsed = budget.day === clock.day ? budget.dailyUsed : 0;
      if (budget.used < budget.limit && dayUsed < budget.dailyLimit && budget.limit <= 4500 && budget.dailyLimit <= 100) {
        await tx.googleSearchBudget.update({ where: { month: clock.month }, data: {
          used: { increment: 1 }, day: clock.day, dailyUsed: dayUsed + 1,
        } });
        await tx.googleSearchDailyUsage.upsert({ where: { day: clock.day }, create: { day: clock.day, used: 1 }, update: { used: { increment: 1 } } });
        return;
      }
      const monthly = budget.used >= budget.limit;
      throw new SearchBlockedError("SEARCH_LIMIT_REACHED", monthly
        ? "이번 달 검색 한도에 도달했어요. 추가 비용이 발생하지 않도록 검색을 중단했어요."
        : "오늘의 검색 한도에 도달했어요. 추가 비용이 발생하지 않도록 검색을 중단했어요.",
        (monthly ? clock.nextMonth : clock.nextDay).toISOString());
    }, { maxWait: 5000, timeout: 10000 });
  } catch (error) {
    if (error instanceof SearchBlockedError) throw error;
    // Never fall back to a process-local counter or unguarded Google request.
    throw new SearchBlockedError("SEARCH_BUDGET_UNAVAILABLE", "검색 사용량을 확인할 수 없어 검색을 잠시 중단했어요. 잠시 후 다시 시도해주세요.");
  }
}
