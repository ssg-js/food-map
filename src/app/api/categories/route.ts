import { access, privateHeaders } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import { categoryInput } from "@/shared/lib/catalog";
import { catalogFailure } from "@/shared/lib/personal-catalog";
export async function GET(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  return Response.json(
    {
      items: await prisma.category.findMany({
        where: { ownerId: a.user.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          kind: true,
          updatedAt: true,
          _count: { select: { restaurants: true } },
        },
      }),
    },
    { headers: privateHeaders },
  );
}
export async function POST(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const b = categoryInput
    .omit({ expectedUpdatedAt: true })
    .safeParse(await request.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { message: "1~20자 이름과 분류를 확인해주세요." },
      { status: 400 },
    );
  try {
    return Response.json(
      await prisma.category.create({ data: { ...b.data, ownerId: a.user.id } }),
      { status: 201 },
    );
  } catch (e) {
    return catalogFailure(e);
  }
}
