import { requirePageUser } from "@/shared/lib/personal-access";
import { SavedRestaurants } from "@/features/catalog/components/SavedRestaurants";
export const metadata = { title: "저장한 맛집 · 맛집지도" };
export default async function SavedPage() {
  const user = await requirePageUser();
  return (
    <SavedRestaurants
      key={user.id}
      ownerId={user.id}
      mode={process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock"}
      mapKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
