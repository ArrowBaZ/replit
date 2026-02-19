import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, numeric, serial, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

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
  meetingLocation: text("meeting_location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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
  size: varchar("size", { length: 20 }),
  category: varchar("category", { length: 20 }).notNull(),
  condition: varchar("condition", { length: 20 }).notNull(),
  photos: text("photos").array(),
  minPrice: numeric("min_price"),
  maxPrice: numeric("max_price"),
  approvedPrice: numeric("approved_price"),
  priceApprovedBySeller: boolean("price_approved_by_seller").default(false),
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

export const itemsRelations = relations(items, ({ one }) => ({
  request: one(requests, { fields: [items.requestId], references: [requests.id] }),
  seller: one(users, { fields: [items.sellerId], references: [users.id], relationName: "sellerItems" }),
  reusse: one(users, { fields: [items.reusseId], references: [users.id], relationName: "reusseItems" }),
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

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRequestSchema = createInsertSchema(requests).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true, createdAt: true, updatedAt: true, listedAt: true, soldAt: true });
export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, isRead: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });

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
