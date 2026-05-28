-- Migration: Add all features added via Drizzle db:push since the init migration
-- This is a baseline migration — the DB already contains these changes.

-- DropColumn: password was removed from users
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";

-- AlterTable: items — new columns and type changes
ALTER TABLE "items"
  ALTER COLUMN "size" TYPE VARCHAR(50),
  ALTER COLUMN "category" TYPE VARCHAR(50),
  ALTER COLUMN "condition" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "seller_counter_offer" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "decline_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "certificate_photos" TEXT[],
  ADD COLUMN IF NOT EXISTS "material" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "dimensions" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "author" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "genre" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "language" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "vintage" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "age_range" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "model" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "device_storage" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "ram" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "volume" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "frame_size" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "instrument_type" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "appliance_type" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "decor_style" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "subcategory" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);

-- AlterTable: profiles — notification_prefs
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "notification_prefs" JSONB;

-- AlterTable: requests — list_ready_at
ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "list_ready_at" TIMESTAMP(6);

-- AlterTable: transactions — fee tier columns
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "platform_earning" DECIMAL,
  ADD COLUMN IF NOT EXISTS "fee_tier_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "seller_percent" DECIMAL,
  ADD COLUMN IF NOT EXISTS "reseller_percent" DECIMAL,
  ADD COLUMN IF NOT EXISTS "platform_percent" DECIMAL;

-- CreateTable: fee_tiers
CREATE TABLE IF NOT EXISTS "fee_tiers" (
  "id" SERIAL NOT NULL,
  "label" VARCHAR(100) NOT NULL,
  "min_price" DECIMAL NOT NULL,
  "max_price" DECIMAL,
  "seller_percent" DECIMAL NOT NULL,
  "reseller_percent" DECIMAL NOT NULL,
  "platform_percent" DECIMAL NOT NULL,
  "currency_note" VARCHAR(50) DEFAULT 'EUR/CHF',
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fee_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: fee_tiers
CREATE INDEX IF NOT EXISTS "idx_fee_tiers_active" ON "fee_tiers"("is_active");

-- CreateTable: fee_tier_changelog
CREATE TABLE IF NOT EXISTS "fee_tier_changelog" (
  "id" SERIAL NOT NULL,
  "fee_tier_id" INTEGER,
  "admin_id" VARCHAR NOT NULL,
  "action" VARCHAR(20) NOT NULL,
  "previous_values" JSONB,
  "new_values" JSONB,
  "changed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fee_tier_changelog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: fee_tier_changelog
CREATE INDEX IF NOT EXISTS "idx_fee_tier_changelog_admin" ON "fee_tier_changelog"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_fee_tier_changelog_tier" ON "fee_tier_changelog"("fee_tier_id");

-- CreateTable: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" SERIAL NOT NULL,
  "request_id" INTEGER NOT NULL,
  "seller_id" VARCHAR NOT NULL,
  "reusse_id" VARCHAR NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "communication_rating" INTEGER,
  "reliability_rating" INTEGER,
  "handling_rating" INTEGER,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: reviews
CREATE INDEX IF NOT EXISTS "idx_reviews_request" ON "reviews"("request_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_reusse" ON "reviews"("reusse_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_seller" ON "reviews"("seller_id");

-- CreateTable: agreements
CREATE TABLE IF NOT EXISTS "agreements" (
  "id" SERIAL NOT NULL,
  "request_id" INTEGER NOT NULL,
  "seller_id" VARCHAR NOT NULL,
  "reusse_id" VARCHAR NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "item_count" INTEGER NOT NULL,
  "total_value" DECIMAL NOT NULL,
  "items_snapshot" TEXT NOT NULL,
  "fee_breakdown" TEXT,
  "generated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: agreements
CREATE INDEX IF NOT EXISTS "idx_agreements_request" ON "agreements"("request_id");
CREATE INDEX IF NOT EXISTS "idx_agreements_reusse" ON "agreements"("reusse_id");
CREATE INDEX IF NOT EXISTS "idx_agreements_seller" ON "agreements"("seller_id");

-- CreateTable: agreement_signatures
CREATE TABLE IF NOT EXISTS "agreement_signatures" (
  "id" SERIAL NOT NULL,
  "agreement_id" INTEGER NOT NULL,
  "user_id" VARCHAR NOT NULL,
  "role" VARCHAR(20) NOT NULL,
  "signed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "ip_address" VARCHAR(50),
  CONSTRAINT "agreement_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: agreement_signatures
CREATE UNIQUE INDEX IF NOT EXISTS "uq_agreement_sig_user" ON "agreement_signatures"("agreement_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_agreement_sigs_agreement" ON "agreement_signatures"("agreement_id");
CREATE INDEX IF NOT EXISTS "idx_agreement_sigs_user" ON "agreement_signatures"("user_id");

-- CreateTable: item_document_requests
CREATE TABLE IF NOT EXISTS "item_document_requests" (
  "id" SERIAL NOT NULL,
  "item_id" INTEGER NOT NULL,
  "reusse_id" VARCHAR NOT NULL,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: item_document_requests
CREATE UNIQUE INDEX IF NOT EXISTS "uq_item_doc_request_item_reusse" ON "item_document_requests"("item_id", "reusse_id");
CREATE INDEX IF NOT EXISTS "idx_item_doc_requests_item" ON "item_document_requests"("item_id");
CREATE INDEX IF NOT EXISTS "idx_item_doc_requests_reusse" ON "item_document_requests"("reusse_id");

-- CreateTable: item_documents
CREATE TABLE IF NOT EXISTS "item_documents" (
  "id" SERIAL NOT NULL,
  "item_id" INTEGER NOT NULL,
  "uploader_user_id" VARCHAR NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_type" VARCHAR(20) NOT NULL,
  "file_size" INTEGER,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: item_documents
CREATE INDEX IF NOT EXISTS "idx_item_documents_item" ON "item_documents"("item_id");
CREATE INDEX IF NOT EXISTS "idx_item_documents_uploader" ON "item_documents"("uploader_user_id");

-- CreateTable: item_price_offers
CREATE TABLE IF NOT EXISTS "item_price_offers" (
  "id" SERIAL NOT NULL,
  "item_id" INTEGER NOT NULL,
  "proposed_by_user_id" VARCHAR NOT NULL,
  "proposed_by_role" VARCHAR(20) NOT NULL,
  "min_price" DECIMAL,
  "max_price" DECIMAL,
  "action" VARCHAR(30) NOT NULL,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "item_price_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: item_price_offers
CREATE INDEX IF NOT EXISTS "idx_item_price_offers_item" ON "item_price_offers"("item_id");

-- CreateTable: moderation_actions
CREATE TABLE IF NOT EXISTS "moderation_actions" (
  "id" SERIAL NOT NULL,
  "request_id" INTEGER NOT NULL,
  "admin_id" VARCHAR NOT NULL,
  "action" VARCHAR(20) NOT NULL,
  "reason" TEXT,
  "metadata" TEXT,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: moderation_actions
CREATE INDEX IF NOT EXISTS "idx_moderation_admin" ON "moderation_actions"("admin_id");
CREATE INDEX IF NOT EXISTS "idx_moderation_request" ON "moderation_actions"("request_id");

-- AddForeignKey: fee_tier_changelog
ALTER TABLE "fee_tier_changelog" ADD CONSTRAINT "fee_tier_changelog_admin_id_users_id_fk"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "fee_tier_changelog" ADD CONSTRAINT "fee_tier_changelog_fee_tier_id_fee_tiers_id_fk"
  FOREIGN KEY ("fee_tier_id") REFERENCES "fee_tiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: reviews
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_requests_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reusse_id_users_id_fk"
  FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: agreements
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_request_id_requests_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_reusse_id_users_id_fk"
  FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: agreement_signatures
ALTER TABLE "agreement_signatures" ADD CONSTRAINT "agreement_signatures_agreement_id_agreements_id_fk"
  FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "agreement_signatures" ADD CONSTRAINT "agreement_signatures_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: item_document_requests
ALTER TABLE "item_document_requests" ADD CONSTRAINT "item_document_requests_item_id_items_id_fk"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "item_document_requests" ADD CONSTRAINT "item_document_requests_reusse_id_users_id_fk"
  FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: item_documents
ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_item_id_items_id_fk"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_uploader_user_id_users_id_fk"
  FOREIGN KEY ("uploader_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: item_price_offers
ALTER TABLE "item_price_offers" ADD CONSTRAINT "item_price_offers_item_id_items_id_fk"
  FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "item_price_offers" ADD CONSTRAINT "item_price_offers_proposed_by_user_id_users_id_fk"
  FOREIGN KEY ("proposed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: moderation_actions
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_users_id_fk"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_request_id_requests_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: transactions fee_tier
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_tier_id_fee_tiers_id_fk"
  FOREIGN KEY ("fee_tier_id") REFERENCES "fee_tiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
