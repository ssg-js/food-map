import { AccountSecurityForm } from "@/features/auth/AccountSecurityForm";
export const metadata = {
  title: "계정 찾기 · 맛집지도",
  robots: { index: false, follow: false },
};
export default function Recover() {
  return <AccountSecurityForm recover />;
}
