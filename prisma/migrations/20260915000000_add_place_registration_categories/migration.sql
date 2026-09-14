-- Existing Restaurant rows are development-only seed data without a Google place identity,
-- so they cannot be migrated to the required googlePlaceId column.
DELETE FROM "Restaurant";

-- DropIndex
DROP INDEX "Restaurant_category_idx";

-- DropIndex
DROP INDEX "Restaurant_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "Restaurant"
    DROP COLUMN "name",
    DROP COLUMN "address",
    DROP COLUMN "category",
    DROP COLUMN "latitude",
    DROP COLUMN "longitude",
    DROP COLUMN "rating",
    DROP COLUMN "description",
    ADD COLUMN "googlePlaceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantCategory" (
    "restaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "RestaurantCategory_pkey" PRIMARY KEY ("restaurantId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_googlePlaceId_key" ON "Restaurant"("googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "RestaurantCategory_categoryId_idx" ON "RestaurantCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "RestaurantCategory" ADD CONSTRAINT "RestaurantCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCategory" ADD CONSTRAINT "RestaurantCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
