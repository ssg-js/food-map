import { NextResponse } from "next/server";
import { adminKey, validAdminSession, sameOrigin } from "./admin-auth";
import { isAdmin, privateHeaders } from "./admin-access";
/** Destructive shared-catalog actions require an authenticated operator. */
export async function requireOperator(request: Request) {
  const bearer = request.headers.get("authorization");
  if (
    bearer?.startsWith("Bearer ") &&
    validAdminSession(bearer.slice(7), adminKey())
  )
    return null;
  if (await isAdmin()) {
    if (sameOrigin(request)) return null;
    return NextResponse.json(
      { message: "허용되지 않은 요청입니다." },
      { status: 403, headers: privateHeaders },
    );
  }
  return NextResponse.json(
    {
      code: "OPERATOR_REQUIRED",
      message: "공용 데이터를 변경하려면 관리자 로그인이 필요해요.",
    },
    { status: 401, headers: privateHeaders },
  );
}
