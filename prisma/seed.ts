import { PrismaClient } from "@prisma/client";

import { SEED_RESTAURANTS } from "./seed-data/restaurants";

const prisma = new PrismaClient();

async function main() {
  for (const restaurant of SEED_RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: restaurant,
      create: restaurant,
    });
  }

  console.log(`Seeded ${SEED_RESTAURANTS.length} restaurants.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
