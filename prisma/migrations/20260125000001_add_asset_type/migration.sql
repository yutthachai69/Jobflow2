-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "assetType" TEXT NOT NULL DEFAULT 'AIR_CONDITIONER';

-- CreateIndex
CREATE INDEX "Asset_assetType_idx" ON "Asset"("assetType");
