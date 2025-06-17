/*
  Warnings:

  - You are about to drop the column `batchNumber` on the `BatchProduct` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BatchProduct_batchNumber_key";

-- AlterTable
ALTER TABLE "BatchProduct" DROP COLUMN "batchNumber";
