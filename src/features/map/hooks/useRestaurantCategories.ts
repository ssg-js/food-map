"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRestaurantCategories } from "../api/fetch-restaurant-categories";
import type { RestaurantFilterState } from "../model/restaurant-filter";

function normalizeCategoryFilter(
  filter: RestaurantFilterState,
): Pick<RestaurantFilterState, "searchTerm" | "bounds"> {
  return {
    searchTerm: filter.searchTerm.trim(),
    bounds: filter.bounds,
  };
}

const restaurantCategoryQueryKeys = {
  all: ["restaurant-categories"] as const,
  list: (filter: RestaurantFilterState) =>
    [
      ...restaurantCategoryQueryKeys.all,
      "list",
      normalizeCategoryFilter(filter),
    ] as const,
};

export function useRestaurantCategories(filter: RestaurantFilterState) {
  const normalizedFilter = {
    ...filter,
    ...normalizeCategoryFilter(filter),
    selectedCategory: null,
  };

  return useQuery({
    queryKey: restaurantCategoryQueryKeys.list(normalizedFilter),
    queryFn: () => fetchRestaurantCategories(normalizedFilter),
  });
}
