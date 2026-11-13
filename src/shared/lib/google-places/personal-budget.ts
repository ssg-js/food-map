import { prisma } from "../prisma";
import { externalMode } from "./provider";
import { SearchBlockedError, reserveSearchRequest } from "./search-budget";
export async function reservePersonalRequest(
  ownerId: string,
  api: "SEARCH" | "DETAILS",
) {
  const mode = externalMode();
  // Live shared legacy budget remains mandatory; disabling flag is intentionally ignored.
  if (mode === "live") await reserveSearchRequest(prisma, true);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(713260092::bigint)`;
      const [clock] = await tx.$queryRaw<
        { month: string; day: string; nextDay: Date; nextMonth: Date }[]
      >`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month,to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM-DD') AS day,(date_trunc('day',CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')+interval '1 day') AT TIME ZONE 'America/Los_Angeles' AS "nextDay",(date_trunc('month',CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles')+interval '1 month') AT TIME ZONE 'America/Los_Angeles' AS "nextMonth"`;
      for (const scope of ["global", `user:${ownerId}`])
        for (const [period, resetAt, cap] of [
          [
            clock.day,
            clock.nextDay,
            Number(process.env.API_DAILY_LIMIT || 100),
          ],
          [
            clock.month,
            clock.nextMonth,
            Number(process.env.API_MONTHLY_LIMIT || 1000),
          ],
        ] as const) {
          if (
            !Number.isSafeInteger(cap) ||
            cap < 1 ||
            (mode === "live" && cap > (period.length === 7 ? 4500 : 100))
          )
            throw new SearchBlockedError(
              "SEARCH_BUDGET_UNCONFIGURED",
              "사용량 한도 설정을 확인해주세요.",
            );
          const id = `${mode}:ALL:${scope}:${period}`;
          const row = await tx.apiUsage.findUnique({ where: { id } });
          if ((row?.count || 0) >= cap)
            throw new SearchBlockedError(
              "SEARCH_LIMIT_REACHED",
              "조회 한도에 도달했어요. 한도 갱신 후 다시 이용해주세요.",
              resetAt.toISOString(),
            );
          await tx.apiUsage.upsert({
            where: { id },
            create: { id, mode, api: "ALL", scope, period, count: 1 },
            update: { count: { increment: 1 } },
          });
          const detailId = `${mode}:${api}:${scope}:${period}`;
          await tx.apiUsage.upsert({
            where: { id: detailId },
            create: { id: detailId, mode, api, scope, period, count: 1 },
            update: { count: { increment: 1 } },
          });
        }
    });
  } catch (e) {
    if (e instanceof SearchBlockedError) throw e;
    throw new SearchBlockedError(
      "SEARCH_BUDGET_UNAVAILABLE",
      "사용량을 확인할 수 없어 조회를 중단했어요.",
    );
  }
}
