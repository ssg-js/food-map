-- AlterEnum
ALTER TYPE "CategoryKind" ADD VALUE 'DISH';

-- DropForeignKey
ALTER TABLE "RestaurantCategory" DROP CONSTRAINT "RestaurantCategory_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantCategory" DROP CONSTRAINT "RestaurantCategory_categoryId_fkey";

-- DropIndex
DROP INDEX "Restaurant_googlePlaceId_key";

-- DropIndex
DROP INDEX "Category_kind_name_key";

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "RestaurantCategory" ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "username" TEXT,
    "displayUsername" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BootstrapState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'READY',

    CONSTRAINT "BootstrapState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "api" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "ApiUsage_mode_scope_period_idx" ON "ApiUsage"("mode", "scope", "period");

-- CreateIndex
CREATE INDEX "Restaurant_ownerId_createdAt_idx" ON "Restaurant"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_ownerId_googlePlaceId_key" ON "Restaurant"("ownerId", "googlePlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_ownerId_id_key" ON "Restaurant"("ownerId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Category_ownerId_kind_name_key" ON "Category"("ownerId", "kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_ownerId_id_key" ON "Category"("ownerId", "id");

-- Preserve existing shared records under an unloginable quarantine identity.
INSERT INTO "User" (id,name,email,"emailVerified",role,"createdAt","updatedAt") VALUES ('__legacy_quarantine__','Legacy quarantine','quarantine@local.invalid',false,'QUARANTINED',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
UPDATE "Restaurant" SET "ownerId"='__legacy_quarantine__' WHERE "ownerId" IS NULL;
UPDATE "Category" SET "ownerId"='__legacy_quarantine__' WHERE "ownerId" IS NULL;
UPDATE "RestaurantCategory" SET "ownerId"='__legacy_quarantine__' WHERE "ownerId" IS NULL;
ALTER TABLE "Restaurant" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "RestaurantCategory" ALTER COLUMN "ownerId" SET NOT NULL;
INSERT INTO "BootstrapState" (id,state) VALUES ('personal','READY');

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCategory" ADD CONSTRAINT "RestaurantCategory_ownerId_restaurantId_fkey" FOREIGN KEY ("ownerId", "restaurantId") REFERENCES "Restaurant"("ownerId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCategory" ADD CONSTRAINT "RestaurantCategory_ownerId_categoryId_fkey" FOREIGN KEY ("ownerId", "categoryId") REFERENCES "Category"("ownerId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

