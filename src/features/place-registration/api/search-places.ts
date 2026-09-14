import type { PlaceSearchResult } from "@/entities/place/type/place";
import { readApiErrorMessage } from "@/shared/lib/api-error";

function isPlaceSearchResult(value: unknown): value is PlaceSearchResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const place = value as Record<string, unknown>;

  return (
    typeof place.placeId === "string" &&
    typeof place.name === "string" &&
    typeof place.address === "string"
  );
}

function parsePlaceSearchResults(value: unknown): PlaceSearchResult[] {
  if (!Array.isArray(value) || !value.every(isPlaceSearchResult)) {
    throw new Error("장소 검색 응답 형식이 올바르지 않습니다.");
  }

  return value;
}

export async function searchPlaces(
  query: string,
): Promise<PlaceSearchResult[]> {
  const searchParams = new URLSearchParams({ q: query });
  const response = await fetch(`/api/places/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, "장소 검색에 실패했습니다."),
    );
  }

  const data: unknown = await response.json();

  return parsePlaceSearchResults(data);
}
