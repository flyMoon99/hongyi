-- CreateEnum
CREATE TYPE "Company" AS ENUM ('HAODING_HONGYI', 'STATE_GRID');

-- CreateEnum
CREATE TYPE "FireInspectionFrequency" AS ENUM ('ANNUALLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "FireEquipment" AS ENUM ('GAS_SUPPRESSION', 'FIRE_EXTINGUISHER');

-- AlterTable: Employee add company column
ALTER TABLE "employees" ADD COLUMN "company" "Company";

-- AlterTable: Customer add company column
ALTER TABLE "customers" ADD COLUMN "company" "Company" NOT NULL DEFAULT 'HAODING_HONGYI';

-- AlterTable: Inspection add company column
ALTER TABLE "inspections" ADD COLUMN "company" "Company" NOT NULL DEFAULT 'HAODING_HONGYI';

-- AlterTable: Experiment add company column
ALTER TABLE "experiments" ADD COLUMN "company" "Company" NOT NULL DEFAULT 'HAODING_HONGYI';

-- CreateTable: station_rooms
CREATE TABLE "station_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "remark" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "company" "Company" NOT NULL DEFAULT 'STATE_GRID',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable: station_room_logs
CREATE TABLE "station_room_logs" (
    "id" TEXT NOT NULL,
    "stationRoomId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "station_room_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fire_inspections
CREATE TABLE "fire_inspections" (
    "id" TEXT NOT NULL,
    "stationRoomId" TEXT NOT NULL,
    "frequency" "FireInspectionFrequency" NOT NULL DEFAULT 'ANNUALLY',
    "responsiblePerson" TEXT NOT NULL,
    "equipment" "FireEquipment"[],
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "remark" TEXT,
    "contactPerson" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "company" "Company" NOT NULL DEFAULT 'STATE_GRID',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fire_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fire_inspection_logs
CREATE TABLE "fire_inspection_logs" (
    "id" TEXT NOT NULL,
    "fireInspectionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "operatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fire_inspection_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: station_room_logs -> station_rooms
ALTER TABLE "station_room_logs" ADD CONSTRAINT "station_room_logs_stationRoomId_fkey"
    FOREIGN KEY ("stationRoomId") REFERENCES "station_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: station_room_logs -> employees
ALTER TABLE "station_room_logs" ADD CONSTRAINT "station_room_logs_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: fire_inspections -> station_rooms
ALTER TABLE "fire_inspections" ADD CONSTRAINT "fire_inspections_stationRoomId_fkey"
    FOREIGN KEY ("stationRoomId") REFERENCES "station_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fire_inspection_logs -> fire_inspections
ALTER TABLE "fire_inspection_logs" ADD CONSTRAINT "fire_inspection_logs_fireInspectionId_fkey"
    FOREIGN KEY ("fireInspectionId") REFERENCES "fire_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: fire_inspection_logs -> employees
ALTER TABLE "fire_inspection_logs" ADD CONSTRAINT "fire_inspection_logs_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
