import { access, privateHeaders } from "./personal-access";
export async function requireOperator(request: Request) {
 const result = await access(request);
 if (result.denied) return result.denied;
 if (result.user.role !== "OPERATOR") return Response.json({message:"관리자 권한이 필요해요."}, {status:403,headers:privateHeaders});
 return null;
}
