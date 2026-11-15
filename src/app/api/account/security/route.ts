import { access, privateHeaders } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import {
  issueRecoveryKey,
  changePassword,
  securityFailure,
} from "@/shared/lib/account-security";
import { z } from "zod";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("issue-key"),
    currentPassword: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("change-password"),
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
    confirmation: z.string().max(128),
  }),
]);
export async function GET(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const key = await prisma.recoveryKey.findUnique({
    where: { userId: a.user.id },
    select: { createdAt: true },
  });
  return Response.json(
    {
      username: a.user.username,
      hasRecoveryKey: !!key,
      createdAt: key?.createdAt,
    },
    { headers: privateHeaders },
  );
}
export async function POST(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const b = schema.safeParse(await request.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { message: "입력 내용을 확인해주세요. 새 비밀번호는 12~128자예요." },
      { status: 400, headers: privateHeaders },
    );
  try {
    if (b.data.action === "issue-key")
      return Response.json(
        {
          recoveryKey: await issueRecoveryKey(
            a.user.id,
            b.data.currentPassword,
          ),
        },
        { headers: privateHeaders },
      );
    if (b.data.newPassword !== b.data.confirmation)
      return Response.json(
        { message: "새 비밀번호 확인이 일치하지 않아요." },
        { status: 400, headers: privateHeaders },
      );
    await changePassword(a.user.id, b.data.currentPassword, b.data.newPassword);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (e) {
    return securityFailure(e);
  }
}
