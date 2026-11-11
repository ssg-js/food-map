import { NextResponse } from "next/server";
import { z } from "zod";

import type { Restaurant } from "@/entities/restaurant/type/restaurant";
import { prisma } from "@/shared/lib/prisma";

const RESTAURANT_RESULT_LIMIT = 200;

const saveRestaurantBodySchema = z.object({
  googlePlaceId: z.string(),
  categoryIds: z.array(z.string()),
});

const restaurantSelect = {
  id: true,
  googlePlaceId: true,
  categories: {
    select: {
      category: {
        select: { id: true, name: true, kind: true },
      },
    },
    orderBy: {
      category: { name: "asc" },
    },
  },
} as const;

interface RestaurantRecord {
  id: string;
  googlePlaceId: string;
  categories: { category: { id: string; name: string; kind: "FOOD" | "PURPOSE" | "UNCLASSIFIED" } }[];
}

/** Thrown inside the save transaction when a requested category does not exist. */
class UnknownCategoryError extends Error {}

function toRestaurant(record: RestaurantRecord): Restaurant {
  return {
    id: record.id,
    googlePlaceId: record.googlePlaceId,
    categories: record.categories.map(({ category }) => category),
  };
}

function normalizeCategoryIds(categoryIds: string[]): string[] {
  return [
    ...new Set(categoryIds.map((categoryId) => categoryId.trim()).filter(Boolean)),
  ];
}

export async function GET(request: Request) {
  try {
    const placeId = new URL(request.url).searchParams.get("placeId");
    if (placeId !== null) {
      if (!placeId.trim() || placeId.length > 512) return NextResponse.json({ message: "장소 ID가 올바르지 않습니다." }, { status: 400 });
      const restaurant = await prisma.restaurant.findUnique({ where: { googlePlaceId: placeId }, select: restaurantSelect });
      return NextResponse.json(restaurant ? toRestaurant(restaurant) : null, { headers: { "Cache-Control": "no-store" } });
    }
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "asc" },
      take: RESTAURANT_RESULT_LIMIT,
      select: restaurantSelect,
    });

    return NextResponse.json(restaurants.map(toRestaurant));
  } catch (error) {
    console.error("Failed to fetch restaurants", error);

    return NextResponse.json(
      { message: "맛집 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "요청 본문 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsedBody = saveRestaurantBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "googlePlaceId와 categoryIds가 필요합니다." },
      { status: 400 },
    );
  }

  const googlePlaceId = parsedBody.data.googlePlaceId.trim();

  if (!googlePlaceId) {
    return NextResponse.json(
      { message: "googlePlaceId를 입력해주세요." },
      { status: 400 },
    );
  }

  const categoryIds = normalizeCategoryIds(parsedBody.data.categoryIds);

  try {
    const restaurant = await prisma.$transaction(async (tx) => {
      if (categoryIds.length > 0) {
        const existingCategories = await tx.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true },
        });

        if (existingCategories.length !== categoryIds.length) {
          throw new UnknownCategoryError();
        }
      }

      const saved = await tx.restaurant.upsert({
        where: { googlePlaceId },
        update: {},
        create: { googlePlaceId },
        select: { id: true },
      });

      await tx.restaurantCategory.deleteMany({
        where:
          categoryIds.length > 0
            ? { restaurantId: saved.id, categoryId: { notIn: categoryIds } }
            : { restaurantId: saved.id },
      });

      if (categoryIds.length > 0) {
        await tx.restaurantCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            restaurantId: saved.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.restaurant.findUniqueOrThrow({
        where: { id: saved.id },
        select: restaurantSelect,
      });
    });

    return NextResponse.json(toRestaurant(restaurant));
  } catch (error) {
    if (error instanceof UnknownCategoryError) {
      return NextResponse.json(
        { message: "존재하지 않는 카테고리가 포함되어 있습니다." },
        { status: 400 },
      );
    }

    console.error("Failed to save restaurant", error);

    return NextResponse.json(
      { message: "맛집을 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
