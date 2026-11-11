import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/shared/lib/prisma";

const CATEGORY_NAME_MAX_LENGTH = 20;

const createCategoryBodySchema = z.object({
  name: z.string(),
  kind: z.enum(["FOOD", "PURPOSE"]),
});

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export async function GET() {
  try {
    const items = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        kind: true,
        updatedAt: true,
        _count: { select: { restaurants: true } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch categories", error);

    return NextResponse.json(
      { message: "카테고리 목록을 불러오지 못했습니다." },
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

  const parsedBody = createCategoryBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "카테고리 이름과 음식 종류 또는 방문 목적 구분이 필요합니다.",
      },
      { status: 400 },
    );
  }

  const name = normalizeCategoryName(parsedBody.data.name);

  if (!name) {
    return NextResponse.json(
      { message: "카테고리 이름을 입력해주세요." },
      { status: 400 },
    );
  }

  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return NextResponse.json(
      {
        message: `카테고리 이름은 ${CATEGORY_NAME_MAX_LENGTH}자 이하여야 합니다.`,
      },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.category.create({
      data: { name, kind: parsedBody.data.kind },
      select: {
        id: true,
        name: true,
        kind: true,
        updatedAt: true,
        _count: { select: { restaurants: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "이미 존재하는 카테고리입니다." },
        { status: 409 },
      );
    }

    console.error("Failed to create category", error);

    return NextResponse.json(
      { message: "카테고리를 생성하지 못했습니다." },
      { status: 500 },
    );
  }
}
