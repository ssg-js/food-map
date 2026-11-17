import { readJsonRequest } from "@/shared/lib/json-body";
import { privateJson } from "@/shared/lib/private-response";
import { access, privateHeaders } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import { categoryInput } from "@/shared/lib/catalog";
import { catalogFailure } from "@/shared/lib/personal-catalog";
export async function GET(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  return privateJson(
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
  const json = await readJsonRequest(request);
  if (!json.ok) return json.response;
  const b = categoryInput
    .omit({ expectedUpdatedAt: true })
    .safeParse(json.value);
  if (!b.success)
    return privateJson(
      { message: "1~20자 이름과 분류를 확인해주세요." },
      { status: 400 },
    );
  try {
    return privateJson(
      await prisma.category.create({ data: { ...b.data, ownerId: a.user.id } }),
      { status: 201 },
    );
  } catch (e) {
    return catalogFailure(e);
  }
}
