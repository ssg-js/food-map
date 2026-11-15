import { requirePageUser } from "@/shared/lib/personal-access";
import { AccountSecurityForm } from "@/features/auth/AccountSecurityForm";
export const metadata = {
  title: "계정 보안 · 맛집지도",
  robots: { index: false, follow: false },
};
export default async function Security() {
  await requirePageUser();
  return <AccountSecurityForm />;
}
