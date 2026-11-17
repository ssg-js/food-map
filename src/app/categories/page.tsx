import { requirePageUser } from "@/shared/lib/personal-access";
import { CategoryManager } from "@/features/catalog/components/CategoryManager";
export const metadata = { title: "카테고리 관리 · 맛집지도" };
export default async function CategoriesPage() {
  const user = await requirePageUser();
  return <CategoryManager key={user.id} ownerId={user.id} />;
}
