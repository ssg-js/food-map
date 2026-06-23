import type { Restaurant } from "@/entities/restaurant/type/restaurant";

export interface RestaurantFilterState {
  searchTerm: string;
  selectedCategory: string | null;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearchTerm(restaurant: Restaurant, searchTerm: string): boolean {
  const normalizedSearchTerm = normalizeSearchText(searchTerm);

  if (!normalizedSearchTerm) {
    return true;
  }

  return [restaurant.name, restaurant.address, restaurant.category].some(
    (value) => normalizeSearchText(value).includes(normalizedSearchTerm),
  );
}

function matchesCategory(
  restaurant: Restaurant,
  selectedCategory: string | null,
): boolean {
  return selectedCategory === null || restaurant.category === selectedCategory;
}

export function filterRestaurants(
  restaurants: Restaurant[],
  filter: RestaurantFilterState,
): Restaurant[] {
  return restaurants.filter(
    (restaurant) =>
      matchesSearchTerm(restaurant, filter.searchTerm) &&
      matchesCategory(restaurant, filter.selectedCategory),
  );
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
