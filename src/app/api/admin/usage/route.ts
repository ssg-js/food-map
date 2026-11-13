import { prisma } from "@/shared/lib/prisma";
import { isAdmin, privateHeaders } from "@/shared/lib/admin-access";
import { externalMode } from "@/shared/lib/google-places/provider";
export async function GET() {
  if (!(await isAdmin()))
    return Response.json(
      { message: "관리자 로그인이 필요해요." },
      { status: 401, headers: privateHeaders },
    );
  try {
    const [clock] = await prisma.$queryRaw<
      { month: string; day: string }[]
    >`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month,to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM-DD') AS day`;
    const mode = externalMode();
    const [usage, legacy, snapshot] = await Promise.all([
      prisma.apiUsage.findMany({
        where: { mode, scope: "global", period: { startsWith: clock.month } },
      }),
      prisma.googleSearchBudget.findUnique({ where: { month: clock.month } }),
      prisma.googleMonitoringSnapshot.findUnique({
        where: { id: "google-maps" },
      }),
    ]);
    const limit = Number(process.env.API_MONTHLY_LIMIT || 1000),
      dailyLimit = Number(process.env.API_DAILY_LIMIT || 100),
      used =
        usage.find((r) => r.api === "ALL" && r.period === clock.month)?.count ||
        0,
      dailyUsed =
        usage.find((r) => r.api === "ALL" && r.period === clock.day)?.count ||
        0;
    const budget = { used, limit, dailyLimit },
      monthlyRemaining = Math.max(0, limit - used),
      dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
    const enabled =
      mode === "mock" ||
      (process.env.GOOGLE_PLACES_ENABLED === "true" &&
        !!process.env.GOOGLE_PLACES_API_KEY);
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    return Response.json(
      {
        mode,
        month: clock.month,
        day: clock.day,
        budget,
        daily: usage
          .filter((r) => r.api === "ALL" && r.period.length === 10)
          .map((r) => ({ day: r.period, used: r.count }))
          .sort((a, b) => a.day.localeCompare(b.day)),
        dailyUsed,
        monthlyRemaining,
        dailyRemaining,
        personalUsage: usage.filter((r) => r.period === clock.month),
        status: !enabled
          ? "DISABLED"
          : mode === "live" && !legacy
            ? "UNCONFIGURED"
            : monthlyRemaining === 0 ||
                dailyRemaining === 0 ||
                (mode === "live" &&
                  !!legacy &&
                  (legacy.used >= legacy.limit ||
                    (legacy.day === clock.day &&
                      legacy.dailyUsed >= legacy.dailyLimit)))
              ? "BLOCKED"
              : "ACTIVE",
        monitoringConfigured:
          mode === "live" &&
          !!projectId &&
          process.env.GOOGLE_MONITORING_ENABLED === "true",
        snapshot:
          snapshot?.projectId === projectId && snapshot?.month === clock.month
            ? snapshot
            : null,
        browserMapEnabled:
          mode === "live" && process.env.GOOGLE_MAPS_BROWSER_ENABLED === "true",
        fetchedAt: new Date().toISOString(),
      },
      { headers: privateHeaders },
    );
  } catch {
    return Response.json(
      { message: "사용량을 확인할 수 없어 조회를 중단했어요." },
      { status: 503, headers: privateHeaders },
    );
  }
}
