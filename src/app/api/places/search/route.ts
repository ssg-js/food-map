import { prisma } from "@/shared/lib/prisma";
import { reserveSearchRequest } from "@/shared/lib/google-places/search-budget";
import { handlePlaceSearch } from "@/shared/lib/google-places/search-handler";
export const runtime = "nodejs";
export async function GET(request: Request) {
  return handlePlaceSearch(request, {
    enabled: process.env.GOOGLE_PLACES_ENABLED === "true",
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
    reserve: () => reserveSearchRequest(prisma),
    fetcher: fetch,
  });
}
