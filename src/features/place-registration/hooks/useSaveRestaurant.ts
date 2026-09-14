"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveRestaurant } from "../api/save-restaurant";
import { restaurantQueryKeys } from "../model/query-keys";

export function useSaveRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveRestaurant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: restaurantQueryKeys.all,
      });
    },
  });
}
