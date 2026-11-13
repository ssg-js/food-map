import { requirePageUser } from "@/shared/lib/personal-access";
import { SavedRestaurants } from "@/features/catalog/components/SavedRestaurants";
export const metadata = { title: "저장한 맛집 · 맛집지도" };
export default async function SavedPage() {
  await requirePageUser();
  return (
    <SavedRestaurants
      mode={process.env.EXTERNAL_API_MODE === "live" ? "live" : "mock"}
      mapKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
