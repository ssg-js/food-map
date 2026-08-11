"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRestaurants } from "../api/fetch-restaurants";
import type { RestaurantFilterState } from "../model/restaurant-filter";

const DEFAULT_RESTAURANT_FILTER: RestaurantFilterState = {
  searchTerm: "",
  selectedCategory: null,
  bounds: null,
};

function normalizeRestaurantFilter(
  filter: RestaurantFilterState,
): RestaurantFilterState {
  return {
    searchTerm: filter.searchTerm.trim(),
    selectedCategory: filter.selectedCategory,
    bounds: filter.bounds,
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
  enabled = true,
) {
  const normalizedFilter = normalizeRestaurantFilter(filter);

  return useQuery({
    queryKey: restaurantQueryKeys.list(normalizedFilter),
    queryFn: () => fetchRestaurants(normalizedFilter),
    enabled,
  });
}
