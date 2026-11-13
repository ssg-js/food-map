import { sessionHeaders, setSessionToken } from "./session";
import {
  RegistrationApiError,
  type Place,
  type Category,
  type Restaurant,
  type EditableCategoryKind,
} from "./api";
export interface CatalogPage {
  items: Restaurant[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CatalogFilters {
  food: string[];
  purpose: string[];
  dish?: string[];
  q?: string;
  page: number;
}

export function createCatalogApi(baseUrl = "", fetcher: typeof fetch = fetch) {
  const origin = baseUrl.replace(/\/+$/, "");
  async function request(path: string, init?: RequestInit): Promise<unknown> {
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 20000);
    const abort = () => controller.abort();
    if (init?.signal?.aborted) abort();
    else init?.signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await fetcher(origin + path, {
        ...init,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...sessionHeaders(),
          ...init?.headers,
        },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new RegistrationApiError(
          body?.message ?? "요청에 실패했어요. 다시 시도해주세요.",
          response.status,
          body?.code,
        );
      return body;
    } catch (error) {
      if (controller.signal.aborted)
        throw new Error(
          "요청이 취소되었거나 응답이 늦어지고 있어요. 다시 시도해주세요.",
        );
      if (error instanceof TypeError)
        throw new Error("서버에 연결하지 못했어요. 네트워크를 확인해주세요.");
      throw error;
    } finally {
      clearTimeout(timeout);
      init?.signal?.removeEventListener("abort", abort);
    }
  }
  return {
    async list(filters: CatalogFilters): Promise<CatalogPage> {
      const q = new URLSearchParams({ page: String(filters.page) });
      filters.food.forEach((id) => q.append("food", id));
      filters.purpose.forEach((id) => q.append("purpose", id));
      filters.dish?.forEach((id) => q.append("dish", id));
      if (filters.q) q.set("q", filters.q);
      const body = (await request(`/api/restaurants?${q}`)) as CatalogPage;
      if (!Array.isArray(body?.items) || typeof body.total !== "number")
        throw new Error("목록 응답을 확인해주세요.");
      return body;
    },
    async details(id: string, signal?: AbortSignal): Promise<Place> {
      const body = (await request(`/api/places/${encodeURIComponent(id)}`, {
        signal,
      })) as Place;
      if (typeof body?.name !== "string" || typeof body.placeId !== "string")
        throw new Error("장소 정보를 확인해주세요.");
      return body;
    },
    async categories(): Promise<Category[]> {
      const body = (await request("/api/categories")) as { items: Category[] };
      if (!Array.isArray(body?.items))
        throw new Error("카테고리를 확인해주세요.");
      return body.items;
    },
    async updateRestaurant(item: Restaurant, categoryIds: string[]) {
      return request(`/api/restaurants/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryIds,
          expectedUpdatedAt: item.updatedAt,
        }),
      });
    },
    async deleteRestaurant(item: Restaurant) {
      return request(
        `/api/restaurants/${encodeURIComponent(item.id)}?${new URLSearchParams({ version: item.updatedAt ?? "" })}`,
        { method: "DELETE" },
      );
    },
    async updateCategory(
      item: Category,
      name: string,
      kind: EditableCategoryKind,
    ) {
      return request(`/api/categories/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ name, kind, expectedUpdatedAt: item.updatedAt }),
      });
    },
    async deleteCategory(item: Category) {
      return request(
        `/api/categories/${encodeURIComponent(item.id)}?${new URLSearchParams({ version: item.updatedAt ?? "" })}`,
        { method: "DELETE" },
      );
    },
    async login(username: string, password: string) {
      const r = (await request("/api/auth/login", {
        method: "POST",
        headers: origin ? { "x-food-map-client": "native" } : {},
        body: JSON.stringify({ username, password }),
      })) as { token?: string };
      setSessionToken(r.token || "");
      return r.token || "";
    },
    async session() {
      return request("/api/auth/session") as Promise<{
        user: { id: string; username: string; role: string } | null;
      }>;
    },
    async authenticated() {
      return !!(await this.session()).user;
    },
    async logout() {
      await request("/api/auth/logout", { method: "POST" });
      setSessionToken("");
    },
  };
}
export type CatalogApi = ReturnType<typeof createCatalogApi>;
