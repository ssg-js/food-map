import { notFound } from "next/navigation";
import { prisma } from "@/shared/lib/prisma";
import { AccountForm } from "@/features/auth/AccountForm";
export const dynamic = "force-dynamic";
export default async function Setup() {
  if (
    !process.env.PERSONAL_SETUP_TOKEN ||
    (await prisma.user.count({ where: { role: { not: "QUARANTINED" } } }))
  )
    notFound();
  return <AccountForm setup />;
}
