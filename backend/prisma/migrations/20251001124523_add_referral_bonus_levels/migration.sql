-- AlterTable
ALTER TABLE "admin_settings" ADD COLUMN     "referralBonusLevel1Rate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
ADD COLUMN     "referralBonusLevel2Rate" DECIMAL(5,4) NOT NULL DEFAULT 0.02,
ADD COLUMN     "referralBonusLevel3Rate" DECIMAL(5,4) NOT NULL DEFAULT 0.01;
