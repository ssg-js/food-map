import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

import {
  buildRestaurantWhere,
  getRestaurantQueryParams,
} from "../restaurants/query";

interface RestaurantCategoryOption {
  name: string;
  totalCount: number;
  boundsCount: number;
}

export async function GET(request: Request) {
  try {
    const query = getRestaurantQueryParams(request);
    const totalWhere = buildRestaurantWhere(query, {
      includeBounds: false,
      includeCategory: false,
    });
    const boundsWhere = buildRestaurantWhere(query, {
      includeBounds: true,
      includeCategory: false,
    });
    const [totalGroups, boundsGroups] = await Promise.all([
      prisma.restaurant.groupBy({
        by: ["category"],
        where: totalWhere,
        _count: {
          _all: true,
        },
        orderBy: {
          category: "asc",
        },
      }),
      prisma.restaurant.groupBy({
        by: ["category"],
        where: boundsWhere,
        _count: {
          _all: true,
        },
      }),
    ]);
    const boundsCountByCategory = new Map(
      boundsGroups.map((group) => [group.category, group._count._all]),
    );
    const categories: RestaurantCategoryOption[] = totalGroups.map((group) => ({
      name: group.category,
      totalCount: group._count._all,
      boundsCount: boundsCountByCategory.get(group.category) ?? 0,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch restaurant categories", error);

    return NextResponse.json(
      { message: "맛집 카테고리를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
