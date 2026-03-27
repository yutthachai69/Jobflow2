-- Add locked, lockedUntil, lockedReason to User (account lock feature)
ALTER TABLE "User" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lockedReason" TEXT;

CREATE INDEX "User_locked_lockedUntil_idx" ON "User"("locked", "lockedUntil");
