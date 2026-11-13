import { requirePageUser } from "@/shared/lib/personal-access";
import { CategoryManager } from "@/features/catalog/components/CategoryManager";
export const metadata = { title: "카테고리 관리 · 맛집지도" };
export default async function CategoriesPage() {
  await requirePageUser();
  return <CategoryManager />;
}
