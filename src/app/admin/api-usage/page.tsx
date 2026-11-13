import { requirePageUser } from "@/shared/lib/personal-access";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/widgets/admin/ui/AdminDashboard";
export const metadata = {
  title: "API 사용량 · 맛집지도",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  const u = await requirePageUser();
  if (u.role !== "OPERATOR") notFound();
  return <AdminDashboard />;
}
