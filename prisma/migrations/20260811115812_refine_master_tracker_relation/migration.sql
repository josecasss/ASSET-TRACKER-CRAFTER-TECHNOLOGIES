/*
  Warnings:

  - Added the required column `asset_sub_number` to the `ASSET_MASTER` table without a default value. This is not possible if the table is not empty.
  - Added the required column `main_asset_number` to the `ASSET_MASTER` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ASSET_MASTER" (
    "asset_tag_number" TEXT NOT NULL PRIMARY KEY,
    "company_code" TEXT NOT NULL,
    "main_asset_number" TEXT NOT NULL,
    "asset_sub_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost_center" TEXT NOT NULL
);
INSERT INTO "new_ASSET_MASTER" ("asset_tag_number", "company_code", "cost_center", "description") SELECT "asset_tag_number", "company_code", "cost_center", "description" FROM "ASSET_MASTER";
DROP TABLE "ASSET_MASTER";
ALTER TABLE "new_ASSET_MASTER" RENAME TO "ASSET_MASTER";
CREATE INDEX "ASSET_MASTER_company_code_idx" ON "ASSET_MASTER"("company_code");
CREATE INDEX "ASSET_MASTER_cost_center_idx" ON "ASSET_MASTER"("cost_center");
CREATE TABLE "new_ASSET_STATUS_TRACKER" (
    "asset_tag_number" TEXT NOT NULL PRIMARY KEY,
    "company_code" TEXT NOT NULL,
    "main_asset_number" TEXT NOT NULL,
    "asset_sub_number" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "last_counted_date" DATETIME NOT NULL,
    "updated_by_user" TEXT NOT NULL,
    CONSTRAINT "ASSET_STATUS_TRACKER_asset_tag_number_fkey" FOREIGN KEY ("asset_tag_number") REFERENCES "ASSET_MASTER" ("asset_tag_number") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ASSET_STATUS_TRACKER_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "ASSET_STATUS_CODES" ("status_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ASSET_STATUS_TRACKER" ("asset_sub_number", "asset_tag_number", "company_code", "last_counted_date", "main_asset_number", "status_id", "updated_by_user") SELECT "asset_sub_number", "asset_tag_number", "company_code", "last_counted_date", "main_asset_number", "status_id", "updated_by_user" FROM "ASSET_STATUS_TRACKER";
DROP TABLE "ASSET_STATUS_TRACKER";
ALTER TABLE "new_ASSET_STATUS_TRACKER" RENAME TO "ASSET_STATUS_TRACKER";
CREATE INDEX "ASSET_STATUS_TRACKER_company_code_idx" ON "ASSET_STATUS_TRACKER"("company_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
