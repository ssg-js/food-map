import { prisma } from "@/shared/lib/prisma";
import { requireOperator } from "@/shared/lib/operator-access";
import { categoryInput, versionSchema, apiError } from "@/shared/lib/catalog";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  const body = categoryInput.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return Response.json(
      {
        message:
          "이름은 1~20자, 분류는 음식 종류 또는 방문 목적을 선택해주세요.",
      },
      { status: 400 },
    );
  try {
    const { id } = await params;
    const changed = await prisma.category.updateMany({
      where: { id, updatedAt: new Date(body.data.expectedUpdatedAt) },
      data: {
        name: body.data.name,
        kind: body.data.kind,
        updatedAt: new Date(
          Math.max(Date.now(), Date.parse(body.data.expectedUpdatedAt) + 1),
        ),
      },
    });
    if (!changed.count)
      return Response.json(
        { message: "다른 화면에서 변경되었거나 삭제됐어요. 새로고침해주세요." },
        { status: 409 },
      );
    return Response.json(
      await prisma.category.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          kind: true,
          updatedAt: true,
          _count: { select: { restaurants: true } },
        },
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  const denied = await requireOperator(request);
  if (denied) return denied;
  const version = versionSchema.safeParse(
    new URL(request.url).searchParams.get("version"),
  );
  if (!version.success)
    return Response.json(
      { message: "삭제할 버전을 확인해주세요." },
      { status: 400 },
    );
  try {
    const { id } = await params;
    const changed = await prisma.category.deleteMany({
      where: { id, updatedAt: new Date(version.data) },
    });
    return changed.count
      ? new Response(null, { status: 204 })
      : Response.json(
          {
            message: "다른 화면에서 변경되었거나 삭제됐어요. 새로고침해주세요.",
          },
          { status: 409 },
        );
  } catch (error) {
    return apiError(error);
  }
}
