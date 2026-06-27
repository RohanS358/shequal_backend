-- Add WATER to the ActivityCategory enum (Scope 3, water-supply pumping proxy).
-- Postgres 12+ allows ADD VALUE outside an explicit transaction; the value is
-- only USED by inserts after this migration commits.
ALTER TYPE "ActivityCategory" ADD VALUE IF NOT EXISTS 'WATER';
