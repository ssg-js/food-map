import { isAdmin } from "@/shared/lib/admin-access";
import { AdminDashboard } from "@/widgets/admin/ui/AdminDashboard";
import { AdminLogin } from "@/features/admin/components/AdminLogin";
export const metadata = { title: "API 사용량 · 맛집지도 관리자", robots: {index:false,follow:false} };
export default async function AdminUsagePage() { return await isAdmin() ? <AdminDashboard /> : <AdminLogin />; }
