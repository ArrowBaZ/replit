-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER,
    "seller_id" VARCHAR NOT NULL,
    "reusse_id" VARCHAR,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "brand" VARCHAR(100),
    "size" VARCHAR(20),
    "category" VARCHAR(20) NOT NULL,
    "condition" VARCHAR(20) NOT NULL,
    "photos" TEXT[],
    "min_price" DECIMAL,
    "max_price" DECIMAL,
    "approved_price" DECIMAL,
    "price_approved_by_seller" BOOLEAN DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending_approval',
    "listed_at" TIMESTAMP(6),
    "sold_at" TIMESTAMP(6),
    "sale_price" DECIMAL,
    "platform_listed_on" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(6) NOT NULL,
    "location" TEXT NOT NULL,
    "duration" INTEGER DEFAULT 60,
    "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_id" VARCHAR NOT NULL,
    "receiver_id" VARCHAR NOT NULL,
    "request_id" INTEGER,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "link" VARCHAR(500),
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "postal_code" VARCHAR(10),
    "department" VARCHAR(100),
    "bio" TEXT,
    "experience" TEXT,
    "siret_number" VARCHAR(20),
    "status" VARCHAR(20) DEFAULT 'approved',
    "preferred_contact_method" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" SERIAL NOT NULL,
    "seller_id" VARCHAR NOT NULL,
    "reusse_id" VARCHAR,
    "service_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "item_count" INTEGER NOT NULL,
    "estimated_value" DECIMAL,
    "categories" TEXT[],
    "item_condition" VARCHAR(20),
    "brands" TEXT,
    "meeting_location" TEXT,
    "preferred_date_start" TIMESTAMP(6),
    "preferred_date_end" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER,
    "request_id" INTEGER,
    "seller_id" VARCHAR NOT NULL,
    "reusse_id" VARCHAR NOT NULL,
    "sale_price" DECIMAL NOT NULL,
    "seller_earning" DECIMAL NOT NULL,
    "reusse_earning" DECIMAL NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR,
    "first_name" VARCHAR,
    "last_name" VARCHAR,
    "profile_image_url" VARCHAR,
    "password" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_items_reusse" ON "items"("reusse_id");

-- CreateIndex
CREATE INDEX "idx_items_seller" ON "items"("seller_id");

-- CreateIndex
CREATE INDEX "idx_items_status" ON "items"("status");

-- CreateIndex
CREATE INDEX "idx_messages_receiver" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "idx_messages_request" ON "messages"("request_id");

-- CreateIndex
CREATE INDEX "idx_messages_sender" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_unique" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_requests_reusse" ON "requests"("reusse_id");

-- CreateIndex
CREATE INDEX "idx_requests_seller" ON "requests"("seller_id");

-- CreateIndex
CREATE INDEX "idx_requests_status" ON "requests"("status");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "sessions"("expire");

-- CreateIndex
CREATE INDEX "idx_transactions_item" ON "transactions"("item_id");

-- CreateIndex
CREATE INDEX "idx_transactions_reusse" ON "transactions"("reusse_id");

-- CreateIndex
CREATE INDEX "idx_transactions_seller" ON "transactions"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reusse_id_users_id_fk" FOREIGN KEY ("reusse_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
