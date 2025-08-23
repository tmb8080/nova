-- AlterTable
ALTER TABLE "admin_settings" ALTER COLUMN "minWithdrawalAmount" SET DEFAULT 10;

-- CreateTable
CREATE TABLE "user_wallet_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallet_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orphan_transactions" (
    "id" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matchedDepositId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orphan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_addresses_userId_network_key" ON "user_wallet_addresses"("userId", "network");

-- CreateIndex
CREATE UNIQUE INDEX "orphan_transactions_transactionHash_key" ON "orphan_transactions"("transactionHash");

-- AddForeignKey
ALTER TABLE "user_wallet_addresses" ADD CONSTRAINT "user_wallet_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
