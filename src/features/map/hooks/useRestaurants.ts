"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRestaurants } from "../api/fetch-restaurants";

const restaurantQueryKeys = {
  all: ["restaurants"] as const,
  list: () => [...restaurantQueryKeys.all, "list"] as const,
};

export function useRestaurants() {
  return useQuery({
    queryKey: restaurantQueryKeys.list(),
    queryFn: fetchRestaurants,
  });
}
