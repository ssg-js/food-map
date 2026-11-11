import { PrismaClient } from "@prisma/client";

import { SEED_CATEGORIES } from "./seed-data/categories";

const prisma = new PrismaClient();

async function main() {
  for (const name of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { kind_name: { kind: "UNCLASSIFIED", name } },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${SEED_CATEGORIES.length} categories.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
