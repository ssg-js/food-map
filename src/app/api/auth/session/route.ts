import { currentUser } from "@/shared/lib/auth";
import { privateHeaders } from "@/shared/lib/personal-access";
export async function GET(request: Request) {
  return Response.json(
    { user: await currentUser(request.headers) },
    { headers: privateHeaders },
  );
}
