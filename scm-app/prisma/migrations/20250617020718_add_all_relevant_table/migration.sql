-- CreateEnum
CREATE TYPE "ProduceType" AS ENUM ('BUTTERHEAD', 'LOOSELEAF', 'OAKLEAF', 'ROMAINE', 'SPINACH');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('ORDERED', 'OUTOFDELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PASSTOLOGISTICS', 'OUTOFDELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BatchProduct" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "produceType" "ProduceType" NOT NULL,
    "description" TEXT,
    "plantingDate" TIMESTAMP(3) NOT NULL,
    "harvestDate" TIMESTAMP(3),
    "quantity" INTEGER,
    "blockchainTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "farmerId" TEXT NOT NULL,

    CONSTRAINT "BatchProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'ORDERED',
    "shippedDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "blockchainTx" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batchId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batchId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatchProduct_batchNumber_key" ON "BatchProduct"("batchNumber");

-- CreateIndex
CREATE INDEX "idx_shipment_batch" ON "Shipment"("batchId");

-- CreateIndex
CREATE INDEX "idx_shipment_from_user" ON "Shipment"("fromUserId");

-- CreateIndex
CREATE INDEX "idx_shipment_to_user" ON "Shipment"("toUserId");

-- CreateIndex
CREATE INDEX "idx_order_batch" ON "Order"("batchId");

-- CreateIndex
CREATE INDEX "idx_order_from_user" ON "Order"("fromUserId");

-- CreateIndex
CREATE INDEX "idx_order_to_user" ON "Order"("toUserId");

-- CreateIndex
CREATE INDEX "idx_inventory_user" ON "Inventory"("userId");

-- CreateIndex
CREATE INDEX "idx_inventory_batch" ON "Inventory"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_userId_batchId_key" ON "Inventory"("userId", "batchId");

-- CreateIndex
CREATE INDEX "idx_listing_inventory_date" ON "Listing"("inventoryId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_listing_seller" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "idx_listing_inventory" ON "Listing"("inventoryId");

-- AddForeignKey
ALTER TABLE "BatchProduct" ADD CONSTRAINT "BatchProduct_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
