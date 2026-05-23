-- AlterTable: inspections add responsiblePersonId
ALTER TABLE "inspections" ADD COLUMN "responsiblePersonId" TEXT;

-- Backfill: set a default for existing rows (use first non-admin employee if exists)
-- This is safe: existing rows get NULL, then we make it required
UPDATE "inspections" i
SET "responsiblePersonId" = (
  SELECT e.id FROM "employees" e
  WHERE e.role != 'ADMIN'
  ORDER BY e."createdAt" ASC
  LIMIT 1
)
WHERE i."responsiblePersonId" IS NULL;

-- Make the column NOT NULL after backfill
ALTER TABLE "inspections" ALTER COLUMN "responsiblePersonId" SET NOT NULL;

-- AddForeignKey: inspections.responsiblePersonId -> employees.id
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_responsiblePersonId_fkey"
  FOREIGN KEY ("responsiblePersonId") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: experiments add responsiblePersonId
ALTER TABLE "experiments" ADD COLUMN "responsiblePersonId" TEXT;

-- Backfill existing rows
UPDATE "experiments" ex
SET "responsiblePersonId" = (
  SELECT e.id FROM "employees" e
  WHERE e.role != 'ADMIN'
  ORDER BY e."createdAt" ASC
  LIMIT 1
)
WHERE ex."responsiblePersonId" IS NULL;

-- Make the column NOT NULL after backfill
ALTER TABLE "experiments" ALTER COLUMN "responsiblePersonId" SET NOT NULL;

-- AddForeignKey: experiments.responsiblePersonId -> employees.id
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_responsiblePersonId_fkey"
  FOREIGN KEY ("responsiblePersonId") REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
