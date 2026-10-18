-- CreateTable
CREATE TABLE "Installation" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncCursor" TEXT,
    "syncStartedAt" DATETIME,
    "syncedAt" DATETIME,
    "syncLockedUntil" DATETIME
);

-- CreateTable
CREATE TABLE "Matcher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "published" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductCache" (
    "shop" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "seenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("shop", "id")
);

-- CreateTable
CREATE TABLE "WebhookReceipt" (
    "shop" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("shop", "eventId")
);

-- CreateIndex
CREATE INDEX "Matcher_shop_idx" ON "Matcher"("shop");

-- CreateIndex
CREATE INDEX "ProductCache_shop_active_idx" ON "ProductCache"("shop", "active");

