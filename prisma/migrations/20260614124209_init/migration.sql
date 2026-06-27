-- CreateEnum
CREATE TYPE "Province" AS ENUM ('KOSHI', 'MADHESH', 'BAGMATI', 'GANDAKI', 'LUMBINI', 'KARNALI', 'SUDURPASHCHIM');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('URBAN', 'PERI_URBAN', 'RURAL');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('GOVERNMENT', 'COMMUNITY', 'PRIVATE', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "SchoolContactRole" AS ENUM ('PRINCIPAL', 'TEACHER', 'ADMINISTRATOR', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentRange" AS ENUM ('UNDER_100', 'RANGE_100_500', 'RANGE_500_1000', 'OVER_1000');

-- CreateEnum
CREATE TYPE "ElectricityAvailability" AS ENUM ('RELIABLE_GRID', 'LOAD_SHEDDING', 'NO_GRID');

-- CreateEnum
CREATE TYPE "InternetConnectivity" AS ENUM ('RELIABLE', 'INTERMITTENT', 'NONE');

-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('NEPALI', 'ENGLISH');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccessMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "IndividualRole" AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'RESEARCHER_NGO', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "school_registration_drafts" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT,
    "contactName" TEXT,
    "contactRole" "SchoolContactRole",
    "contactOther" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "province" "Province",
    "district" TEXT,
    "areaType" "AreaType",
    "schoolType" "SchoolType",
    "enrollment" "EnrollmentRange",
    "electricity" "ElectricityAvailability",
    "connectivity" "InternetConnectivity",
    "language" "PreferredLanguage",
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_registration_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactRole" "SchoolContactRole" NOT NULL,
    "contactOther" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "province" "Province" NOT NULL,
    "district" TEXT NOT NULL,
    "areaType" "AreaType" NOT NULL,
    "schoolType" "SchoolType" NOT NULL,
    "enrollment" "EnrollmentRange" NOT NULL,
    "electricity" "ElectricityAvailability" NOT NULL,
    "connectivity" "InternetConnectivity" NOT NULL,
    "language" "PreferredLanguage" NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'PENDING',
    "accessMode" "AccessMode",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "schoolId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individuals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "IndividualRole" NOT NULL,
    "roleOther" TEXT,
    "school" TEXT,
    "whyInterested" TEXT,
    "isSubscribed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_audits" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 0,
    "diesel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lpg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "genDiesel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acUnits" INTEGER NOT NULL DEFAULT 0,
    "electricity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heatingFuel" TEXT NOT NULL DEFAULT 'none',
    "solar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wasteKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "segregation" TEXT NOT NULL DEFAULT 'none',
    "composting" BOOLEAN NOT NULL DEFAULT false,
    "recycling" BOOLEAN NOT NULL DEFAULT false,
    "buses" INTEGER NOT NULL DEFAULT 0,
    "busKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "students" INTEGER NOT NULL DEFAULT 0,
    "commuteMode" TEXT NOT NULL DEFAULT 'mixed',
    "submittedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carbon_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carbon_results" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "totalEmissions" DOUBLE PRECISION NOT NULL,
    "scope1Emissions" DOUBLE PRECISION NOT NULL,
    "scope2Emissions" DOUBLE PRECISION NOT NULL,
    "scope3Emissions" DOUBLE PRECISION NOT NULL,
    "emissionsPerStudent" DOUBLE PRECISION,
    "breakdown" JSONB NOT NULL,
    "rating" TEXT,
    "recommendations" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_registration_drafts_email_key" ON "school_registration_drafts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "schools_email_key" ON "schools"("email");

-- CreateIndex
CREATE INDEX "schools_province_idx" ON "schools"("province");

-- CreateIndex
CREATE INDEX "schools_district_idx" ON "schools"("district");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_schoolId_idx" ON "users"("schoolId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "individuals_email_key" ON "individuals"("email");

-- CreateIndex
CREATE INDEX "individuals_email_idx" ON "individuals"("email");

-- CreateIndex
CREATE INDEX "individuals_role_idx" ON "individuals"("role");

-- CreateIndex
CREATE INDEX "carbon_audits_schoolId_idx" ON "carbon_audits"("schoolId");

-- CreateIndex
CREATE INDEX "carbon_audits_academicYear_idx" ON "carbon_audits"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_audits_schoolId_academicYear_month_key" ON "carbon_audits"("schoolId", "academicYear", "month");

-- CreateIndex
CREATE UNIQUE INDEX "carbon_results_auditId_key" ON "carbon_results"("auditId");

-- CreateIndex
CREATE INDEX "carbon_results_auditId_idx" ON "carbon_results"("auditId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_audits" ADD CONSTRAINT "carbon_audits_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carbon_results" ADD CONSTRAINT "carbon_results_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "carbon_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
