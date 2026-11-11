import type { Category } from "@/entities/category/type/category";

export interface Restaurant {
  id: string;
  googlePlaceId: string;
  updatedAt?: string;
  categories: Category[];
}
