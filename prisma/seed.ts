import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES } from "./seed-data/categories";
const db=new PrismaClient();
async function main(){const ownerId=process.env.SEED_OWNER_ID;if(!ownerId||!await db.user.findFirst({where:{id:ownerId,role:{not:"QUARANTINED"}}}))throw new Error("SEED_OWNER_ID must identify an existing personal user");for(const name of SEED_CATEGORIES)await db.category.upsert({where:{ownerId_kind_name:{ownerId,kind:"UNCLASSIFIED",name}},create:{ownerId,name},update:{}});}
main().catch(()=>{console.error("Seed requires an explicit account; no global categories created.");process.exitCode=1;}).finally(()=>db.$disconnect());
