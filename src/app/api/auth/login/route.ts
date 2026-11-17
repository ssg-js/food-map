import { readJsonRequest } from "@/shared/lib/json-body";
import { privateJson } from "@/shared/lib/private-response";
import { recordAuthAttempt } from "@/shared/lib/auth-attempt";
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
    return privateJson(
      { message: "인증 서버 설정이 필요해요." },
      { status: 503 },
    );
  if (
    !sameOrigin(request) &&
    request.headers.get("x-food-map-client") !== "native"
  )
    return privateJson(
      { message: "허용되지 않은 요청이에요." },
      { status: 403 },
    );
  const json = await readJsonRequest(request);
  if (!json.ok) return json.response;
  const body = schema.safeParse(json.value);
  if (!body.success)
    return privateJson(
      { message: "아이디와 비밀번호를 확인해주세요." },
      { status: 400, headers: privateHeaders },
    );
  // A shared persisted cap bounds password hashing even when usernames are rotated.
  const globalAttempt = await recordAuthAttempt("login-global");
  if (globalAttempt.count > 100)
    return privateJson(
      { message: "시도가 너무 많아요. 15분 뒤 다시 시도해주세요." },
      { status: 429 },
    );
  // Only real credentials receive per-account rows; arbitrary names cannot grow storage.
  // Better Auth still performs its dummy password hash for nonexistent users.
  const credentialBefore = await prisma.account.findFirst({
    where: {
      providerId: "credential",
      user: { username: body.data.username.toLowerCase() },
    },
    select: { id: true, password: true },
  });
  const attempt = credentialBefore
    ? await recordAuthAttempt(`login:${credentialBefore.id}`)
    : null;
  const id = attempt?.id;
  if (attempt && attempt.count > 10)
    return privateJson(
      { message: "시도가 너무 많아요. 15분 뒤 다시 시도해주세요." },
      { status: 429, headers: privateHeaders },
    );
  // An in-flight sign-in using the old password must not survive a password reset.
  const response = await auth.api.signInUsername({
    body: body.data,
    headers: request.headers,
    asResponse: true,
  });
  const result = await response.json();
  if (!response.ok)
    return privateJson(
      { message: "아이디와 비밀번호를 확인해주세요." },
      { status: 401, headers: privateHeaders },
    );
  const token = response.headers.get("set-auth-token") || result.token;
  const credentialAfter = credentialBefore
    ? await prisma.account.findUnique({
        where: { id: credentialBefore.id },
        select: { password: true },
      })
    : null;
  if (
    !credentialBefore ||
    !credentialAfter ||
    credentialBefore.password !== credentialAfter.password
  ) {
    if (typeof token === "string")
      await prisma.session.deleteMany({ where: { token } });
    return privateJson(
      { message: "계정 정보가 변경됐어요. 새 비밀번호로 다시 로그인해주세요." },
      { status: 401, headers: privateHeaders },
    );
  }
  if (id) await prisma.loginAttempt.deleteMany({ where: { id } });
  const h = new Headers(privateHeaders);
  for (const cookie of response.headers.getSetCookie())
    h.append("set-cookie", cookie);
  return privateJson(
    request.headers.get("x-food-map-client") === "native"
      ? { ok: true, token }
      : { ok: true },
    { headers: h },
  );
}
