-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL DEFAULT 'support@airservice.com',
    "phone" TEXT NOT NULL DEFAULT '02-XXX-XXXX',
    "hours" TEXT NOT NULL DEFAULT 'จันทร์-ศุกร์ 08:00-17:00 น.',
    "updatedAt" TIMESTAMP(3) NOT NULL
);
