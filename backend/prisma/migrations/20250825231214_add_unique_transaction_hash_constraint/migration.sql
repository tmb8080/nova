/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash,currency]` on the table `deposits` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "deposits_transactionHash_currency_key" ON "deposits"("transactionHash", "currency");
