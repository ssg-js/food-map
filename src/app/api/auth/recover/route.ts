import { sameOrigin } from "@/shared/lib/admin-auth";
import { privateHeaders } from "@/shared/lib/personal-access";
import {
  findUsername,
  resetPassword,
  throttleSecurity,
  securityFailure,
} from "@/shared/lib/account-security";
import { z } from "zod";
const schema = z.object({
  action: z.enum(["find-username", "reset-password"]),
  recoveryKey: z
    .string()
    .trim()
    .regex(/^FM-[A-Fa-f0-9]{64}$/),
  newPassword: z.string().min(12).max(128).optional(),
  confirmation: z.string().max(128).optional(),
});
export async function POST(request: Request) {
  if (
    !sameOrigin(request) &&
    !(
      request.headers.get("x-food-map-client") === "native" &&
      !request.headers.get("origin")
    )
  )
    return Response.json(
      { message: "허용되지 않은 요청이에요." },
      { status: 403, headers: privateHeaders },
    );
  try {
    await throttleSecurity("recovery-global");
    const b = schema.safeParse(await request.json().catch(() => null));
    if (!b.success)
      return Response.json(
        { message: "복구 키와 입력 내용을 확인해주세요." },
        { status: 400, headers: privateHeaders },
      );
    if (b.data.action === "find-username")
      return Response.json(
        { username: await findUsername(b.data.recoveryKey) },
        { headers: privateHeaders },
      );
    if (!b.data.newPassword || b.data.newPassword !== b.data.confirmation)
      return Response.json(
        { message: "12~128자 새 비밀번호와 확인을 입력해주세요." },
        { status: 400, headers: privateHeaders },
      );
    await resetPassword(b.data.recoveryKey, b.data.newPassword);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (e) {
    return securityFailure(e);
  }
}
