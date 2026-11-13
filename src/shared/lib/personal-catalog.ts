import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { catalogSelect, flattenRestaurant } from "./catalog";
export class CatalogError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function catalogTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let i = 0; ; i++)
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (e) {
      if (
        i < 3 &&
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2034"
      )
        continue;
      throw e;
    }
}
export async function savePersonal(
  ownerId: string,
  googlePlaceId: string,
  categoryIds: string[],
  expected?: string,
  id?: string,
) {
  return catalogTransaction(async (tx) => {
    const prior = await tx.restaurant.findFirst({
      where: { ownerId, ...(id ? { id } : { googlePlaceId }) },
    });
    if (id && !prior) throw new CatalogError("맛집을 찾을 수 없어요.", 404);
    const categories = await tx.category.findMany({
      where: { ownerId, id: { in: categoryIds } },
    });
    if (categories.length !== categoryIds.length)
      throw new CatalogError("내 카테고리만 선택할 수 있어요.", 400);
    if (!categories.some((c) => c.kind !== "UNCLASSIFIED"))
      throw new CatalogError(
        "목적·음식 종류·대표 메뉴 중 하나 이상 선택해주세요.",
        400,
      );
    if (prior && (!expected || prior.updatedAt.toISOString() !== expected))
      throw new CatalogError(
        "다른 화면에서 변경됐어요. 새로고침해주세요.",
        409,
      );
    const item = prior
      ? await tx.restaurant.update({
          where: { id: prior.id },
          data: {
            updatedAt: new Date(
              Math.max(Date.now(), prior.updatedAt.getTime() + 1),
            ),
          },
        })
      : await tx.restaurant.create({ data: { ownerId, googlePlaceId } });
    await tx.restaurantCategory.deleteMany({
      where: { ownerId, restaurantId: item.id },
    });
    await tx.restaurantCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        ownerId,
        restaurantId: item.id,
        categoryId,
      })),
    });
    return flattenRestaurant(
      await tx.restaurant.findUniqueOrThrow({
        where: { id: item.id },
        select: catalogSelect,
      }),
    );
  });
}
export function catalogFailure(e: unknown) {
  if (e instanceof CatalogError)
    return Response.json({ message: e.message }, { status: e.status });
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(e.code)
  )
    return Response.json(
      { message: "다른 요청과 충돌했어요. 새로고침 후 다시 시도해주세요." },
      { status: 409 },
    );
  return Response.json(
    { message: "요청을 처리하지 못했어요." },
    { status: 500 },
  );
}
