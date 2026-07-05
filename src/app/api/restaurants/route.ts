import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

interface RestaurantSearchParams {
  search: string;
  category: string | null;
}

function getRestaurantSearchParams(request: Request): RestaurantSearchParams {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || null;

  return { search, category };
}

function buildRestaurantWhere({
  search,
  category,
}: RestaurantSearchParams): Prisma.RestaurantWhereInput {
  const conditions: Prisma.RestaurantWhereInput[] = [];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (category) {
    conditions.push({ category });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function GET(request: Request) {
  try {
    const where = buildRestaurantWhere(getRestaurantSearchParams(request));
    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        address: true,
        category: true,
        latitude: true,
        longitude: true,
        rating: true,
        description: true,
      },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("Failed to fetch restaurants", error);

    return NextResponse.json(
      { message: "맛집 목록을 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
