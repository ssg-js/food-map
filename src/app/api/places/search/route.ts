import { NextResponse } from "next/server";

import type { PlaceSearchResult } from "@/entities/place/type/place";
import { MIN_PLACE_SEARCH_QUERY_LENGTH } from "@/shared/constants/place-search";

const GOOGLE_PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_FIELD_MASK =
  "places.id,places.displayName.text,places.formattedAddress";

interface GooglePlaceTextSearchResponse {
  places?: GooglePlace[];
}

interface GooglePlace {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
}

function getSearchQuery(request: Request): string {
  const { searchParams } = new URL(request.url);

  return searchParams.get("q")?.trim() ?? "";
}

function isGooglePlacesEnabled(): boolean {
  return process.env.GOOGLE_PLACES_ENABLED === "true";
}

function toPlaceSearchResult(place: GooglePlace): PlaceSearchResult | null {
  const placeId = place.id?.trim();
  const name = place.displayName?.text?.trim();
  const address = place.formattedAddress?.trim();

  if (!placeId || !name || !address) {
    return null;
  }

  return {
    placeId,
    name,
    address,
  };
}

function parseGooglePlacesResponse(
  value: GooglePlaceTextSearchResponse,
): PlaceSearchResult[] {
  return (value.places ?? [])
    .map(toPlaceSearchResult)
    .filter((place): place is PlaceSearchResult => place !== null);
}

export async function GET(request: Request) {
  const query = getSearchQuery(request);

  if (query.length < MIN_PLACE_SEARCH_QUERY_LENGTH) {
    return NextResponse.json(
      {
        message: `검색어를 ${MIN_PLACE_SEARCH_QUERY_LENGTH}자 이상 입력해주세요.`,
      },
      { status: 400 },
    );
  }

  if (!isGooglePlacesEnabled()) {
    return NextResponse.json(
      { message: "Google Places 검색 기능이 비활성화되어 있습니다." },
      { status: 503 },
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { message: "Google Places API key가 설정되어 있지 않습니다." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch Google Places", {
        status: response.status,
        statusText: response.statusText,
      });

      return NextResponse.json(
        { message: "Google Places 검색에 실패했습니다." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as GooglePlaceTextSearchResponse;

    return NextResponse.json(parseGooglePlacesResponse(data));
  } catch (error) {
    console.error("Failed to fetch Google Places", error);

    return NextResponse.json(
      { message: "Google Places 검색에 실패했습니다." },
      { status: 502 },
    );
  }
}
