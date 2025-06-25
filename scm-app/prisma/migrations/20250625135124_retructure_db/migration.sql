/*
  Warnings:

  - You are about to drop the column `blockchainTx` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Listing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `quantity` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PLANTED', 'HARVESTED', 'SHIPPED', 'DELIVERED');

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_userId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_toUserId_fkey";

-- AlterTable
ALTER TABLE "Shipment" DROP COLUMN "blockchainTx",
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "trackingKey" TEXT;

-- DropTable
DROP TABLE "Inventory";

-- DropTable
DROP TABLE "Listing";

-- DropTable
DROP TABLE "Order";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "quantity" INTEGER,
    "batchId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductEvent_txHash_key" ON "ProductEvent"("txHash");

-- CreateIndex
CREATE INDEX "idx_event_batch" ON "ProductEvent"("batchId");

-- CreateIndex
CREATE INDEX "idx_event_shipment" ON "ProductEvent"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_event_user" ON "ProductEvent"("userId");

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
