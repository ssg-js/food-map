import { auth } from "@/shared/lib/auth";
import { access } from "@/shared/lib/personal-access";
export async function POST(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  return auth.api.signOut({ headers: request.headers, asResponse: true });
}
