/*
  Warnings:

  - You are about to drop the column `acUnits` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `busKm` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `buses` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `commuteMode` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `composting` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `diesel` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `electricity` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `genDiesel` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `heatingFuel` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `lpg` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `recycling` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `segregation` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `solar` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `students` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `wasteKg` on the `carbon_audits` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `carbon_results` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EmissionScope" AS ENUM ('SCOPE_1', 'SCOPE_2', 'SCOPE_3');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('ELECTRICITY', 'GENERATOR_FUEL', 'VEHICLE_FUEL', 'COOKING_FUEL', 'REFRIGERANT', 'COMMUTE', 'PAPER', 'FOOD', 'WASTE');

-- CreateEnum
CREATE TYPE "DataTier" AS ENUM ('MEASURED', 'ESTIMATED', 'DEFAULT');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CALCULATED');

-- AlterTable
ALTER TABLE "carbon_audits" DROP COLUMN "acUnits",
DROP COLUMN "busKm",
DROP COLUMN "buses",
DROP COLUMN "commuteMode",
DROP COLUMN "composting",
DROP COLUMN "diesel",
DROP COLUMN "electricity",
DROP COLUMN "genDiesel",
DROP COLUMN "heatingFuel",
DROP COLUMN "lpg",
DROP COLUMN "recycling",
DROP COLUMN "segregation",
DROP COLUMN "solar",
DROP COLUMN "students",
DROP COLUMN "wasteKg",
ADD COLUMN     "enrollment" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "AuditStatus" NOT NULL DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "carbon_results" DROP COLUMN "rating",
ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "partiallyDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tier1Pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tier2Pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tier3Pct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "activity_data" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "scope" "EmissionScope" NOT NULL,
    "tier" "DataTier" NOT NULL,
    "activityValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "inputs" JSONB,
    "emissions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_data_auditId_idx" ON "activity_data"("auditId");

-- CreateIndex
CREATE INDEX "activity_data_category_idx" ON "activity_data"("category");

-- AddForeignKey
ALTER TABLE "activity_data" ADD CONSTRAINT "activity_data_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "carbon_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
