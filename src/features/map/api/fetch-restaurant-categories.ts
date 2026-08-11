import type {
  RestaurantCategoryOption,
  RestaurantFilterState,
} from "../model/restaurant-filter";

function isRestaurantCategoryOption(
  value: unknown,
): value is RestaurantCategoryOption {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const category = value as Record<string, unknown>;

  return (
    typeof category.name === "string" &&
    typeof category.totalCount === "number" &&
    typeof category.boundsCount === "number"
  );
}

function parseRestaurantCategories(value: unknown): RestaurantCategoryOption[] {
  if (!Array.isArray(value) || !value.every(isRestaurantCategoryOption)) {
    throw new Error("맛집 카테고리 응답 형식이 올바르지 않습니다.");
  }

  return value;
}

function buildRestaurantCategoriesUrl(filter: RestaurantFilterState): string {
  const searchParams = new URLSearchParams();
  const searchTerm = filter.searchTerm.trim();

  if (searchTerm) {
    searchParams.set("search", searchTerm);
  }

  if (filter.bounds) {
    searchParams.set("north", String(filter.bounds.north));
    searchParams.set("south", String(filter.bounds.south));
    searchParams.set("east", String(filter.bounds.east));
    searchParams.set("west", String(filter.bounds.west));
  }

  const queryString = searchParams.toString();

  return queryString
    ? `/api/restaurant-categories?${queryString}`
    : "/api/restaurant-categories";
}

export async function fetchRestaurantCategories(
  filter: RestaurantFilterState,
): Promise<RestaurantCategoryOption[]> {
  const response = await fetch(buildRestaurantCategoriesUrl(filter));

  if (!response.ok) {
    throw new Error("맛집 카테고리를 불러오지 못했습니다.");
  }

  const data: unknown = await response.json();

  return parseRestaurantCategories(data);
}
