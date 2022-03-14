/*
  Warnings:

  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[A,B]` on the table `_SpaceToTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mimetype` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `Tag` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `B` on the `_SpaceToTag` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TagEnum" AS ENUM ('FLOOR_1', 'FLOOR_2', 'FLOOR_3UP', 'HOUSE_ROOM', 'FLAT_ROOM', 'BASEMENT', 'GARAGE', 'STORAGE_ROOM', 'INDUSTRIAL_WAREHOUSE', 'OFFICE_ROOM', 'PENTHOUSE', 'ELEVATOR', 'WET', 'DRY', 'COLD', 'WARM', 'HOT', 'SECURITY_ALARM', 'VIDEO_MONITORING', 'FIRE_ALARM', 'GROUND_FLOOR', 'SOCKET', 'INDOOR', 'OUTDOOR', 'NARROW_ACCESS', 'MEDIUM_WIDTH_ACCESS', 'WIDE_ACCESS');

-- DropForeignKey
ALTER TABLE "_SpaceToTag" DROP CONSTRAINT "_SpaceToTag_B_fkey";

-- DropIndex
DROP INDEX "Image_spaceId_key";

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "mimetype" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_pkey",
DROP COLUMN "id",
DROP COLUMN "key",
DROP COLUMN "value",
ADD COLUMN     "tag" "TagEnum" NOT NULL,
ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("tag");

-- AlterTable
ALTER TABLE "_SpaceToTag" DROP COLUMN "B",
ADD COLUMN     "B" "TagEnum" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "_SpaceToTag_AB_unique" ON "_SpaceToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SpaceToTag_B_index" ON "_SpaceToTag"("B");

-- AddForeignKey
ALTER TABLE "_SpaceToTag" ADD FOREIGN KEY ("B") REFERENCES "Tag"("tag") ON DELETE CASCADE ON UPDATE CASCADE;
