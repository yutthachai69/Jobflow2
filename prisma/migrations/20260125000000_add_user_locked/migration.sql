-- Add locked, lockedUntil, lockedReason to User (account lock feature)
ALTER TABLE "User" ADD COLUMN "locked" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" DATETIME;
ALTER TABLE "User" ADD COLUMN "lockedReason" TEXT;

CREATE INDEX "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
