SET search_path TO "matcher";
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "matcher";

-- CreateTable
CREATE TABLE "Installation" (
    "shop" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "syncCursor" TEXT,
    "syncStartedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),
    "syncLockedUntil" TIMESTAMP(3),

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("shop")
);

-- CreateTable
CREATE TABLE "Matcher" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "published" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCache" (
    "shop" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCache_pkey" PRIMARY KEY ("shop","id")
);

-- CreateTable
CREATE TABLE "WebhookReceipt" (
    "shop" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookReceipt_pkey" PRIMARY KEY ("shop","eventId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Matcher_shop_idx" ON "Matcher"("shop");

-- CreateIndex
CREATE INDEX "ProductCache_shop_active_idx" ON "ProductCache"("shop", "active");

ALTER TABLE "matcher"."Installation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "matcher"."Installation" FROM PUBLIC, anon, authenticated;

ALTER TABLE "matcher"."Matcher" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "matcher"."Matcher" FROM PUBLIC, anon, authenticated;

ALTER TABLE "matcher"."ProductCache" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "matcher"."ProductCache" FROM PUBLIC, anon, authenticated;

ALTER TABLE "matcher"."WebhookReceipt" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "matcher"."WebhookReceipt" FROM PUBLIC, anon, authenticated;

ALTER TABLE "matcher"."Session" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "matcher"."Session" FROM PUBLIC, anon, authenticated;

REVOKE ALL ON SCHEMA matcher FROM PUBLIC, anon, authenticated;
