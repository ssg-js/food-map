import { readJsonRequest } from "@/shared/lib/json-body";
import { privateJson } from "@/shared/lib/private-response";
import { timingSafeEqual } from "node:crypto";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { sameOrigin } from "@/shared/lib/admin-auth";
import { z } from "zod";
const schema = z
  .object({
    token: z.string().max(200),
    username: z.string().regex(/^[a-zA-Z0-9_]{3,32}$/),
    password: z.string().min(12).max(128),
    passwordConfirmation: z.string().min(12).max(128),
    adoptLegacy: z.boolean().default(false),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: "비밀번호 확인이 일치하지 않아요.",
    path: ["passwordConfirmation"],
  });
export async function POST(request: Request) {
  if (!process.env.BETTER_AUTH_SECRET)
    return privateJson(
      { message: "인증 서버 설정이 필요해요." },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return privateJson(
      { message: "허용되지 않은 요청이에요." },
      { status: 403 },
    );
  const json = await readJsonRequest(request);
  if (!json.ok) return json.response;
  const b = schema.safeParse(json.value);
  if (!b.success)
    return privateJson(
      {
        message: b.error.issues.some(
          (issue) => issue.path[0] === "passwordConfirmation",
        )
          ? "비밀번호 확인을 입력하고 두 비밀번호가 같은지 확인해주세요."
          : "설정 토큰과 입력 내용을 확인해주세요.",
      },
      { status: 400 },
    );
  const secret = process.env.PERSONAL_SETUP_TOKEN;
  if (
    !secret ||
    Buffer.byteLength(b.data.token) !== Buffer.byteLength(secret) ||
    !timingSafeEqual(Buffer.from(b.data.token), Buffer.from(secret))
  )
    return privateJson(
      { message: "설정 토큰과 입력 내용을 확인해주세요." },
      { status: 400 },
    );
  if (await prisma.user.count({ where: { role: { not: "QUARANTINED" } } }))
    return privateJson(
      { message: "이미 계정 설정이 완료됐어요." },
      { status: 409 },
    );
  const claimed = await prisma.bootstrapState.updateMany({
    where: { id: "personal", state: "READY" },
    data: { state: "CLAIMED" },
  });
  if (!claimed.count)
    return privateJson(
      { message: "이미 설정 중이거나 완료됐어요." },
      { status: 409 },
    );
  let createdId: string | undefined;
  try {
    const created = await auth.api.signUpEmail({
      body: {
        email: `${b.data.username.toLowerCase()}@local.invalid`,
        name: b.data.username,
        username: b.data.username,
        password: b.data.password,
      },
    });
    createdId = created.user.id;
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: created.user.id },
        data: { role: "OPERATOR" },
      });
      if (b.data.adoptLegacy) {
        const ownerId = created.user.id;
        const legacy = "__legacy_quarantine__";
        const links = await tx.restaurantCategory.findMany({
          where: { ownerId: legacy },
        });
        await tx.restaurantCategory.deleteMany({ where: { ownerId: legacy } });
        await tx.category.updateMany({
          where: { ownerId: legacy },
          data: { ownerId },
        });
        await tx.restaurant.updateMany({
          where: { ownerId: legacy },
          data: { ownerId },
        });
        await tx.restaurantCategory.createMany({
          data: links.map((l) => ({ ...l, ownerId })),
        });
      }
      await tx.bootstrapState.update({
        where: { id: "personal" },
        data: { state: "DONE" },
      });
    });
    return privateJson({ ok: true }, { status: 201 });
  } catch {
    if (createdId)
      await prisma.user.deleteMany({
        where: { id: createdId, role: "PENDING" },
      });
    if (!(await prisma.user.count({ where: { role: { not: "QUARANTINED" } } })))
      await prisma.bootstrapState.update({
        where: { id: "personal" },
        data: { state: "READY" },
      });
    return privateJson(
      { message: "계정 설정을 완료하지 못했어요. 서버 상태를 확인해주세요." },
      { status: 500 },
    );
  }
}
