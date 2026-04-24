import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, numeric, serial, index, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export { ITEM_CATEGORIES } from "./constants";
export type { ItemCategory } from "./constants";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  role: varchar("role", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  department: varchar("department", { length: 100 }),
  bio: text("bio"),
  experience: text("experience"),
  siretNumber: varchar("siret_number", { length: 20 }),
  status: varchar("status", { length: 20 }).default("approved"),
  preferredContactMethod: varchar("preferred_contact_method", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  reusseId: varchar("reusse_id").references(() => users.id),
  serviceType: varchar("service_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  itemCount: integer("item_count").notNull(),
  estimatedValue: numeric("estimated_value"),
  categories: text("categories").array(),
  condition: varchar("item_condition", { length: 20 }),
  brands: text("brands"),
  meetingLocation: text("meeting_location"),
  preferredDateStart: timestamp("preferred_date_start"),
  preferredDateEnd: timestamp("preferred_date_end"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  listReadyAt: timestamp("list_ready_at"),
}, (table) => [
  index("idx_requests_seller").on(table.sellerId),
  index("idx_requests_reusse").on(table.reusseId),
  index("idx_requests_status").on(table.status),
]);

export const requestsRelations = relations(requests, ({ one, many }) => ({
  seller: one(users, { fields: [requests.sellerId], references: [users.id], relationName: "sellerRequests" }),
  reusse: one(users, { fields: [requests.reusseId], references: [users.id], relationName: "reusseRequests" }),
  items: many(items),
  meetings: many(meetings),
  messages: many(messages),
}));

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  reusseId: varchar("reusse_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  brand: varchar("brand", { length: 100 }),
  size: varchar("size", { length: 50 }),
  category: varchar("category", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }),
  photos: text("photos").array(),
  certificatePhotos: text("certificate_photos").array(),
  material: varchar("material", { length: 100 }),
  dimensions: varchar("dimensions", { length: 100 }),
  author: varchar("author", { length: 100 }),
  genre: varchar("genre", { length: 100 }),
  language: varchar("language", { length: 50 }),
  vintage: varchar("vintage", { length: 50 }),
  ageRange: varchar("age_range", { length: 50 }),
  model: varchar("model", { length: 100 }),
  deviceStorage: varchar("device_storage", { length: 50 }),
  ram: varchar("ram", { length: 50 }),
  volume: varchar("volume", { length: 50 }),
  frameSize: varchar("frame_size", { length: 50 }),
  instrumentType: varchar("instrument_type", { length: 100 }),
  applianceType: varchar("appliance_type", { length: 100 }),
  decorStyle: varchar("decor_style", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  minPrice: numeric("min_price"),
  maxPrice: numeric("max_price"),
  approvedPrice: numeric("approved_price"),
  priceApprovedBySeller: boolean("price_approved_by_seller").default(false),
  sellerCounterOffer: boolean("seller_counter_offer").default(false),
  declineReason: text("decline_reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending_approval"),
  listedAt: timestamp("listed_at"),
  soldAt: timestamp("sold_at"),
  salePrice: numeric("sale_price"),
  platformListedOn: varchar("platform_listed_on", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_items_seller").on(table.sellerId),
  index("idx_items_reusse").on(table.reusseId),
  index("idx_items_status").on(table.status),
]);

export const itemsRelations = relations(items, ({ one, many }) => ({
  request: one(requests, { fields: [items.requestId], references: [requests.id] }),
  seller: one(users, { fields: [items.sellerId], references: [users.id], relationName: "sellerItems" }),
  reusse: one(users, { fields: [items.reusseId], references: [users.id], relationName: "reusseItems" }),
  documents: many(itemDocuments),
}));

export const itemDocuments = pgTable("item_documents", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  uploaderUserId: varchar("uploader_user_id").notNull().references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 20 }).notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_item_documents_item").on(table.itemId),
  index("idx_item_documents_uploader").on(table.uploaderUserId),
]);

export const itemDocumentsRelations = relations(itemDocuments, ({ one }) => ({
  item: one(items, { fields: [itemDocuments.itemId], references: [items.id] }),
  uploader: one(users, { fields: [itemDocuments.uploaderUserId], references: [users.id] }),
}));

export const itemDocumentRequests = pgTable("item_document_requests", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  reusseId: varchar("reusse_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_item_doc_requests_item").on(table.itemId),
  index("idx_item_doc_requests_reusse").on(table.reusseId),
  uniqueIndex("uq_item_doc_request_item_reusse").on(table.itemId, table.reusseId),
]);

export const itemDocumentRequestsRelations = relations(itemDocumentRequests, ({ one }) => ({
  item: one(items, { fields: [itemDocumentRequests.itemId], references: [items.id] }),
  reusse: one(users, { fields: [itemDocumentRequests.reusseId], references: [users.id] }),
}));

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  location: text("location").notNull(),
  duration: integer("duration").default(60),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetingsRelations = relations(meetings, ({ one }) => ({
  request: one(requests, { fields: [meetings.requestId], references: [requests.id] }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  requestId: integer("request_id").references(() => requests.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_sender").on(table.senderId),
  index("idx_messages_receiver").on(table.receiverId),
  index("idx_messages_request").on(table.requestId),
]);

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sentMessages" }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: "receivedMessages" }),
  request: one(requests, { fields: [messages.requestId], references: [requests.id] }),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const feeTiers = pgTable("fee_tiers", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 100 }).notNull(),
  minPrice: numeric("min_price").notNull(),
  maxPrice: numeric("max_price"),
  sellerPercent: numeric("seller_percent").notNull(),
  resellerPercent: numeric("reseller_percent").notNull(),
  platformPercent: numeric("platform_percent").notNull(),
  currencyNote: varchar("currency_note", { length: 50 }).default("EUR/CHF"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_fee_tiers_active").on(table.isActive),
]);

export const feeTiersRelations = relations(feeTiers, ({ many }) => ({
  changelog: many(feeTierChangelog),
}));

export const feeTierChangelog = pgTable("fee_tier_changelog", {
  id: serial("id").primaryKey(),
  feeTierId: integer("fee_tier_id").references(() => feeTiers.id),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 20 }).notNull(),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),
  changedAt: timestamp("changed_at").defaultNow(),
}, (table) => [
  index("idx_fee_tier_changelog_tier").on(table.feeTierId),
  index("idx_fee_tier_changelog_admin").on(table.adminId),
]);

export const feeTierChangelogRelations = relations(feeTierChangelog, ({ one }) => ({
  tier: one(feeTiers, { fields: [feeTierChangelog.feeTierId], references: [feeTiers.id] }),
  admin: one(users, { fields: [feeTierChangelog.adminId], references: [users.id] }),
}));

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id),
  requestId: integer("request_id").references(() => requests.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  reusseId: varchar("reusse_id").notNull().references(() => users.id),
  salePrice: numeric("sale_price").notNull(),
  sellerEarning: numeric("seller_earning").notNull(),
  reusseEarning: numeric("reusse_earning").notNull(),
  platformEarning: numeric("platform_earning"),
  feeTierId: integer("fee_tier_id").references(() => feeTiers.id),
  sellerPercent: numeric("seller_percent"),
  resellerPercent: numeric("reseller_percent"),
  platformPercent: numeric("platform_percent"),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_transactions_seller").on(table.sellerId),
  index("idx_transactions_reusse").on(table.reusseId),
  index("idx_transactions_item").on(table.itemId),
]);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  item: one(items, { fields: [transactions.itemId], references: [items.id] }),
  request: one(requests, { fields: [transactions.requestId], references: [requests.id] }),
  seller: one(users, { fields: [transactions.sellerId], references: [users.id], relationName: "sellerTransactions" }),
  reusse: one(users, { fields: [transactions.reusseId], references: [users.id], relationName: "reusseTransactions" }),
  feeTier: one(feeTiers, { fields: [transactions.feeTierId], references: [feeTiers.id] }),
}));

export const moderationActions = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 20 }).notNull(),
  reason: text("reason"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_moderation_request").on(table.requestId),
  index("idx_moderation_admin").on(table.adminId),
]);

export const moderationActionsRelations = relations(moderationActions, ({ one }) => ({
  request: one(requests, { fields: [moderationActions.requestId], references: [requests.id] }),
  admin: one(users, { fields: [moderationActions.adminId], references: [users.id] }),
}));

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  reusseId: varchar("reusse_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  communicationRating: integer("communication_rating"),
  reliabilityRating: integer("reliability_rating"),
  handlingRating: integer("handling_rating"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reviews_reusse").on(table.reusseId),
  index("idx_reviews_seller").on(table.sellerId),
  index("idx_reviews_request").on(table.requestId),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  request: one(requests, { fields: [reviews.requestId], references: [requests.id] }),
  seller: one(users, { fields: [reviews.sellerId], references: [users.id], relationName: "sellerReviews" }),
  reusse: one(users, { fields: [reviews.reusseId], references: [users.id], relationName: "reusseReviews" }),
}));

export const agreements = pgTable("agreements", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  reusseId: varchar("reusse_id").notNull().references(() => users.id),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  itemCount: integer("item_count").notNull(),
  totalValue: numeric("total_value").notNull(),
  itemsSnapshot: text("items_snapshot").notNull(),
  feeBreakdown: text("fee_breakdown"),
  generatedAt: timestamp("generated_at").defaultNow(),
}, (table) => [
  index("idx_agreements_request").on(table.requestId),
  index("idx_agreements_seller").on(table.sellerId),
  index("idx_agreements_reusse").on(table.reusseId),
]);

export const agreementsRelations = relations(agreements, ({ one, many }) => ({
  request: one(requests, { fields: [agreements.requestId], references: [requests.id] }),
  seller: one(users, { fields: [agreements.sellerId], references: [users.id], relationName: "sellerAgreements" }),
  reusse: one(users, { fields: [agreements.reusseId], references: [users.id], relationName: "reusseAgreements" }),
  signatures: many(agreementSignatures),
}));

export const agreementSignatures = pgTable("agreement_signatures", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => agreements.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 20 }).notNull(),
  signedAt: timestamp("signed_at").defaultNow(),
  ipAddress: varchar("ip_address", { length: 50 }),
}, (table) => [
  index("idx_agreement_sigs_agreement").on(table.agreementId),
  index("idx_agreement_sigs_user").on(table.userId),
  uniqueIndex("uq_agreement_sig_user").on(table.agreementId, table.userId),
]);

export const agreementSignaturesRelations = relations(agreementSignatures, ({ one }) => ({
  agreement: one(agreements, { fields: [agreementSignatures.agreementId], references: [agreements.id] }),
  user: one(users, { fields: [agreementSignatures.userId], references: [users.id] }),
}));

export const insertAgreementSchema = createInsertSchema(agreements).omit({ id: true, generatedAt: true });
export const insertAgreementSignatureSchema = createInsertSchema(agreementSignatures).omit({ id: true, signedAt: true });

export const insertItemDocumentSchema = createInsertSchema(itemDocuments).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true, updatedAt: true, listedAt: true, soldAt: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertFeeTierSchema = createInsertSchema(feeTiers).omit({ id: true, createdAt: true });
export const insertFeeTierChangelogSchema = createInsertSchema(feeTierChangelog).omit({ id: true, changedAt: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ModerationAction = typeof moderationActions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ItemDocument = typeof itemDocuments.$inferSelect;
export type InsertItemDocument = z.infer<typeof insertItemDocumentSchema>;
export const insertItemDocumentRequestSchema = createInsertSchema(itemDocumentRequests).omit({ id: true, createdAt: true });
export type ItemDocumentRequest = typeof itemDocumentRequests.$inferSelect;
export type InsertItemDocumentRequest = z.infer<typeof insertItemDocumentRequestSchema>;
export type Agreement = typeof agreements.$inferSelect;
export type InsertAgreement = z.infer<typeof insertAgreementSchema>;
export type AgreementSignature = typeof agreementSignatures.$inferSelect;
export type InsertAgreementSignature = z.infer<typeof insertAgreementSignatureSchema>;
export type FeeTier = typeof feeTiers.$inferSelect;
export type InsertFeeTier = z.infer<typeof insertFeeTierSchema>;
export type FeeTierChangelog = typeof feeTierChangelog.$inferSelect;
export type InsertFeeTierChangelog = z.infer<typeof insertFeeTierChangelogSchema>;
