-- Additive-only migration: creates the Phase-2/3 + Lessons tables.
-- NOTE: the live DB has drifted (extra `student_daily_footprints` table and
-- `users.className`/`rollNo` columns that are not in schema.prisma). This
-- migration intentionally does NOT touch them — it only ADDS new objects.

-- CreateEnum
CREATE TYPE "RecAudience" AS ENUM ('STUDENT', 'SCHOOL');

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "audience" "RecAudience" NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "category" TEXT,
    "triggerKey" TEXT,
    "triggerValues" TEXT[],
    "icon" TEXT NOT NULL DEFAULT '🌱',
    "titleEn" TEXT,
    "titleNe" TEXT,
    "textEn" TEXT NOT NULL,
    "textNe" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 5,
    "co2SavedKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🌱',
    "color" TEXT NOT NULL DEFAULT '#16a34a',
    "category" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleNe" TEXT NOT NULL,
    "descEn" TEXT NOT NULL,
    "descNe" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "questions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factors" (
    "key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_ruleKey_key" ON "recommendations"("ruleKey");

-- CreateIndex
CREATE INDEX "recommendations_audience_idx" ON "recommendations"("audience");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_order_key" ON "lessons"("order");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
