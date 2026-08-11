import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

import { buildRestaurantWhere, getRestaurantQueryParams } from "./query";

const RESTAURANT_RESULT_LIMIT = 200;

export async function GET(request: Request) {
  try {
    const where = buildRestaurantWhere(getRestaurantQueryParams(request));
    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      take: RESTAURANT_RESULT_LIMIT,
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
