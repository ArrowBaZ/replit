CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer,
	"seller_id" varchar NOT NULL,
	"reusse_id" varchar,
	"title" varchar(255) NOT NULL,
	"description" text,
	"brand" varchar(100),
	"size" varchar(50),
	"category" varchar(50) NOT NULL,
	"condition" varchar(20),
	"photos" text[],
	"certificate_photos" text[],
	"material" varchar(100),
	"dimensions" varchar(100),
	"author" varchar(100),
	"genre" varchar(100),
	"language" varchar(50),
	"vintage" varchar(50),
	"age_range" varchar(50),
	"model" varchar(100),
	"device_storage" varchar(50),
	"ram" varchar(50),
	"volume" varchar(50),
	"frame_size" varchar(50),
	"instrument_type" varchar(100),
	"appliance_type" varchar(100),
	"decor_style" varchar(100),
	"subcategory" varchar(100),
	"min_price" numeric,
	"max_price" numeric,
	"approved_price" numeric,
	"price_approved_by_seller" boolean DEFAULT false,
	"seller_counter_offer" boolean DEFAULT false,
	"decline_reason" text,
	"status" varchar(20) DEFAULT 'pending_approval' NOT NULL,
	"listed_at" timestamp,
	"sold_at" timestamp,
	"sale_price" numeric,
	"platform_listed_on" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"location" text NOT NULL,
	"duration" integer DEFAULT 60,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"request_id" integer,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(500),
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"phone" varchar(20),
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(10),
	"department" varchar(100),
	"bio" text,
	"experience" text,
	"siret_number" varchar(20),
	"status" varchar(20) DEFAULT 'approved',
	"preferred_contact_method" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" varchar NOT NULL,
	"reusse_id" varchar,
	"service_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"item_count" integer NOT NULL,
	"estimated_value" numeric,
	"categories" text[],
	"item_condition" varchar(20),
	"brands" text,
	"meeting_location" text,
	"preferred_date_start" timestamp,
	"preferred_date_end" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer,
	"request_id" integer,
	"seller_id" varchar NOT NULL,
	"reusse_id" varchar NOT NULL,
	"sale_price" numeric NOT NULL,
	"seller_earning" numeric NOT NULL,
	"reusse_earning" numeric NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_items_seller" ON "items" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_items_reusse" ON "items" USING btree ("reusse_id");--> statement-breakpoint
CREATE INDEX "idx_items_status" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_messages_receiver" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "idx_messages_request" ON "messages" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_requests_seller" ON "requests" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_requests_reusse" ON "requests" USING btree ("reusse_id");--> statement-breakpoint
CREATE INDEX "idx_requests_status" ON "requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_transactions_seller" ON "transactions" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_reusse" ON "transactions" USING btree ("reusse_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_item" ON "transactions" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");