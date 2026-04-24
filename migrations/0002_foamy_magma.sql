CREATE TABLE "fee_tier_changelog" (
        "id" serial PRIMARY KEY NOT NULL,
        "fee_tier_id" integer,
        "admin_id" varchar NOT NULL,
        "action" varchar(20) NOT NULL,
        "previous_values" jsonb,
        "new_values" jsonb,
        "changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fee_tiers" (
        "id" serial PRIMARY KEY NOT NULL,
        "label" varchar(100) NOT NULL,
        "min_price" numeric NOT NULL,
        "max_price" numeric,
        "seller_percent" numeric NOT NULL,
        "reseller_percent" numeric NOT NULL,
        "platform_percent" numeric NOT NULL,
        "currency_note" varchar(50) DEFAULT 'EUR/CHF',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platform_earning" numeric;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "fee_tier_id" integer;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_percent" numeric;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "reseller_percent" numeric;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "platform_percent" numeric;--> statement-breakpoint
ALTER TABLE "fee_tier_changelog" ADD CONSTRAINT "fee_tier_changelog_fee_tier_id_fee_tiers_id_fk" FOREIGN KEY ("fee_tier_id") REFERENCES "public"."fee_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_tier_changelog" ADD CONSTRAINT "fee_tier_changelog_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_tier_changelog_tier" ON "fee_tier_changelog" USING btree ("fee_tier_id");--> statement-breakpoint
CREATE INDEX "idx_fee_tier_changelog_admin" ON "fee_tier_changelog" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_fee_tiers_active" ON "fee_tiers" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fee_tier_id_fee_tiers_id_fk" FOREIGN KEY ("fee_tier_id") REFERENCES "public"."fee_tiers"("id") ON DELETE no action ON UPDATE no action;