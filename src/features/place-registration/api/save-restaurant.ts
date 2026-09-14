import type { Restaurant } from "@/entities/restaurant/type/restaurant";
import { readApiErrorMessage } from "@/shared/lib/api-error";

import { isCategory } from "./fetch-categories";

export interface SaveRestaurantInput {
  googlePlaceId: string;
  categoryIds: string[];
}

function isRestaurant(value: unknown): value is Restaurant {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const restaurant = value as Record<string, unknown>;

  return (
    typeof restaurant.id === "string" &&
    typeof restaurant.googlePlaceId === "string" &&
    Array.isArray(restaurant.categories) &&
    restaurant.categories.every(isCategory)
  );
}

export async function saveRestaurant(
  input: SaveRestaurantInput,
): Promise<Restaurant> {
  const response = await fetch("/api/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, "맛집을 저장하지 못했습니다."),
    );
  }

  const data: unknown = await response.json();

  if (!isRestaurant(data)) {
    throw new Error("맛집 저장 응답 형식이 올바르지 않습니다.");
  }

  return data;
}
