-- CreateTable
CREATE TABLE "company_wallets" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_wallet_transactions" (
    "id" TEXT NOT NULL,
    "companyWalletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "transactionHash" TEXT,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_wallets_network_key" ON "company_wallets"("network");

-- AddForeignKey
ALTER TABLE "company_wallet_transactions" ADD CONSTRAINT "company_wallet_transactions_companyWalletId_fkey" FOREIGN KEY ("companyWalletId") REFERENCES "company_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
