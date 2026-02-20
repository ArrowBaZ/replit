import { db } from "./db";
import { eq, and, or, desc, sql, ne, isNull, inArray } from "drizzle-orm";
import {
  users,
  profiles, type Profile, type InsertProfile,
  requests, type Request, type InsertRequest,
  items, type Item, type InsertItem,
  meetings, type Meeting, type InsertMeeting,
  messages, type Message, type InsertMessage,
  notifications, type Notification, type InsertNotification,
  transactions, type Transaction, type InsertTransaction,
  type User,
} from "@shared/schema";

export interface IStorage {
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(data: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined>;

  getRequests(userId: string, role: string): Promise<Request[]>;
  getAvailableRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(data: InsertRequest): Promise<Request>;
  updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined>;
  acceptRequest(requestId: number, reusseId: string): Promise<Request | undefined>;

  getItems(userId: string, role: string): Promise<Item[]>;
  getItemsByRequest(requestId: number): Promise<Item[]>;
  createItem(data: InsertItem): Promise<Item>;
  updateItem(id: number, data: Partial<Item>): Promise<Item | undefined>;

  getMeetings(userId: string): Promise<Meeting[]>;
  getMeetingsByRequest(requestId: number): Promise<Meeting[]>;
  createMeeting(data: InsertMeeting): Promise<Meeting>;
  getMeeting(id: number): Promise<Meeting | undefined>;
  updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting>;

  getConversations(userId: string): Promise<any[]>;
  getMessagesBetween(userId: string, otherUserId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessagesRead(senderId: string, receiverId: string): Promise<void>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;

  getAllUsersWithProfiles(): Promise<any[]>;
  getPendingReusses(): Promise<any[]>;
  updateProfileStatus(userId: string, status: string): Promise<Profile | undefined>;
  getAdminStats(): Promise<any>;

  createTransaction(data: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: string, role: string): Promise<Transaction[]>;
  getEarnings(userId: string, role: string): Promise<{ total: number; transactions: Transaction[] }>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(data: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: string, data: Partial<InsertProfile>): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async getRequests(userId: string, role: string): Promise<Request[]> {
    if (role === "admin") {
      return db.select().from(requests).orderBy(desc(requests.createdAt));
    }
    if (role === "reusse") {
      return db.select().from(requests).where(eq(requests.reusseId, userId)).orderBy(desc(requests.createdAt));
    }
    return db.select().from(requests).where(eq(requests.sellerId, userId)).orderBy(desc(requests.createdAt));
  }

  async getAvailableRequests(): Promise<Request[]> {
    return db.select().from(requests)
      .where(and(eq(requests.status, "pending"), isNull(requests.reusseId)))
      .orderBy(desc(requests.createdAt));
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request;
  }

  async createRequest(data: InsertRequest): Promise<Request> {
    const [request] = await db.insert(requests).values(data).returning();
    return request;
  }

  async updateRequest(id: number, data: Partial<Request>): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request;
  }

  async acceptRequest(requestId: number, reusseId: string): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ reusseId, status: "matched", updatedAt: new Date() })
      .where(and(eq(requests.id, requestId), eq(requests.status, "pending")))
      .returning();
    return request;
  }

  async getItems(userId: string, role: string): Promise<Item[]> {
    if (role === "reusse") {
      return db.select().from(items).where(eq(items.reusseId, userId)).orderBy(desc(items.createdAt));
    }
    return db.select().from(items).where(eq(items.sellerId, userId)).orderBy(desc(items.createdAt));
  }

  async getItemsByRequest(requestId: number): Promise<Item[]> {
    return db.select().from(items).where(eq(items.requestId, requestId)).orderBy(desc(items.createdAt));
  }

  async createItem(data: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(data).returning();
    return item;
  }

  async updateItem(id: number, data: Partial<Item>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return item;
  }

  async getMeetings(userId: string): Promise<Meeting[]> {
    const userRequests = await db.select({ id: requests.id }).from(requests)
      .where(or(eq(requests.sellerId, userId), eq(requests.reusseId, userId)));
    const requestIds = userRequests.map((r) => r.id);
    if (requestIds.length === 0) return [];
    return db.select().from(meetings)
      .where(inArray(meetings.requestId, requestIds))
      .orderBy(desc(meetings.scheduledDate));
  }

  async getMeetingsByRequest(requestId: number): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.requestId, requestId)).orderBy(desc(meetings.scheduledDate));
  }

  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(data).returning();
    return meeting;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting> {
    const [meeting] = await db.update(meetings).set(data).where(eq(meetings.id, id)).returning();
    return meeting;
  }

  async getConversations(userId: string): Promise<any[]> {
    const sent = await db.select().from(messages).where(eq(messages.senderId, userId));
    const received = await db.select().from(messages).where(eq(messages.receiverId, userId));
    const allMessages = [...sent, ...received];

    const conversationMap = new Map<string, { messages: Message[]; otherUserId: string }>();
    for (const msg of allMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, { messages: [], otherUserId });
      }
      conversationMap.get(otherUserId)!.messages.push(msg);
    }

    const conversations = [];
    for (const [otherUserId, data] of conversationMap) {
      const sortedMsgs = data.messages.sort((a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      );
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      if (otherUser) {
        conversations.push({
          userId: otherUserId,
          user: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            profileImageUrl: otherUser.profileImageUrl,
          },
          lastMessage: sortedMsgs[0],
          unreadCount: sortedMsgs.filter((m) => m.receiverId === userId && !m.isRead).length,
        });
      }
    }

    return conversations.sort((a, b) =>
      new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime()
    );
  }

  async getMessagesBetween(userId: string, otherUserId: string): Promise<Message[]> {
    const result = await db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId)),
        )
      )
      .orderBy(messages.createdAt);

    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId), eq(messages.isRead, false)));

    return result;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async markMessagesRead(senderId: string, receiverId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getAllUsersWithProfiles(): Promise<any[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const result = [];
    for (const user of allUsers) {
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id));
      result.push({ ...user, profile: profile || null });
    }
    return result;
  }

  async getPendingReusses(): Promise<any[]> {
    const pendingProfiles = await db.select().from(profiles)
      .where(and(eq(profiles.role, "reusse"), eq(profiles.status, "pending")));
    const result = [];
    for (const profile of pendingProfiles) {
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        result.push({ ...user, profile });
      }
    }
    return result;
  }

  async updateProfileStatus(userId: string, status: string): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ status, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async getAdminStats(): Promise<any> {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [sellerCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.role, "seller"));
    const [reusseCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(and(eq(profiles.role, "reusse"), eq(profiles.status, "approved")));
    const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(and(eq(profiles.role, "reusse"), eq(profiles.status, "pending")));
    const [requestCount] = await db.select({ count: sql<number>`count(*)` }).from(requests);
    const [activeRequestCount] = await db.select({ count: sql<number>`count(*)` }).from(requests).where(ne(requests.status, "completed"));
    return {
      totalUsers: Number(userCount.count),
      totalSellers: Number(sellerCount.count),
      totalReusses: Number(reusseCount.count),
      pendingApplications: Number(pendingCount.count),
      totalRequests: Number(requestCount.count),
      activeRequests: Number(activeRequestCount.count),
    };
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  async getTransactions(userId: string, role: string): Promise<Transaction[]> {
    if (role === "reusse") {
      return db.select().from(transactions).where(eq(transactions.reusseId, userId)).orderBy(desc(transactions.createdAt));
    }
    return db.select().from(transactions).where(eq(transactions.sellerId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getEarnings(userId: string, role: string): Promise<{ total: number; transactions: Transaction[] }> {
    const txns = await this.getTransactions(userId, role);
    const total = txns.reduce((sum, t) => {
      const earning = role === "reusse" ? parseFloat(t.reusseEarning) : parseFloat(t.sellerEarning);
      return sum + (isNaN(earning) ? 0 : earning);
    }, 0);
    return { total, transactions: txns };
  }
}

export const storage = new DatabaseStorage();
