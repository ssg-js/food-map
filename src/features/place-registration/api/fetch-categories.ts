import type { Category } from "@/entities/category/type/category";
import { readApiErrorMessage } from "@/shared/lib/api-error";

export function isCategory(value: unknown): value is Category {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const category = value as Record<string, unknown>;

  return typeof category.id === "string" && typeof category.name === "string";
}

function parseCategoryList(value: unknown): Category[] {
  if (typeof value !== "object" || value === null || !("items" in value)) {
    throw new Error("카테고리 목록 응답 형식이 올바르지 않습니다.");
  }

  const { items } = value as { items: unknown };

  if (!Array.isArray(items) || !items.every(isCategory)) {
    throw new Error("카테고리 목록 응답 형식이 올바르지 않습니다.");
  }

  return items;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories");

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, "카테고리 목록을 불러오지 못했습니다."),
    );
  }

  const data: unknown = await response.json();

  return parseCategoryList(data);
}
