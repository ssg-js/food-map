import { randomBytes, createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { prisma } from "./prisma";
import { CatalogError, catalogFailure } from "./personal-catalog";
import { privateHeaders } from "./personal-access";
export const newRecoveryKey = () =>
  `FM-${randomBytes(32).toString("hex").toUpperCase()}`;
export const recoveryHash = (key: string) =>
  createHash("sha256").update(key.trim().toUpperCase()).digest("hex");
export async function throttleSecurity(scope: string) {
  const bucket = Math.floor(Date.now() / 900000),
    id = createHash("sha256")
      .update(`account-security:${bucket}:${scope}`)
      .digest("hex");
  const row = await prisma.loginAttempt.upsert({
    where: { id },
    create: { id, count: 1 },
    update: { count: { increment: 1 } },
  });
  if (row.count > 20)
    throw new CatalogError(
      "시도가 너무 많아요. 15분 뒤 다시 시도해주세요.",
      429,
    );
}
export async function passwordCredential(userId: string, password: string) {
  await throttleSecurity(`user:${userId}`);
  const credential = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  if (
    !credential?.password ||
    !(await verifyPassword({ hash: credential.password, password }))
  )
    throw new CatalogError("현재 비밀번호를 확인해주세요.", 400);
  return credential;
}
export async function issueRecoveryKey(userId: string, password: string) {
  const credential = await passwordCredential(userId, password),
    key = newRecoveryKey();
  await prisma.$transaction(async (tx) => {
    // Serialize credential changes with password reset/change; reject stale reauthentication.
    const locked = await tx.account.updateMany({
      where: { id: credential.id, userId, password: credential.password },
      data: { updatedAt: new Date() },
    });
    if (!locked.count)
      throw new CatalogError(
        "계정 정보가 변경됐어요. 다시 로그인해주세요.",
        409,
      );
    await tx.recoveryKey.upsert({
      where: { userId },
      create: { userId, keyHash: recoveryHash(key) },
      update: { keyHash: recoveryHash(key), createdAt: new Date() },
    });
  });
  return key;
}
export async function changePassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
) {
  const credential = await passwordCredential(userId, currentPassword);
  if (
    await verifyPassword({ hash: credential.password!, password: nextPassword })
  )
    throw new CatalogError(
      "현재 비밀번호와 다른 비밀번호를 입력해주세요.",
      400,
    );
  const password = await hashPassword(nextPassword);
  await prisma.$transaction(async (tx) => {
    const changed = await tx.account.updateMany({
      where: { id: credential.id, userId, password: credential.password },
      data: { password },
    });
    if (!changed.count)
      throw new CatalogError("다른 화면에서 계정이 변경됐어요.", 409);
    await tx.recoveryKey.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
  });
}
export async function findUsername(key: string) {
  const row = await prisma.recoveryKey.findUnique({
    where: { keyHash: recoveryHash(key) },
    include: { user: true },
  });
  if (!row || !["USER", "OPERATOR"].includes(row.user.role))
    throw new CatalogError("복구 키를 확인해주세요.", 400);
  return row.user.username;
}
export async function resetPassword(key: string, nextPassword: string) {
  const keyHash = recoveryHash(key);
  const row = await prisma.recoveryKey.findUnique({
    where: { keyHash },
    select: { userId: true },
  });
  if (!row) throw new CatalogError("복구 키를 확인해주세요.", 400);
  const password = await hashPassword(nextPassword);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: row.userId, role: { in: ["USER", "OPERATOR"] } },
    });
    if (!user) throw new CatalogError("복구 키를 확인해주세요.", 400);
    // Lock the credential before consuming a key, matching the lock order used by rotation.
    const credential = await tx.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (!credential) throw new CatalogError("복구 키를 확인해주세요.", 400);
    await tx.account.update({
      where: { id: credential.id },
      data: { updatedAt: new Date() },
    });
    const consumed = await tx.recoveryKey.deleteMany({
      where: { userId: user.id, keyHash },
    });
    if (!consumed.count)
      throw new CatalogError("복구 키가 사용됐거나 변경됐어요.", 400);
    await tx.account.update({
      where: { id: credential.id },
      data: { password },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });
}
export function securityFailure(e: unknown) {
  const result = catalogFailure(e);
  for (const [k, v] of Object.entries(privateHeaders)) result.headers.set(k, v);
  return result;
}
