-- DropColumn clientId, AddColumn siteId (User -> Site)
ALTER TABLE "User" ADD COLUMN "siteId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" DROP COLUMN "clientId";
