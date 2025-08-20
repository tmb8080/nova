-- AlterTable
ALTER TABLE "referral_bonuses" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "vipPaymentId" TEXT,
ALTER COLUMN "depositId" DROP NOT NULL;
