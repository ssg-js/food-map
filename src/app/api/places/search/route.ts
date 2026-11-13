import { externalMode, placesFetch } from "@/shared/lib/google-places/provider";
import { access } from "@/shared/lib/personal-access";
import { reservePersonalRequest } from "@/shared/lib/google-places/personal-budget";

import { handlePlaceSearch } from "@/shared/lib/google-places/search-handler";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  return handlePlaceSearch(request, {
    enabled:
      externalMode() === "mock" || process.env.GOOGLE_PLACES_ENABLED === "true",
    apiKey:
      externalMode() === "mock" ? "mock" : process.env.GOOGLE_PLACES_API_KEY,
    reserve: () => reservePersonalRequest(a.user.id, "SEARCH"),
    fetcher: placesFetch(),
  });
}
