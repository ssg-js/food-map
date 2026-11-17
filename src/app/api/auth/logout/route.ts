import { auth } from "@/shared/lib/auth";
import { access, privateHeaders } from "@/shared/lib/personal-access";
export async function POST(request: Request) {
  const a = await access(request);
  if (a.denied) return a.denied;
  const response = await auth.api.signOut({
    headers: request.headers,
    asResponse: true,
  });
  for (const [name, value] of Object.entries(privateHeaders))
    response.headers.set(name, value);
  return response;
}
