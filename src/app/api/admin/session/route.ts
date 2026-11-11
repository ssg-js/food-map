import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminKey, equalSecret, signAdminSession, sameOrigin } from "@/shared/lib/admin-auth";
import { privateHeaders } from "@/shared/lib/admin-access";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request) && !(request.headers.get("x-food-map-client") === "native" && !request.headers.get("origin"))) return NextResponse.json({message:"허용되지 않은 요청입니다."},{status:403,headers:privateHeaders});
  const key=adminKey();
  if (!key) return NextResponse.json({message:"관리자 접근 키를 먼저 설정해주세요."},{status:503,headers:privateHeaders});
  const body=await request.json().catch(()=>null);
  if (!body || typeof body.key !== "string" || body.key.length > 256 || !equalSecret(body.key,key)) return NextResponse.json({message:"접근 키를 확인해주세요."},{status:401,headers:privateHeaders});
  const token=signAdminSession(key);
  const response=NextResponse.json(request.headers.get("x-food-map-client") === "native" ? {ok:true,token} : {ok:true},{headers:privateHeaders});
  response.cookies.set(ADMIN_COOKIE,token,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV === "production",path:"/",maxAge:8*60*60});
  return response;
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) && !(request.headers.get("x-food-map-client") === "native" && !request.headers.get("origin"))) return NextResponse.json({message:"허용되지 않은 요청입니다."},{status:403,headers:privateHeaders});
  const response=NextResponse.json({ok:true},{headers:privateHeaders});response.cookies.set(ADMIN_COOKIE,"",{maxAge:0,path:"/",httpOnly:true,sameSite:"strict"});return response;
}

export async function GET() {
 const {isAdmin}=await import("@/shared/lib/admin-access");
 return NextResponse.json({authenticated:await isAdmin()},{headers:privateHeaders});
}
