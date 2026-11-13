import { access } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import { categoryIdsSchema, versionSchema } from "@/shared/lib/catalog";
import { savePersonal, catalogFailure } from "@/shared/lib/personal-catalog";
import { z } from "zod";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const b = z
    .object({
      categoryIds: categoryIdsSchema,
      expectedUpdatedAt: versionSchema,
    })
    .safeParse(await request.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { message: "카테고리와 버전을 확인해주세요." },
      { status: 400 },
    );
  try {
    return Response.json(
      await savePersonal(
        a.user.id,
        "",
        b.data.categoryIds,
        b.data.expectedUpdatedAt,
        (await params).id,
      ),
    );
  } catch (e) {
    return catalogFailure(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const id = (await params).id,
    version = versionSchema.safeParse(
      new URL(request.url).searchParams.get("version"),
    );
  if (!version.success)
    return Response.json({ message: "버전을 확인해주세요." }, { status: 400 });
  const row = await prisma.restaurant.findFirst({
    where: { id, ownerId: a.user.id },
  });
  if (!row)
    return Response.json(
      { message: "맛집을 찾을 수 없어요." },
      { status: 404 },
    );
  const changed = await prisma.restaurant.deleteMany({
    where: { id, ownerId: a.user.id, updatedAt: new Date(version.data) },
  });
  return changed.count
    ? new Response(null, { status: 204 })
    : Response.json({ message: "다른 화면에서 변경됐어요." }, { status: 409 });
}
