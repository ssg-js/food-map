import { privateJson } from "@/shared/lib/private-response";
import { currentUser } from "@/shared/lib/auth";
export async function GET(request: Request) {
  return privateJson(
    {
      authenticated: (await currentUser(request.headers))?.role === "OPERATOR",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST() {
  return privateJson(
    { message: "개인 계정으로 로그인해주세요." },
    { status: 410 },
  );
}
export async function DELETE() {
  return privateJson(
    { message: "개인 계정 로그아웃을 이용해주세요." },
    { status: 410 },
  );
}
