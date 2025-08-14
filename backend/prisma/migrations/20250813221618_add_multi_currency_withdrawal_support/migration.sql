/*
  Warnings:

  - You are about to drop the column `earningsAmount` on the `earnings_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `endsAt` on the `earnings_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `earnings_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isPaid` on the `earnings_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `earnings_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `earnings_sessions` table. All the data in the column will be lost.
  - Added the required column `dailyEarningRate` to the `earnings_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expectedEndTime` to the `earnings_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EarningSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'STOPPED');

-- AlterTable
ALTER TABLE "admin_settings" ADD COLUMN     "minUsdcWithdrawalAmount" DECIMAL(18,8) NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "earnings_sessions" DROP COLUMN "earningsAmount",
DROP COLUMN "endsAt",
DROP COLUMN "isActive",
DROP COLUMN "isPaid",
DROP COLUMN "paidAt",
DROP COLUMN "startedAt",
ADD COLUMN     "actualEndTime" TIMESTAMP(3),
ADD COLUMN     "dailyEarningRate" DECIMAL(18,8) NOT NULL,
ADD COLUMN     "expectedEndTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "EarningSessionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "totalEarnings" DECIMAL(18,8);

-- AlterTable
ALTER TABLE "withdrawals" ADD COLUMN     "network" TEXT;

-- CreateTable
CREATE TABLE "network_fees" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "feeAmount" DECIMAL(18,8) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "network_fees_network_currency_key" ON "network_fees"("network", "currency");

-- AddForeignKey
ALTER TABLE "earnings_sessions" ADD CONSTRAINT "earnings_sessions_vipLevelId_fkey" FOREIGN KEY ("vipLevelId") REFERENCES "vip_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
