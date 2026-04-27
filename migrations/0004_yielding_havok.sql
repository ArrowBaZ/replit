CREATE TABLE "item_price_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"proposed_by_user_id" varchar NOT NULL,
	"proposed_by_role" varchar(20) NOT NULL,
	"min_price" numeric,
	"max_price" numeric,
	"action" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "item_price_offers" ADD CONSTRAINT "item_price_offers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_price_offers" ADD CONSTRAINT "item_price_offers_proposed_by_user_id_users_id_fk" FOREIGN KEY ("proposed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_item_price_offers_item" ON "item_price_offers" USING btree ("item_id");