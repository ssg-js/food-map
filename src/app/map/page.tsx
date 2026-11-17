import { requirePageUser } from "@/shared/lib/personal-access";
import { RegistrationScreen } from "@/widgets/registration/ui/registration-screen";
export default async function MapPage() {
  const user = await requirePageUser();
  return <RegistrationScreen ownerId={user.id} />;
}
