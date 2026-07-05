import type { Restaurant } from "@/entities/restaurant/type/restaurant";

import type { RestaurantFilterState } from "../model/restaurant-filter";

function isRestaurant(value: unknown): value is Restaurant {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const restaurant = value as Record<string, unknown>;

  return (
    typeof restaurant.id === "string" &&
    typeof restaurant.name === "string" &&
    typeof restaurant.address === "string" &&
    typeof restaurant.category === "string" &&
    typeof restaurant.latitude === "number" &&
    typeof restaurant.longitude === "number" &&
    typeof restaurant.rating === "number" &&
    typeof restaurant.description === "string"
  );
}

function parseRestaurants(value: unknown): Restaurant[] {
  if (!Array.isArray(value) || !value.every(isRestaurant)) {
    throw new Error("맛집 목록 응답 형식이 올바르지 않습니다.");
  }

  return value;
}

function buildRestaurantsUrl(filter: RestaurantFilterState): string {
  const searchParams = new URLSearchParams();
  const searchTerm = filter.searchTerm.trim();

  if (searchTerm) {
    searchParams.set("search", searchTerm);
  }

  if (filter.selectedCategory) {
    searchParams.set("category", filter.selectedCategory);
  }

  const queryString = searchParams.toString();

  return queryString ? `/api/restaurants?${queryString}` : "/api/restaurants";
}

export async function fetchRestaurants(
  filter: RestaurantFilterState,
): Promise<Restaurant[]> {
  const response = await fetch(buildRestaurantsUrl(filter));

  if (!response.ok) {
    throw new Error("맛집 목록을 불러오지 못했습니다.");
  }

  const data: unknown = await response.json();

  return parseRestaurants(data);
}
