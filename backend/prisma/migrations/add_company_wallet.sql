-- CreateTable
CREATE TABLE "CompanyWallet" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyWallet_network_key" ON "CompanyWallet"("network");

-- CreateTable
CREATE TABLE "CompanyWalletTransaction" (
    "id" TEXT NOT NULL,
    "companyWalletId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- DEPOSIT, WITHDRAWAL
    "amount" DECIMAL(18,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "transactionHash" TEXT,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompanyWalletTransaction" ADD CONSTRAINT "CompanyWalletTransaction_companyWalletId_fkey" FOREIGN KEY ("companyWalletId") REFERENCES "CompanyWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
