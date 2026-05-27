-- Rename columns in agreements table
ALTER TABLE "agreements" RENAME COLUMN "reusse_id" TO "marchand_id";
ALTER TABLE "agreements" RENAME CONSTRAINT "agreements_reusse_id_users_id_fk" TO "agreements_marchand_id_users_id_fk";

-- Rename columns in item_document_requests table  
ALTER TABLE "item_document_requests" RENAME COLUMN "reusse_id" TO "marchand_id";

-- Rename columns in reviews table
ALTER TABLE "reviews" RENAME COLUMN "reusse_id" TO "marchand_id";

-- Rename columns in transactions table
ALTER TABLE "transactions" RENAME COLUMN "reusse_id" TO "marchand_id";
ALTER TABLE "transactions" RENAME COLUMN "reusse_earning" TO "marchand_earning";
ALTER TABLE "transactions" RENAME COLUMN "reseller_percent" TO "marchand_percent";

-- Rename columns in fee_tiers table
ALTER TABLE "fee_tiers" RENAME COLUMN "reseller_percent" TO "marchand_percent";

-- Rename indexes
DROP INDEX IF EXISTS "idx_agreements_reusse";
DROP INDEX IF EXISTS "idx_item_doc_requests_reusse";
DROP INDEX IF EXISTS "idx_reviews_reusse";
DROP INDEX IF EXISTS "idx_transactions_reusse";

CREATE INDEX "idx_agreements_marchand" on "agreements"("marchand_id");
CREATE INDEX "idx_item_doc_requests_marchand" on "item_document_requests"("marchand_id");
CREATE INDEX "idx_reviews_marchand" on "reviews"("marchand_id");
CREATE INDEX "idx_transactions_marchand" on "transactions"("marchand_id");

-- Rename unique constraints
DROP INDEX IF EXISTS "uq_item_doc_request_item_reusse";
CREATE UNIQUE INDEX "uq_item_doc_request_item_marchand" on "item_document_requests"("item_id","marchand_id");
