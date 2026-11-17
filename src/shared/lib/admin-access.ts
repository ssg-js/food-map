import { headers } from "next/headers";
import { currentUser } from "./auth";
export async function isAdmin() {
  return (await currentUser(await headers()))?.role === "OPERATOR";
}
export { privateHeaders } from "./private-response";
