"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRestaurants } from "../api/fetch-restaurants";
import type { RestaurantFilterState } from "../model/restaurant-filter";

const DEFAULT_RESTAURANT_FILTER: RestaurantFilterState = {
  searchTerm: "",
  selectedCategory: null,
};

function normalizeRestaurantFilter(
  filter: RestaurantFilterState,
): RestaurantFilterState {
  return {
    searchTerm: filter.searchTerm.trim(),
    selectedCategory: filter.selectedCategory,
  };
}

const restaurantQueryKeys = {
  all: ["restaurants"] as const,
  list: (filter: RestaurantFilterState) =>
    [
      ...restaurantQueryKeys.all,
      "list",
      normalizeRestaurantFilter(filter),
    ] as const,
};

export function useRestaurants(
  filter: RestaurantFilterState = DEFAULT_RESTAURANT_FILTER,
) {
  const normalizedFilter = normalizeRestaurantFilter(filter);

  return useQuery({
    queryKey: restaurantQueryKeys.list(normalizedFilter),
    queryFn: () => fetchRestaurants(normalizedFilter),
  });
}
