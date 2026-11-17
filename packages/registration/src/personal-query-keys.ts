import type { CatalogFilters } from "./catalog-api";
function owner(ownerId: string) {
  if (!ownerId.trim())
    throw new Error("개인 데이터 쿼리에는 계정 식별자가 필요해요.");
  return ["personal", ownerId] as const;
}
/** Every active private query and invalidation uses the authenticated account namespace. */
export const personalQueryKeys = {
  all: owner,
  categories: (ownerId: string) => [...owner(ownerId), "categories"] as const,
  catalog: (ownerId: string) => [...owner(ownerId), "catalog"] as const,
  catalogList: (ownerId: string, filters: CatalogFilters) =>
    [...owner(ownerId), "catalog", filters] as const,
  place: (ownerId: string, placeId: string) =>
    [...owner(ownerId), "place-live", placeId] as const,
  session: (ownerId: string) => [...owner(ownerId), "session"] as const,
  registration: (
    ownerId: string,
    action: "create-category" | "save" | "find-saved" | "search",
  ) => [...owner(ownerId), "registration", action] as const,
};
