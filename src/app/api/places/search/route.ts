import {externalMode,placesFetch} from "@/shared/lib/google-places/provider";
import { prisma } from "@/shared/lib/prisma";
import { reserveSearchRequest } from "@/shared/lib/google-places/search-budget";
import { handlePlaceSearch } from "@/shared/lib/google-places/search-handler";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return handlePlaceSearch(request, {
    enabled: externalMode()==="mock" || process.env.GOOGLE_PLACES_ENABLED === "true",
    apiKey: externalMode()==="mock"?"mock":process.env.GOOGLE_PLACES_API_KEY,
    reserve: () =>
      externalMode()==="mock"?Promise.resolve():reserveSearchRequest(
        prisma,
        process.env.GOOGLE_SEARCH_LIMITS_DISABLED !== "true",
      ),
    fetcher: placesFetch(),
  });
}
