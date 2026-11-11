export interface Place {
  placeId: string;
  name: string;
  address: string;
}
export type CategoryKind = "FOOD" | "PURPOSE" | "UNCLASSIFIED";
export type EditableCategoryKind = Exclude<CategoryKind, "UNCLASSIFIED">;
export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
}
export interface Restaurant {
  id: string;
  googlePlaceId: string;
  categories: Category[];
}
export interface SaveInput {
  googlePlaceId: string;
  categoryIds: string[];
}
export const MIN_SEARCH_LENGTH = 2;
export const MAX_CATEGORY_LENGTH = 20;
export const normalizeCategoryName = (name: string) =>
  name.trim().replace(/\s+/g, " ");

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function isCategory(value: unknown): value is Category {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    ["FOOD", "PURPOSE", "UNCLASSIFIED"].includes(String(value.kind))
  );
}
function isPlace(value: unknown): value is Place {
  return (
    record(value) &&
    typeof value.placeId === "string" &&
    typeof value.name === "string" &&
    typeof value.address === "string"
  );
}
function isRestaurant(value: unknown): value is Restaurant {
  return (
    record(value) &&
    typeof value.id === "string" &&
    typeof value.googlePlaceId === "string" &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategory)
  );
}

export class RegistrationApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public resetAt?: string) {
    super(message); this.name = "RegistrationApiError";
  }
}
export function isSearchBlocked(error: unknown): error is RegistrationApiError {
  return error instanceof RegistrationApiError && ["SEARCH_LIMIT_REACHED", "SEARCH_PROVIDER_LIMIT", "SEARCH_BUDGET_UNCONFIGURED", "SEARCH_BUDGET_UNAVAILABLE", "SEARCH_DISABLED"].includes(error.code ?? "");
}

/** Same DTO contract for web and native. No Google content is persisted on device. */
export function createRegistrationApi(
  baseUrl = "",
  fetcher: typeof fetch = fetch,
) {
  const origin = baseUrl.replace(/\/+$/, "");
  async function request(path: string, init?: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetcher(`${origin}${path}`, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new RegistrationApiError(
          record(body) && typeof body.message === "string"
            ? body.message
            : "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.",
          response.status,
          record(body) && typeof body.code === "string" ? body.code : undefined,
          record(body) && typeof body.resetAt === "string" ? body.resetAt : undefined,
        );
      }
      return body;
    } catch (error) {
      if (controller.signal.aborted)
        throw new Error(
          "응답이 늦어지고 있어요. 연결을 확인하고 다시 시도해주세요.",
        );
      if (error instanceof TypeError)
        throw new Error(
          "서버에 연결하지 못했어요. 네트워크 연결을 확인해주세요.",
        );
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    async search(query: string): Promise<Place[]> {
      const trimmed = query.trim();
      if (trimmed.length < MIN_SEARCH_LENGTH)
        throw new Error(`검색어를 ${MIN_SEARCH_LENGTH}자 이상 입력해주세요.`);
      const body = await request(
        `/api/places/search?${new URLSearchParams({ q: trimmed })}`,
      );
      if (!Array.isArray(body) || !body.every(isPlace))
        throw new Error("장소 검색 응답을 확인하지 못했어요.");
      return body;
    },
    async categories(): Promise<Category[]> {
      const body = await request("/api/categories");
      if (
        !record(body) ||
        !Array.isArray(body.items) ||
        !body.items.every(isCategory)
      )
        throw new Error("카테고리 응답을 확인하지 못했어요.");
      return body.items;
    },
    async createCategory(input: { name: string; kind: EditableCategoryKind }): Promise<Category> {
      const normalized = normalizeCategoryName(input.name);
      if (!normalized || normalized.length > MAX_CATEGORY_LENGTH)
        throw new Error(
          `카테고리는 1~${MAX_CATEGORY_LENGTH}자로 입력해주세요.`,
        );
      const body = await request("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalized, kind: input.kind }),
      });
      if (!isCategory(body))
        throw new Error("생성된 카테고리를 확인하지 못했어요.");
      return body;
    },
    async findSaved(placeId: string): Promise<Restaurant | null> {
      const body = await request(`/api/restaurants?${new URLSearchParams({ placeId })}`);
      if (body !== null && !isRestaurant(body)) throw new Error("저장된 카테고리를 확인하지 못했어요.");
      return body;
    },
    async save(input: SaveInput): Promise<Restaurant> {
      const body = await request("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!isRestaurant(body))
        throw new Error("저장 결과를 확인하지 못했어요.");
      return body;
    },
  };
}
export type RegistrationApi = ReturnType<typeof createRegistrationApi>;
