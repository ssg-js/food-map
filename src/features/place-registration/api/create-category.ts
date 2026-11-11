import type { Category } from "@/entities/category/type/category";
import { readApiErrorMessage } from "@/shared/lib/api-error";

import { isCategory } from "./fetch-categories";

export async function createCategory(input: { name: string; kind: "FOOD" | "PURPOSE" }): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readApiErrorMessage(response, "카테고리를 생성하지 못했습니다."),
    );
  }

  const data: unknown = await response.json();

  if (!isCategory(data)) {
    throw new Error("카테고리 생성 응답 형식이 올바르지 않습니다.");
  }

  return data;
}
