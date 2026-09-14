"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCategories } from "../api/fetch-categories";
import { categoryQueryKeys } from "../model/query-keys";

const CATEGORY_STALE_TIME_MS = 5 * 60 * 1000;

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.list(),
    queryFn: fetchCategories,
    staleTime: CATEGORY_STALE_TIME_MS,
  });
}
