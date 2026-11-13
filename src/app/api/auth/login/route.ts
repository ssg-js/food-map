import { createHash } from "node:crypto";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { sameOrigin } from "@/shared/lib/admin-auth";
import { privateHeaders } from "@/shared/lib/personal-access";
import { z } from "zod";
const schema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(1).max(128),
});
export async function POST(request: Request) {
  if (!process.env.BETTER_AUTH_SECRET)
    return Response.json(
      { message: "인증 서버 설정이 필요해요." },
      { status: 503 },
    );
  if (
    !sameOrigin(request) &&
    request.headers.get("x-food-map-client") !== "native"
  )
    return Response.json(
      { message: "허용되지 않은 요청이에요." },
      { status: 403 },
    );
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json(
      { message: "아이디와 비밀번호를 확인해주세요." },
      { status: 400, headers: privateHeaders },
    );
  const bucket = Math.floor(Date.now() / 900000);
  const id = createHash("sha256")
    .update(`${bucket}:${body.data.username.toLowerCase()}`)
    .digest("hex");
  const attempt = await prisma.loginAttempt.upsert({
    where: { id },
    create: { id, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (attempt.count > 10)
    return Response.json(
      { message: "시도가 너무 많아요. 15분 뒤 다시 시도해주세요." },
      { status: 429, headers: privateHeaders },
    );
  const response = await auth.api.signInUsername({
    body: body.data,
    headers: request.headers,
    asResponse: true,
  });
  const result = await response.json();
  if (!response.ok)
    return Response.json(
      { message: "아이디와 비밀번호를 확인해주세요." },
      { status: 401, headers: privateHeaders },
    );
  await prisma.loginAttempt.deleteMany({ where: { id } });
  const h = new Headers(privateHeaders);
  for (const cookie of response.headers.getSetCookie())
    h.append("set-cookie", cookie);
  const token = response.headers.get("set-auth-token") || result.token;
  return Response.json(
    request.headers.get("x-food-map-client") === "native"
      ? { ok: true, token }
      : { ok: true },
    { headers: h },
  );
}
