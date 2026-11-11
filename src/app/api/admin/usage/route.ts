import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { isAdmin, privateHeaders } from "@/shared/lib/admin-access";
export async function GET() {
  if(!await isAdmin())return NextResponse.json({message:"관리자 로그인이 필요합니다."},{status:401,headers:privateHeaders});
  try {
    const [clock]=await prisma.$queryRaw<{month:string;day:string}[]>`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month,to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM-DD') AS day`;
    const [budget,daily,snapshot]=await Promise.all([
      prisma.googleSearchBudget.findUnique({where:{month:clock.month}}),
      prisma.googleSearchDailyUsage.findMany({where:{day:{startsWith:clock.month}},orderBy:{day:"asc"}}),
      prisma.googleMonitoringSnapshot.findUnique({where:{id:"google-maps"}}),
    ]);
    const dailyUsed=budget?.day === clock.day ? budget.dailyUsed : 0;
    const monthlyRemaining=budget ? Math.max(0,budget.limit-budget.used) : 0;
    const dailyRemaining=budget ? Math.max(0,budget.dailyLimit-dailyUsed) : 0;
    const enabled=process.env.GOOGLE_PLACES_ENABLED === "true" && !!process.env.GOOGLE_PLACES_API_KEY;
    const projectId=process.env.GOOGLE_CLOUD_PROJECT;
    return NextResponse.json({month:clock.month,day:clock.day,budget,daily,dailyUsed,monthlyRemaining,dailyRemaining,
      status:!enabled?"DISABLED":!budget?"UNCONFIGURED":monthlyRemaining===0||dailyRemaining===0?"BLOCKED":"ACTIVE",
      monitoringConfigured:!!projectId && process.env.GOOGLE_MONITORING_ENABLED === "true",
      snapshot:snapshot?.projectId===projectId && snapshot?.month===clock.month?snapshot:null,
      browserMapEnabled:process.env.GOOGLE_MAPS_BROWSER_ENABLED === "true",fetchedAt:new Date().toISOString()}, {headers:privateHeaders});
  } catch { return NextResponse.json({message:"DB 사용량을 확인할 수 없습니다. 검색은 안전하게 차단됩니다."},{status:503,headers:privateHeaders}); }
}
