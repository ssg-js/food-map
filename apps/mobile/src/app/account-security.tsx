import { router } from "expo-router";
import { AccountTools } from "../features/auth/AccountTools";
import { usePersonalAuth } from "../features/auth/AuthGate";
export default function Security() {
  const { clearSession } = usePersonalAuth();
  return (
    <AccountTools
      onClose={() => router.back()}
      onSignedOut={async () => {
        router.replace("/");
        await clearSession();
      }}
    />
  );
}
