-- AlterTable
ALTER TABLE "FinancialPlan" ADD COLUMN     "installmentAmount" DECIMAL(15,2),
ADD COLUMN     "installmentMonths" INTEGER,
ADD COLUMN     "isInstallment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlySavingAmount" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "PlanSaving" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "savingDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanSaving_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanSaving_householdId_planId_idx" ON "PlanSaving"("householdId", "planId");

-- CreateIndex
CREATE INDEX "PlanSaving_planId_savingDate_idx" ON "PlanSaving"("planId", "savingDate");

-- AddForeignKey
ALTER TABLE "PlanSaving" ADD CONSTRAINT "PlanSaving_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSaving" ADD CONSTRAINT "PlanSaving_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FinancialPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSaving" ADD CONSTRAINT "PlanSaving_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
