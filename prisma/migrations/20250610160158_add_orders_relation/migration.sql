/*
  Warnings:

  - You are about to drop the `_UserPurchases` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "_UserPurchases" DROP CONSTRAINT "_UserPurchases_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserPurchases" DROP CONSTRAINT "_UserPurchases_B_fkey";

-- DropTable
DROP TABLE "_UserPurchases";

-- CreateTable
CREATE TABLE "UserPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiWorkerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiWorkerId" TEXT NOT NULL,
    "cycles" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpaySignature" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "invoiceFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_aiWorkerId_key" ON "UserPurchase"("userId", "aiWorkerId");

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPurchase" ADD CONSTRAINT "UserPurchase_aiWorkerId_fkey" FOREIGN KEY ("aiWorkerId") REFERENCES "AIWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_aiWorkerId_fkey" FOREIGN KEY ("aiWorkerId") REFERENCES "AIWorker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
