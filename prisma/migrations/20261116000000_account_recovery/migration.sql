CREATE TABLE "RecoveryKey" (
 "userId" TEXT NOT NULL,
 "keyHash" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "RecoveryKey_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "RecoveryKey_keyHash_key" ON "RecoveryKey"("keyHash");
ALTER TABLE "RecoveryKey" ADD CONSTRAINT "RecoveryKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
