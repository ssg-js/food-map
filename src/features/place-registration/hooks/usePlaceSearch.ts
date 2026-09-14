"use client";

import { useQuery } from "@tanstack/react-query";

import { MIN_PLACE_SEARCH_QUERY_LENGTH } from "@/shared/constants/place-search";

import { searchPlaces } from "../api/search-places";
import { placeQueryKeys } from "../model/query-keys";

const PLACE_SEARCH_STALE_TIME_MS = 5 * 60 * 1000;

export function usePlaceSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: placeQueryKeys.search(normalizedQuery),
    queryFn: () => searchPlaces(normalizedQuery),
    enabled: normalizedQuery.length >= MIN_PLACE_SEARCH_QUERY_LENGTH,
    staleTime: PLACE_SEARCH_STALE_TIME_MS,
  });
}
