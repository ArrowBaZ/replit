CREATE TABLE "agreement_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"signed_at" timestamp DEFAULT now(),
	"ip_address" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"seller_id" varchar NOT NULL,
	"reusse_id" varchar NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"item_count" integer NOT NULL,
	"total_value" numeric NOT NULL,
	"items_snapshot" text NOT NULL,
	"fee_breakdown" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "item_document_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"reusse_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "item_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"uploader_user_id" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(20) NOT NULL,
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar(20) NOT NULL,
	"reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"seller_id" varchar NOT NULL,
	"reusse_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"communication_rating" integer,
	"reliability_rating" integer,
	"handling_rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "list_ready_at" timestamp;--> statement-breakpoint
ALTER TABLE "agreement_signatures" ADD CONSTRAINT "agreement_signatures_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreement_signatures" ADD CONSTRAINT "agreement_signatures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_document_requests" ADD CONSTRAINT "item_document_requests_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_document_requests" ADD CONSTRAINT "item_document_requests_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_documents" ADD CONSTRAINT "item_documents_uploader_user_id_users_id_fk" FOREIGN KEY ("uploader_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agreement_sigs_agreement" ON "agreement_signatures" USING btree ("agreement_id");--> statement-breakpoint
CREATE INDEX "idx_agreement_sigs_user" ON "agreement_signatures" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_agreement_sig_user" ON "agreement_signatures" USING btree ("agreement_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_agreements_request" ON "agreements" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_agreements_seller" ON "agreements" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_agreements_reusse" ON "agreements" USING btree ("reusse_id");--> statement-breakpoint
CREATE INDEX "idx_item_doc_requests_item" ON "item_document_requests" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_item_doc_requests_reusse" ON "item_document_requests" USING btree ("reusse_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_doc_request_item_reusse" ON "item_document_requests" USING btree ("item_id","reusse_id");--> statement-breakpoint
CREATE INDEX "idx_item_documents_item" ON "item_documents" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_item_documents_uploader" ON "item_documents" USING btree ("uploader_user_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_request" ON "moderation_actions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_admin" ON "moderation_actions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_reusse" ON "reviews" USING btree ("reusse_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_seller" ON "reviews" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_request" ON "reviews" USING btree ("request_id");