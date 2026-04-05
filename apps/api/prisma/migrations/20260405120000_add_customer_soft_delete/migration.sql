-- AlterTable
ALTER TABLE "customers" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customers" ADD COLUMN "deletedAt" TIMESTAMP(3);
