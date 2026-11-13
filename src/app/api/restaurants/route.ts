import { access, privateHeaders } from "@/shared/lib/personal-access";
import { prisma } from "@/shared/lib/prisma";
import {
  catalogSelect,
  flattenRestaurant,
  listCatalog,
  categoryIdsSchema,
} from "@/shared/lib/catalog";
import { savePersonal, catalogFailure } from "@/shared/lib/personal-catalog";
import { z } from "zod";
const schema = z.object({
  googlePlaceId: z.string().trim().min(1).max(512),
  categoryIds: categoryIdsSchema,
  expectedUpdatedAt: z.string().datetime().optional(),
});
export async function GET(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const url = new URL(request.url),
    ownerId = a.user.id;
  if (url.searchParams.has("page")) return listCatalog(url, ownerId);
  const placeId = url.searchParams.get("placeId");
  if (placeId !== null) {
    const row = await prisma.restaurant.findFirst({
      where: { ownerId, googlePlaceId: placeId },
      select: catalogSelect,
    });
    return Response.json(row ? flattenRestaurant(row) : null, {
      headers: privateHeaders,
    });
  }
  const rows = await prisma.restaurant.findMany({
    where: { ownerId },
    take: 200,
    select: catalogSelect,
  });
  return Response.json(rows.map(flattenRestaurant), {
    headers: privateHeaders,
  });
}
export async function POST(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const b = schema.safeParse(await request.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { message: "장소와 카테고리를 확인해주세요." },
      { status: 400 },
    );
  try {
    return Response.json(
      await savePersonal(
        a.user.id,
        b.data.googlePlaceId,
        b.data.categoryIds,
        b.data.expectedUpdatedAt,
      ),
      { headers: privateHeaders },
    );
  } catch (e) {
    return catalogFailure(e);
  }
}
