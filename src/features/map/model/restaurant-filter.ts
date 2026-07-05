import type { Restaurant } from "@/entities/restaurant/type/restaurant";

export interface RestaurantFilterState {
  searchTerm: string;
  selectedCategory: string | null;
}

export function getRestaurantCategories(restaurants: Restaurant[]): string[] {
  return Array.from(
    new Set(restaurants.map((restaurant) => restaurant.category)),
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

export function hasActiveRestaurantFilter(
  filter: RestaurantFilterState,
): boolean {
  return filter.searchTerm.trim().length > 0 || filter.selectedCategory !== null;
}
