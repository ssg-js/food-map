import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { isAdmin, privateHeaders } from "@/shared/lib/admin-access";
import { sameOrigin } from "@/shared/lib/admin-auth";
import { readGoogleMonitoring } from "@/shared/lib/google-places/monitoring";
export const runtime="nodejs";
export async function POST(request:Request) {
  if(!await isAdmin())return NextResponse.json({message:"관리자 로그인이 필요합니다."},{status:401,headers:privateHeaders});
  if(!sameOrigin(request))return NextResponse.json({message:"허용되지 않은 요청입니다."},{status:403,headers:privateHeaders});
  const projectId=process.env.GOOGLE_CLOUD_PROJECT;
  if(!projectId || process.env.GOOGLE_MONITORING_ENABLED !== "true")return NextResponse.json({message:"Google Cloud 프로젝트 ID와 Monitoring 조회 인증을 연결해주세요."},{status:503,headers:privateHeaders});
  try {
    const [clock]=await prisma.$queryRaw<{month:string;start:Date;now:Date}[]>`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM') AS month,date_trunc('month',CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'America/Los_Angeles' AS start,CURRENT_TIMESTAMP AS now`;
    const existing=await prisma.googleMonitoringSnapshot.findUnique({where:{id:"google-maps"}});
    if(existing?.month===clock.month && existing.projectId===projectId && clock.now.getTime()-existing.fetchedAt.getTime()<300000)return NextResponse.json({cached:true},{headers:privateHeaders});
    const payload=await readGoogleMonitoring(projectId,clock.start,clock.now);
    await prisma.googleMonitoringSnapshot.upsert({where:{id:"google-maps"},create:{id:"google-maps",projectId,month:clock.month,payload,fetchedAt:clock.now},update:{projectId,month:clock.month,payload,fetchedAt:clock.now}});
    return NextResponse.json({cached:false},{headers:privateHeaders});
  } catch { return NextResponse.json({message:"Google 사용량을 조회하지 못했습니다. 프로젝트 ID, Monitoring API 활성화, ADC 인증과 Monitoring Viewer 권한을 확인해주세요. 서버 검색 한도는 계속 적용됩니다."},{status:502,headers:privateHeaders}); }
}
