-- 删除旧字段
ALTER TABLE "fire_inspections"
  DROP COLUMN IF EXISTS "lastInspectionDate",
  DROP COLUMN IF EXISTS "nextInspectionDate";

-- 新增设备独立日期字段
ALTER TABLE "fire_inspections"
  ADD COLUMN "gasLastInspectionDate" TIMESTAMP(3),
  ADD COLUMN "gasNextInspectionDate" TIMESTAMP(3),
  ADD COLUMN "extLastInspectionDate" TIMESTAMP(3),
  ADD COLUMN "extNextInspectionDate" TIMESTAMP(3);
