import { db } from "./db";
import { eq, and, or, desc, sql, ne, isNull, inArray, gte } from "drizzle-orm";
import {
  users,
  profiles,
  type Profile,
  type InsertProfile,
  requests,
  type Request,
  type InsertRequest,
  items,
  type Item,
  type InsertItem,
  meetings,
  type Meeting,
  type InsertMeeting,
  messages,
  type Message,
  type InsertMessage,
  notifications,
  type Notification,
  type InsertNotification,
  transactions,
  type Transaction,
  type InsertTransaction,
  moderationActions,
  reviews,
  type Review,
  type InsertReview,
  type User,
  itemDocuments,
  type ItemDocument,
  type InsertItemDocument,
  itemDocumentRequests,
  type ItemDocumentRequest,
} from "@shared/schema";

export interface IStorage {
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(data: InsertProfile): Promise<Profile>;
  updateProfile(
    userId: string,
    data: Partial<InsertProfile>,
  ): Promise<Profile | undefined>;

  getRequests(userId: string, role: string): Promise<Request[]>;
  getAvailableRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(data: InsertRequest): Promise<Request>;
  updateRequest(
    id: number,
    data: Partial<Request>,
  ): Promise<Request | undefined>;
  acceptRequest(
    requestId: number,
    reusseId: string,
  ): Promise<Request | undefined>;

  getItem(id: number): Promise<Item | undefined>;
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
  markNotificationRead(id: number, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getAllUsersWithProfiles(): Promise<any[]>;
  getPendingReusses(): Promise<any[]>;
  updateProfileStatus(
    userId: string,
    status: string,
  ): Promise<Profile | undefined>;
  getAdminStats(): Promise<any>;

  createTransaction(data: InsertTransaction): Promise<Transaction>;
  getTransactions(userId: string, role: string): Promise<Transaction[]>;
  getEarnings(
    userId: string,
    role: string,
  ): Promise<{ total: number; transactions: Transaction[] }>;

  getAdminRequests(status?: string): Promise<any[]>;
  logModerationAction(data: { requestId: number; adminId: string; action: string; reason?: string; metadata?: string }): Promise<any>;
  getModerationActions(requestId: number): Promise<any[]>;

  getEarningsSummary(userId: string, role: string): Promise<any[]>;
  getActivityStats(userId: string, role: string): Promise<any>;

  getResellers(): Promise<any[]>;
  getResellerById(reusseId: string): Promise<any>;
  getReviews(reusseId: string): Promise<Review[]>;
  createReview(data: InsertReview): Promise<Review>;
  reportRequest(requestId: number, reporterId: string, reason: string): Promise<void>;

  getItemDocuments(itemId: number): Promise<any[]>;
  getItemDocument(docId: number): Promise<ItemDocument | undefined>;
  createItemDocument(data: InsertItemDocument): Promise<ItemDocument>;
  deleteItemDocument(docId: number): Promise<void>;
  getDocumentsByUser(userId: string): Promise<any[]>;
  getDocumentRequestStatus(itemId: number, reusseId: string): Promise<ItemDocumentRequest | undefined>;
  createDocumentRequest(itemId: number, reusseId: string): Promise<ItemDocumentRequest>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(data: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }

  async updateProfile(
    userId: string,
    data: Partial<InsertProfile>,
  ): Promise<Profile | undefined> {
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
      return db
        .select()
        .from(requests)
        .where(eq(requests.reusseId, userId))
        .orderBy(desc(requests.createdAt));
    }
    return db
      .select()
      .from(requests)
      .where(eq(requests.sellerId, userId))
      .orderBy(desc(requests.createdAt));
  }

  async getAvailableRequests(): Promise<Request[]> {
    return db
      .select()
      .from(requests)
      .where(and(eq(requests.status, "pending"), isNull(requests.reusseId)))
      .orderBy(desc(requests.createdAt));
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id));
    return request;
  }

  async createRequest(data: InsertRequest): Promise<Request> {
    const [request] = await db.insert(requests).values(data).returning();
    return request;
  }

  async updateRequest(
    id: number,
    data: Partial<Request>,
  ): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return request;
  }

  async acceptRequest(
    requestId: number,
    reusseId: string,
  ): Promise<Request | undefined> {
    const [request] = await db
      .update(requests)
      .set({ reusseId, status: "matched", updatedAt: new Date() })
      .where(and(eq(requests.id, requestId), eq(requests.status, "pending")))
      .returning();
    return request;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItems(userId: string, role: string): Promise<Item[]> {
    if (role === "reusse") {
      return db
        .select()
        .from(items)
        .where(eq(items.reusseId, userId))
        .orderBy(desc(items.createdAt));
    }
    return db
      .select()
      .from(items)
      .where(eq(items.sellerId, userId))
      .orderBy(desc(items.createdAt));
  }

  async getItemsByRequest(requestId: number): Promise<Item[]> {
    return db
      .select()
      .from(items)
      .where(eq(items.requestId, requestId))
      .orderBy(desc(items.createdAt));
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
    const userRequests = await db
      .select({ id: requests.id })
      .from(requests)
      .where(or(eq(requests.sellerId, userId), eq(requests.reusseId, userId)));
    const requestIds = userRequests.map((r) => r.id);
    if (requestIds.length === 0) return [];
    return db
      .select()
      .from(meetings)
      .where(inArray(meetings.requestId, requestIds))
      .orderBy(desc(meetings.scheduledDate));
  }

  async getMeetingsByRequest(requestId: number): Promise<Meeting[]> {
    return db
      .select()
      .from(meetings)
      .where(eq(meetings.requestId, requestId))
      .orderBy(desc(meetings.scheduledDate));
  }

  async createMeeting(data: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(data).returning();
    return meeting;
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
    return meeting;
  }

  async updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting> {
    const [meeting] = await db
      .update(meetings)
      .set(data)
      .where(eq(meetings.id, id))
      .returning();
    return meeting;
  }

  async getConversations(userId: string): Promise<any[]> {
    const sent = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, userId));
    const received = await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, userId));
    const allMessages = [...sent, ...received];

    const conversationMap = new Map<
      string,
      { messages: Message[]; otherUserId: string }
    >();
    for (const msg of allMessages) {
      const otherUserId =
        msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, { messages: [], otherUserId });
      }
      conversationMap.get(otherUserId)!.messages.push(msg);
    }

    const conversations = [];
    for (const [otherUserId, data] of Array.from(conversationMap.entries())) {
      const sortedMsgs = data.messages.sort(
        (a: (typeof data.messages)[0], b: (typeof data.messages)[0]) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
      );
      const [otherUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));
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
          unreadCount: sortedMsgs.filter(
            (m: (typeof data.messages)[0]) =>
              m.receiverId === userId && !m.isRead,
          ).length,
        });
      }
    }

    return conversations.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt!).getTime() -
        new Date(a.lastMessage.createdAt!).getTime(),
    );
  }

  async getMessagesBetween(
    userId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, otherUserId),
          ),
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId),
          ),
        ),
      )
      .orderBy(messages.createdAt);

    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false),
        ),
      );

    return result;
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  }

  async markMessagesRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
        ),
      );
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    return notification;
  }

  async markNotificationRead(id: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getAllUsersWithProfiles(): Promise<any[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    if (allUsers.length === 0) return [];

    const userIds = allUsers.map((u) => u.id);
    const allProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.userId, userIds));
    const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));

    return allUsers.map((user) => ({
      ...user,
      profile: profileMap.get(user.id) || null,
    }));
  }

  async getPendingReusses(): Promise<any[]> {
    const pendingProfiles = await db
      .select()
      .from(profiles)
      .where(and(eq(profiles.role, "reusse"), eq(profiles.status, "pending")));
    if (pendingProfiles.length === 0) return [];

    const userIds = pendingProfiles.map((p) => p.userId);
    const pendingUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));
    const userMap = new Map(pendingUsers.map((u) => [u.id, u]));

    return pendingProfiles
      .filter((profile) => userMap.has(profile.userId))
      .map((profile) => ({ ...userMap.get(profile.userId)!, profile }));
  }

  async updateProfileStatus(
    userId: string,
    status: string,
  ): Promise<Profile | undefined> {
    const [profile] = await db
      .update(profiles)
      .set({ status, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async getAdminStats(): Promise<any> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const [sellerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(eq(profiles.role, "seller"));
    const [reusseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(and(eq(profiles.role, "reusse"), eq(profiles.status, "approved")));
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(and(eq(profiles.role, "reusse"), eq(profiles.status, "pending")));
    const [requestCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests);
    const [activeRequestCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(ne(requests.status, "completed"));
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
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();
    return transaction;
  }

  async getTransactions(userId: string, role: string): Promise<Transaction[]> {
    if (role === "reusse") {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.reusseId, userId))
        .orderBy(desc(transactions.createdAt));
    }
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.sellerId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getEarnings(
    userId: string,
    role: string,
  ): Promise<{ total: number; transactions: Transaction[] }> {
    const txns = await this.getTransactions(userId, role);
    const total = txns.reduce((sum, t) => {
      const earning =
        role === "reusse"
          ? parseFloat(t.reusseEarning)
          : parseFloat(t.sellerEarning);
      return sum + (isNaN(earning) ? 0 : earning);
    }, 0);
    return { total, transactions: txns };
  }

  async getAdminRequests(status?: string): Promise<any[]> {
    const rows = await db
      .select({
        request: requests,
        sellerProfile: profiles,
        sellerUser: users,
      })
      .from(requests)
      .leftJoin(profiles, eq(profiles.userId, requests.sellerId))
      .leftJoin(users, eq(users.id, requests.sellerId))
      .orderBy(desc(requests.createdAt));

    const filtered = status ? rows.filter(r => r.request.status === status) : rows;
    return filtered.map(r => ({
      ...r.request,
      seller: {
        firstName: r.sellerUser?.firstName,
        lastName: r.sellerUser?.lastName,
        email: r.sellerUser?.email,
        profileImageUrl: r.sellerUser?.profileImageUrl,
        phone: r.sellerProfile?.phone,
        address: r.sellerProfile?.address,
        city: r.sellerProfile?.city,
        department: r.sellerProfile?.department,
      },
    }));
  }

  async logModerationAction(data: { requestId: number; adminId: string; action: string; reason?: string; metadata?: string }): Promise<any> {
    const [row] = await db.insert(moderationActions).values(data).returning();
    return row;
  }

  async getModerationActions(requestId: number): Promise<any[]> {
    const rows = await db
      .select({ action: moderationActions, admin: users })
      .from(moderationActions)
      .leftJoin(users, eq(users.id, moderationActions.adminId))
      .where(eq(moderationActions.requestId, requestId))
      .orderBy(desc(moderationActions.createdAt));
    return rows.map(r => ({
      ...r.action,
      adminName: r.admin ? `${r.admin.firstName || ""} ${r.admin.lastName || ""}`.trim() || r.admin.email : "Admin",
    }));
  }

  async getEarningsSummary(userId: string, role: string): Promise<any[]> {
    const col = role === "reusse" ? transactions.reusseId : transactions.sellerId;
    const amountCol = role === "reusse" ? transactions.reusseAmount : transactions.sellerAmount;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const rows = await db
      .select({
        month: sql<string>`to_char(${transactions.createdAt}, 'YYYY-MM')`,
        total: sql<number>`sum(${amountCol}::numeric)`,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(and(eq(col, userId), gte(transactions.createdAt, sixMonthsAgo)))
      .groupBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${transactions.createdAt}, 'YYYY-MM')`);
    return rows;
  }

  async getActivityStats(userId: string, role: string): Promise<any> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const col = role === "reusse" ? requests.reusseId : requests.sellerId;
    const [activeReqs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(eq(col, userId), inArray(requests.status, ["pending", "matched", "scheduled", "in_progress"])));

    const itemCol = role === "reusse" ? items.reusseId : items.sellerId;
    const [soldItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(itemCol, userId), eq(items.status, "sold")));

    const [soldThisMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(itemCol, userId), eq(items.status, "sold"), gte(items.soldAt!, firstOfMonth)));

    const msgCol = role === "reusse" ? messages.senderId : messages.senderId;
    const [msgsThisMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.senderId, userId), gte(messages.createdAt, firstOfMonth)));

    return {
      activeRequests: Number(activeReqs?.count ?? 0),
      soldItems: Number(soldItems?.count ?? 0),
      soldThisMonth: Number(soldThisMonth?.count ?? 0),
      messagesThisMonth: Number(msgsThisMonth?.count ?? 0),
    };
  }

  async getResellers(): Promise<any[]> {
    const rows = await db
      .select({
        user: users,
        profile: profiles,
      })
      .from(profiles)
      .leftJoin(users, eq(users.id, profiles.userId))
      .where(and(eq(profiles.role, "reusse"), eq(profiles.status, "approved")));

    const result = await Promise.all(rows.map(async (r) => {
      const [statsRow] = await db
        .select({
          avgRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
          reviewCount: sql<number>`count(${reviews.id})`,
        })
        .from(reviews)
        .where(eq(reviews.reusseId, r.profile.userId));
      const [completedRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(requests)
        .where(and(eq(requests.reusseId, r.profile.userId), eq(requests.status, "completed")));
      const [soldRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(and(eq(items.reusseId, r.profile.userId), eq(items.status, "sold")));
      return {
        userId: r.profile.userId,
        firstName: r.user?.firstName,
        lastName: r.user?.lastName,
        email: r.user?.email,
        profileImageUrl: r.user?.profileImageUrl,
        bio: r.profile.bio,
        experience: r.profile.experience,
        department: r.profile.department,
        city: r.profile.city,
        avgRating: Number(statsRow?.avgRating ?? 0),
        reviewCount: Number(statsRow?.reviewCount ?? 0),
        completedRequests: Number(completedRow?.count ?? 0),
        soldItems: Number(soldRow?.count ?? 0),
      };
    }));
    return result;
  }

  async getResellerById(reusseId: string): Promise<any> {
    const [row] = await db
      .select({ user: users, profile: profiles })
      .from(profiles)
      .leftJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.userId, reusseId));
    if (!row) return undefined;
    const [statsRow] = await db
      .select({
        avgRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        reviewCount: sql<number>`count(${reviews.id})`,
        avgCommunication: sql<number>`coalesce(avg(${reviews.communicationRating}), 0)`,
        avgReliability: sql<number>`coalesce(avg(${reviews.reliabilityRating}), 0)`,
        avgHandling: sql<number>`coalesce(avg(${reviews.handlingRating}), 0)`,
      })
      .from(reviews)
      .where(eq(reviews.reusseId, reusseId));
    const [completedRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(eq(requests.reusseId, reusseId), eq(requests.status, "completed")));
    const [soldRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.reusseId, reusseId), eq(items.status, "sold")));
    return {
      userId: row.profile.userId,
      firstName: row.user?.firstName,
      lastName: row.user?.lastName,
      email: row.user?.email,
      profileImageUrl: row.user?.profileImageUrl,
      bio: row.profile.bio,
      experience: row.profile.experience,
      department: row.profile.department,
      city: row.profile.city,
      avgRating: Number(statsRow?.avgRating ?? 0),
      reviewCount: Number(statsRow?.reviewCount ?? 0),
      avgCommunication: Number(statsRow?.avgCommunication ?? 0),
      avgReliability: Number(statsRow?.avgReliability ?? 0),
      avgHandling: Number(statsRow?.avgHandling ?? 0),
      completedRequests: Number(completedRow?.count ?? 0),
      soldItems: Number(soldRow?.count ?? 0),
    };
  }

  async getReviews(reusseId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.reusseId, reusseId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(data: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  async reportRequest(requestId: number, reporterId: string, reason: string): Promise<void> {
    await db.insert(moderationActions).values({
      requestId,
      adminId: reporterId,
      action: "reported",
      reason,
      metadata: JSON.stringify({ reportedBy: reporterId }),
    });
    await db.update(requests).set({ status: "flagged" }).where(eq(requests.id, requestId));
  }

  async getItemDocument(docId: number): Promise<ItemDocument | undefined> {
    const [doc] = await db.select().from(itemDocuments).where(eq(itemDocuments.id, docId));
    return doc;
  }

  async getItemDocuments(itemId: number): Promise<any[]> {
    const rows = await db
      .select({
        doc: itemDocuments,
        uploader: users,
      })
      .from(itemDocuments)
      .leftJoin(users, eq(users.id, itemDocuments.uploaderUserId))
      .where(eq(itemDocuments.itemId, itemId))
      .orderBy(desc(itemDocuments.createdAt));
    return rows.map((r) => ({
      ...r.doc,
      uploaderName: r.uploader
        ? `${r.uploader.firstName || ""} ${r.uploader.lastName || ""}`.trim() || r.uploader.email
        : "Unknown",
    }));
  }

  async createItemDocument(data: InsertItemDocument): Promise<ItemDocument> {
    const [doc] = await db.insert(itemDocuments).values(data).returning();
    return doc;
  }

  async deleteItemDocument(docId: number): Promise<void> {
    await db.delete(itemDocuments).where(eq(itemDocuments.id, docId));
  }

  async getDocumentsByUser(userId: string): Promise<any[]> {
    const rows = await db
      .select({
        doc: itemDocuments,
        item: items,
        request: requests,
      })
      .from(itemDocuments)
      .innerJoin(items, eq(items.id, itemDocuments.itemId))
      .leftJoin(requests, eq(requests.id, items.requestId))
      .where(eq(itemDocuments.uploaderUserId, userId))
      .orderBy(desc(itemDocuments.createdAt));

    return rows.map((r) => ({
      ...r.doc,
      itemTitle: r.item.title,
      itemId: r.item.id,
      requestId: r.request?.id ?? null,
    }));
  }

  async getDocumentRequestStatus(itemId: number, reusseId: string): Promise<ItemDocumentRequest | undefined> {
    const [req] = await db
      .select()
      .from(itemDocumentRequests)
      .where(and(eq(itemDocumentRequests.itemId, itemId), eq(itemDocumentRequests.reusseId, reusseId)));
    return req;
  }

  async createDocumentRequest(itemId: number, reusseId: string): Promise<ItemDocumentRequest> {
    const [req] = await db.insert(itemDocumentRequests).values({ itemId, reusseId }).returning();
    return req;
  }
}

export const storage = new DatabaseStorage();
