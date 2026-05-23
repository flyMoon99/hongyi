-- AlterTable: add soft-delete columns to inspections
ALTER TABLE "inspections"
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: add soft-delete columns to experiments
ALTER TABLE "experiments"
  ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
