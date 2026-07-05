import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
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
