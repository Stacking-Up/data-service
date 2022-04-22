/*
  Warnings:

  - You are about to drop the `_ItemToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `city` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `Space` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishDate` to the `Space` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ItemToUser" DROP CONSTRAINT "_ItemToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_ItemToUser" DROP CONSTRAINT "_ItemToUser_B_fkey";

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "renterConfirmation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "endHour" TIME(6),
ADD COLUMN     "province" TEXT NOT NULL,
ADD COLUMN     "publishDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startHour" TIME(6);

-- DropTable
DROP TABLE "_ItemToUser";

-- CreateTable
CREATE TABLE "ItemsOnUsers" (
    "amount" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "ItemsOnUsers_pkey" PRIMARY KEY ("itemId","ownerId")
);

-- AddForeignKey
ALTER TABLE "ItemsOnUsers" ADD CONSTRAINT "ItemsOnUsers_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemsOnUsers" ADD CONSTRAINT "ItemsOnUsers_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
