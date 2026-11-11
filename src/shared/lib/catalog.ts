import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
export const catalogSelect = {
  id: true,
  googlePlaceId: true,
  updatedAt: true,
  categories: {
    select: {
      category: {
        select: { id: true, name: true, kind: true, updatedAt: true },
      },
    },
    orderBy: { category: { name: "asc" as const } },
  },
} satisfies Prisma.RestaurantSelect;
export const versionSchema = z.string().datetime();
export const categoryIdsSchema = z
  .array(z.string().trim().min(1).max(100))
  .max(100)
  .transform((ids) => [...new Set(ids)]);
export const categoryInput = z.object({
  name: z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1).max(20)),
  kind: z.enum(["FOOD", "PURPOSE"]),
  expectedUpdatedAt: versionSchema,
});
export function flattenRestaurant(
  row: Prisma.RestaurantGetPayload<{ select: typeof catalogSelect }>,
) {
  return { ...row, categories: row.categories.map((r) => r.category) };
}
export function apiError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return Response.json(
      { message: "같은 분류에 이미 있는 카테고리 이름이에요." },
      { status: 409 },
    );
  return Response.json(
    { message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." },
    { status: 500 },
  );
}
export async function listCatalog(url: URL) {
  const rawPage = url.searchParams.get("page") ?? "1";
  if (!/^\d+$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > 100000)
    return Response.json(
      { message: "페이지가 올바르지 않아요." },
      { status: 400 },
    );
  const page = Number(rawPage),
    pageSize = 12;
  const food = url.searchParams.getAll("food").filter(Boolean),
    purpose = url.searchParams.getAll("purpose").filter(Boolean);
  if (food.length + purpose.length > 100)
    return Response.json({ message: "필터가 너무 많아요." }, { status: 400 });
  const where: Prisma.RestaurantWhereInput = {
    AND: [
      ...(food.length
        ? [
            {
              categories: {
                some: {
                  categoryId: { in: food },
                  category: { kind: "FOOD" as const },
                },
              },
            },
          ]
        : []),
      ...(purpose.length
        ? [
            {
              categories: {
                some: {
                  categoryId: { in: purpose },
                  category: { kind: "PURPOSE" as const },
                },
              },
            },
          ]
        : []),
    ],
  };
  const [rows, total] = await prisma.$transaction([
    prisma.restaurant.findMany({
      where,
      select: catalogSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.restaurant.count({ where }),
  ]);
  return Response.json(
    { items: rows.map(flattenRestaurant), total, page, pageSize },
    { headers: { "Cache-Control": "no-store" } },
  );
}
