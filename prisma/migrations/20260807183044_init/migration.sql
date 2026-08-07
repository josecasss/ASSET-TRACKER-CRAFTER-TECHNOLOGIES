-- CreateTable
CREATE TABLE "USERS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company_code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ASSET_MASTER" (
    "asset_tag_number" TEXT NOT NULL PRIMARY KEY,
    "company_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost_center" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ASSET_STATUS_CODES" (
    "status_id" TEXT NOT NULL PRIMARY KEY,
    "status_text" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ASSET_STATUS_TRACKER" (
    "asset_tag_number" TEXT NOT NULL PRIMARY KEY,
    "company_code" TEXT NOT NULL,
    "main_asset_number" TEXT NOT NULL,
    "asset_sub_number" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "last_counted_date" DATETIME NOT NULL,
    "updated_by_user" TEXT NOT NULL,
    CONSTRAINT "ASSET_STATUS_TRACKER_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "ASSET_STATUS_CODES" ("status_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ASSET_STATUS_HISTORY" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asset_tag_number" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT NOT NULL,
    CONSTRAINT "ASSET_STATUS_HISTORY_asset_tag_number_fkey" FOREIGN KEY ("asset_tag_number") REFERENCES "ASSET_STATUS_TRACKER" ("asset_tag_number") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ASSET_STATUS_HISTORY_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "ASSET_STATUS_CODES" ("status_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "USERS_username_key" ON "USERS"("username");

-- CreateIndex
CREATE INDEX "ASSET_MASTER_company_code_idx" ON "ASSET_MASTER"("company_code");

-- CreateIndex
CREATE INDEX "ASSET_MASTER_cost_center_idx" ON "ASSET_MASTER"("cost_center");

-- CreateIndex
CREATE INDEX "ASSET_STATUS_TRACKER_company_code_idx" ON "ASSET_STATUS_TRACKER"("company_code");

-- CreateIndex
CREATE INDEX "ASSET_STATUS_HISTORY_asset_tag_number_idx" ON "ASSET_STATUS_HISTORY"("asset_tag_number");
