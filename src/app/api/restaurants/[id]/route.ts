import { prisma } from "@/shared/lib/prisma";
import { requireOperator } from "@/shared/lib/operator-access";
import {
  catalogSelect,
  flattenRestaurant,
  categoryIdsSchema,
  versionSchema,
  apiError,
} from "@/shared/lib/catalog";
import { z } from "zod";
const schema = z.object({
  categoryIds: categoryIdsSchema,
  expectedUpdatedAt: versionSchema,
});
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json(
      { message: "카테고리와 수정 버전을 확인해주세요." },
      { status: 400 },
    );
  const { id } = await params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const categories = await tx.category.count({
        where: { id: { in: body.data.categoryIds } },
      });
      if (categories !== body.data.categoryIds.length)
        return { error: "존재하지 않는 카테고리예요.", status: 400 };
      const changed = await tx.restaurant.updateMany({
        where: { id, updatedAt: new Date(body.data.expectedUpdatedAt) },
        data: {
          updatedAt: new Date(
            Math.max(Date.now(), Date.parse(body.data.expectedUpdatedAt) + 1),
          ),
        },
      });
      if (!changed.count)
        return {
          error:
            "다른 화면에서 변경되었거나 삭제됐어요. 새로고침 후 다시 시도해주세요.",
          status: 409,
        };
      await tx.restaurantCategory.deleteMany({ where: { restaurantId: id } });
      await tx.restaurantCategory.createMany({
        data: body.data.categoryIds.map((categoryId) => ({
          restaurantId: id,
          categoryId,
        })),
      });
      return {
        item: await tx.restaurant.findUniqueOrThrow({
          where: { id },
          select: catalogSelect,
        }),
      };
    });
    return "item" in result
      ? Response.json(flattenRestaurant(result.item!))
      : Response.json({ message: result.error }, { status: result.status });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  const version = versionSchema.safeParse(
    new URL(request.url).searchParams.get("version"),
  );
  if (!version.success)
    return Response.json(
      { message: "삭제할 버전을 확인해주세요." },
      { status: 400 },
    );
  try {
    const { id } = await params;
    const result = await prisma.restaurant.deleteMany({
      where: { id, updatedAt: new Date(version.data) },
    });
    return result.count
      ? new Response(null, { status: 204 })
      : Response.json(
          {
            message: "다른 화면에서 변경되었거나 삭제됐어요. 새로고침해주세요.",
          },
          { status: 409 },
        );
  } catch (error) {
    return apiError(error);
  }
}
