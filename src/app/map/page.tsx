import { requirePageUser } from "@/shared/lib/personal-access";
import { RegistrationScreen } from "@/widgets/registration/ui/registration-screen";
export default async function MapPage() {
  await requirePageUser();
  return <RegistrationScreen />;
}
