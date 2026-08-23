-- CreateEnum
CREATE TYPE "SavingsSourceType" AS ENUM ('GENERAL', 'WISHLIST', 'RENCANA', 'DANA_DARURAT');

-- AlterTable
ALTER TABLE "SavingsGoal" ADD COLUMN     "sourcePlanId" TEXT,
ADD COLUMN     "sourceType" "SavingsSourceType" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "SavingsGoal_householdId_sourceType_idx" ON "SavingsGoal"("householdId", "sourceType");

-- CreateIndex
CREATE INDEX "SavingsGoal_householdId_sourcePlanId_idx" ON "SavingsGoal"("householdId", "sourcePlanId");

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "FinancialPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
