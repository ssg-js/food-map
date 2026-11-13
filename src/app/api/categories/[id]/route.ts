import { access } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import { categoryInput, versionSchema } from "@/shared/lib/catalog";
import {
  catalogTransaction,
  catalogFailure,
  CatalogError,
} from "@/shared/lib/personal-catalog";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const b = categoryInput.safeParse(await request.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { message: "이름·분류·버전을 확인해주세요." },
      { status: 400 },
    );
  const id = (await params).id;
  if (!(await prisma.category.findFirst({ where: { id, ownerId: a.user.id } })))
    return Response.json(
      { message: "카테고리를 찾을 수 없어요." },
      { status: 404 },
    );
  try {
    const result = await prisma.category.updateMany({
      where: {
        id,
        ownerId: a.user.id,
        updatedAt: new Date(b.data.expectedUpdatedAt),
      },
      data: {
        name: b.data.name,
        kind: b.data.kind,
        updatedAt: new Date(
          Math.max(Date.now(), Date.parse(b.data.expectedUpdatedAt) + 1),
        ),
      },
    });
    if (!result.count)
      return Response.json(
        { message: "다른 화면에서 변경됐어요." },
        { status: 409 },
      );
    return Response.json(await prisma.category.findUnique({ where: { id } }));
  } catch (e) {
    return catalogFailure(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const id = (await params).id,
    v = versionSchema.safeParse(
      new URL(request.url).searchParams.get("version"),
    );
  if (!v.success)
    return Response.json({ message: "버전을 확인해주세요." }, { status: 400 });
  try {
    await catalogTransaction(async (tx) => {
      const c = await tx.category.findFirst({
        where: { id, ownerId: a.user.id },
      });
      if (!c) throw new CatalogError("카테고리를 찾을 수 없어요.", 404);
      if (c.updatedAt.toISOString() !== v.data)
        throw new CatalogError("다른 화면에서 변경됐어요.", 409);
      if (c.kind !== "UNCLASSIFIED") {
        const linked = await tx.restaurant.findMany({
          where: {
            ownerId: a.user.id,
            categories: { some: { categoryId: id } },
          },
          select: {
            categories: {
              where: { category: { kind: { not: "UNCLASSIFIED" } } },
              select: { categoryId: true },
            },
          },
        });
        if (linked.some((r) => r.categories.length <= 1))
          throw new CatalogError(
            "마지막 카테고리예요. 맛집에 다른 카테고리를 먼저 추가해주세요.",
            409,
          );
      }
      await tx.category.delete({ where: { id } });
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return catalogFailure(e);
  }
}
