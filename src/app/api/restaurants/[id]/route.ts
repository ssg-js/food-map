import { readJsonRequest } from "@/shared/lib/json-body";
import { privateJson } from "@/shared/lib/private-response";
import { access, privateHeaders } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import { categoryIdsSchema, versionSchema } from "@/shared/lib/catalog";
import { savePersonal, catalogFailure } from "@/shared/lib/personal-catalog";
import { z } from "zod";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const json = await readJsonRequest(request);
  if (!json.ok) return json.response;
  const b = z
    .object({
      categoryIds: categoryIdsSchema,
      expectedUpdatedAt: versionSchema,
    })
    .safeParse(json.value);
  if (!b.success)
    return privateJson(
      { message: "카테고리와 버전을 확인해주세요." },
      { status: 400 },
    );
  try {
    return privateJson(
      await savePersonal(
        a.user.id,
        "",
        b.data.categoryIds,
        b.data.expectedUpdatedAt,
        (await params).id,
      ),
    );
  } catch (e) {
    return catalogFailure(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const id = (await params).id,
    version = versionSchema.safeParse(
      new URL(request.url).searchParams.get("version"),
    );
  if (!version.success)
    return privateJson({ message: "버전을 확인해주세요." }, { status: 400 });
  const row = await prisma.restaurant.findFirst({
    where: { id, ownerId: a.user.id },
  });
  if (!row)
    return privateJson({ message: "맛집을 찾을 수 없어요." }, { status: 404 });
  const changed = await prisma.restaurant.deleteMany({
    where: { id, ownerId: a.user.id, updatedAt: new Date(version.data) },
  });
  return changed.count
    ? new Response(null, { status: 204, headers: privateHeaders })
    : privateJson({ message: "다른 화면에서 변경됐어요." }, { status: 409 });
}
