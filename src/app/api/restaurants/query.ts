import type { Prisma } from "@prisma/client";

export interface RestaurantBoundsParams {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface RestaurantQueryParams {
  search: string;
  category: string | null;
  bounds: RestaurantBoundsParams | null;
}

interface RestaurantWhereOptions {
  includeCategory?: boolean;
  includeBounds?: boolean;
}

function parseNumberSearchParam(
  searchParams: URLSearchParams,
  key: keyof RestaurantBoundsParams,
): number | null {
  const value = searchParams.get(key);
  if (value === null) return null;

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getBoundsSearchParams(
  searchParams: URLSearchParams,
): RestaurantBoundsParams | null {
  const north = parseNumberSearchParam(searchParams, "north");
  const south = parseNumberSearchParam(searchParams, "south");
  const east = parseNumberSearchParam(searchParams, "east");
  const west = parseNumberSearchParam(searchParams, "west");

  if (north === null || south === null || east === null || west === null) {
    return null;
  }

  if (south > north || west > east) {
    return null;
  }

  return { north, south, east, west };
}

export function getRestaurantQueryParams(
  request: Request,
): RestaurantQueryParams {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || null;
  const bounds = getBoundsSearchParams(searchParams);

  return { search, category, bounds };
}

export function buildRestaurantWhere(
  { search, category, bounds }: RestaurantQueryParams,
  {
    includeCategory = true,
    includeBounds = true,
  }: RestaurantWhereOptions = {},
): Prisma.RestaurantWhereInput {
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

  if (includeCategory && category) {
    conditions.push({ category });
  }

  if (includeBounds && bounds) {
    conditions.push({
      latitude: {
        gte: bounds.south,
        lte: bounds.north,
      },
      longitude: {
        gte: bounds.west,
        lte: bounds.east,
      },
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}
