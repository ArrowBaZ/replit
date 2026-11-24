import { db } from "./db";
import { eq, and, or, desc, asc, sql, ne, isNull, inArray, gte, lte, isNotNull } from "drizzle-orm";
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
  cartItems,
  type CartItem,
  payments,
  type Payment,
  type CartSnapshotLine,
  payouts,
  type Payout,
  payoutBankAccounts,
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
  agreements,
  type Agreement,
  type InsertAgreement,
  agreementSignatures,
  type AgreementSignature,
  type InsertAgreementSignature,
  feeTiers,
  type FeeTier,
  type InsertFeeTier,
  feeTierChangelog,
  type FeeTierChangelog,
  itemPriceOffers,
  type ItemPriceOffer,
  type InsertItemPriceOffer,
} from "@shared/schema";

export interface EarningsHistoryRow {
  id: number;
  itemId: number | null;
  itemTitle: string | null;
  salePrice: string;
  amountReceived: string;
  role: "seller" | "marchand";
  saleStatus: string;
  payoutStatus: string | null;
  payoutPaidAt: string | null;
  createdAt: string | null;
  stripeCheckoutSessionId: string | null;
}

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
  getRequestsPendingSellerAction(sellerId: string): Promise<Request[]>;
  createRequest(data: InsertRequest): Promise<Request>;
  updateRequest(
    id: number,
    data: Partial<Request>,
  ): Promise<Request | undefined>;
  acceptRequest(
    requestId: number,
    marchantId: string,
  ): Promise<Request | undefined>;

  getItem(id: number): Promise<Item | undefined>;
  getItemIncludingDeleted(id: number): Promise<Item | undefined>;
  getItems(userId: string, role: string): Promise<Item[]>;
  getItemsByRequest(requestId: number): Promise<Item[]>;
  createItem(data: InsertItem): Promise<Item>;
  updateItem(id: number, data: Partial<Item>): Promise<Item | undefined>;
  updateItemConditional(id: number, expectedVersion: number, data: Partial<Item>): Promise<Item | undefined>;
  softDeleteItem(id: number): Promise<void>;
  bulkApproveItemsTransaction(requestId: number, approverId: string): Promise<{ updatedItems: Item[] }>;

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
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getTransactionByItemId(itemId: number): Promise<Transaction | undefined>;
  getTransactions(userId: string, role: string): Promise<Transaction[]>;
  getEarnings(
    userId: string,
    role: string,
  ): Promise<{
    total: number;
    receivedTotal: number;
    pendingTotal: number;
    transactions: EarningsHistoryRow[];
  }>;

  getAdminRequests(status?: string): Promise<any[]>;
  logModerationAction(data: { requestId: number; adminId: string; action: string; reason?: string; metadata?: string }): Promise<any>;
  getModerationActions(requestId: number): Promise<any[]>;

  getEarningsSummary(userId: string, role: string): Promise<any[]>;
  getActivityStats(userId: string, role: string): Promise<any>;

  getResellers(): Promise<any[]>;
  getResellerById(marchantId: string): Promise<any>;
  getReviews(marchantId: string): Promise<Review[]>;
  createReview(data: InsertReview): Promise<Review>;
  reportRequest(requestId: number, reporterId: string, reason: string): Promise<void>;

  getItemDocuments(itemId: number): Promise<any[]>;
  getItemDocument(docId: number): Promise<ItemDocument | undefined>;
  createItemDocument(data: InsertItemDocument): Promise<ItemDocument>;
  deleteItemDocument(docId: number): Promise<void>;
  getDocumentsByUser(userId: string): Promise<any[]>;
  getDocumentRequestStatus(itemId: number, marchantId: string): Promise<ItemDocumentRequest | undefined>;
  createDocumentRequest(itemId: number, marchantId: string): Promise<ItemDocumentRequest>;
  getDocumentRequestsByRequest(requestId: number): Promise<any[]>;

  createAgreement(data: InsertAgreement): Promise<Agreement>;
  getAgreement(id: number): Promise<Agreement | undefined>;
  getAgreementByRequest(requestId: number): Promise<Agreement | undefined>;
  updateAgreementStatus(id: number, status: string): Promise<Agreement | undefined>;
  getAgreementWithDetails(id: number): Promise<any>;
  getAdminAgreements(): Promise<any[]>;
  getUserAgreements(userId: string): Promise<any[]>;
  createAgreementSignature(data: InsertAgreementSignature): Promise<AgreementSignature>;
  getAgreementSignatures(agreementId: number): Promise<AgreementSignature[]>;
  getAgreementSignature(agreementId: number, userId: string): Promise<AgreementSignature | undefined>;

  getFeeTiers(activeOnly?: boolean): Promise<FeeTier[]>;
  getFeeTier(id: number): Promise<FeeTier | undefined>;
  createFeeTier(data: InsertFeeTier): Promise<FeeTier>;
  updateFeeTier(id: number, data: Partial<InsertFeeTier>): Promise<FeeTier | undefined>;
  deleteFeeTier(id: number): Promise<void>;
  getTierForPrice(price: number): Promise<FeeTier | undefined>;
  checkRangeCoveredByTiers(minPrice: number, maxPrice: number): Promise<boolean>;
  getUncoveredItems(): Promise<Item[]>;
  logTierChange(data: { feeTierId: number | null; adminId: string; action: string; previousValues?: unknown; newValues?: unknown }): Promise<FeeTierChangelog>;
  getFeeTierChangelog(): Promise<any[]>;
  seedDefaultFeeTiers(): Promise<void>;

  createPriceOffer(data: InsertItemPriceOffer): Promise<ItemPriceOffer>;
  getPriceOffersByItem(itemId: number): Promise<(ItemPriceOffer & { proposedByName: string })[]>;

  getListedItems(): Promise<Item[]>;
  getCart(userId: string): Promise<Array<{ cartItem: CartItem; item: Item }>>;
  addCartItem(userId: string, itemId: number): Promise<CartItem>;
  removeCartItem(userId: string, itemId: number): Promise<void>;
  removeCartItems(userId: string, itemIds: number[]): Promise<void>;
  getUserById(userId: string): Promise<User | undefined>;
  createPayment(data: {
    userId: string;
    stripeCheckoutSessionId: string;
    amount: string;
    currency: string;
    cartSnapshot: CartSnapshotLine[];
  }): Promise<Payment>;
  getPaymentBySession(sessionId: string): Promise<Payment | undefined>;
  markPaymentPaid(id: number, stripePaymentIntentId: string | null): Promise<Payment | undefined>;
  markReceiptSent(id: number): Promise<void>;
  listLedger(userId?: string): Promise<LedgerEntry[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getTransactionsByPayment(paymentId: number): Promise<Transaction[]>;
  createPayoutIfMissing(data: {
    paymentId: number;
    transactionId: number;
    userId: string;
    role: string;
    amount: string;
    currency: string;
  }): Promise<void>;
  setPayoutIbanEncrypted(userId: string, ibanEncrypted: string | null): Promise<void>;
  listPayoutsForUser(userId: string): Promise<Payout[]>;
  listPayoutsByStatus(status: string): Promise<AdminPayoutRow[]>;
  markPayoutPaid(id: number, adminUserId: string, transferReference: string): Promise<Payout | undefined>;
}

export interface AdminPayoutRow {
  id: number;
  paymentId: number;
  transactionId: number;
  userId: string;
  role: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: Date | null;
  paidAt: Date | null;
  transferReference: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  bankAccountHolder: string | null;
  bankIbanEncrypted: string | null;
  bankIbanLast4: string | null;
  bankBic: string | null;
  itemTitle: string | null;
}

export interface LedgerEntry {
  key: string;
  kind: "stripe" | "manual";
  createdAt: string | null;
  status: string;
  amount: string;
  currency: string;
  payerUserId: string | null;
  payerName: string | null;
  payerEmail: string | null;
  sellerId: string | null;
  sellerName: string | null;
  marchantId: string | null;
  marchantName: string | null;
  itemTitles: string[];
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
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
    if (role === "marchand") {
      return db
        .select()
        .from(requests)
        .where(eq(requests.marchantId, userId))
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
      .where(and(eq(requests.status, "pending"), isNull(requests.marchantId)))
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
    marchantId: string,
  ): Promise<Request | undefined> {
    const [existingRequest] = await db.select().from(requests).where(eq(requests.id, requestId));
    if (!existingRequest) return undefined;

    const deadlineDays = existingRequest.deadlineDays ?? 30;
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    const [request] = await db
      .update(requests)
      .set({ marchantId, status: "matched", deadlineDate, updatedAt: new Date() })
      .where(and(eq(requests.id, requestId), eq(requests.status, "pending")))
      .returning();
    return request;
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(and(eq(items.id, id), isNull(items.deletedAt)));
    return item;
  }

  async getItemIncludingDeleted(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItems(userId: string, role: string): Promise<Item[]> {
    if (role === "marchand") {
      return db
        .select()
        .from(items)
        .where(and(eq(items.marchantId, userId), isNull(items.deletedAt)))
        .orderBy(desc(items.createdAt));
    }
    return db
      .select()
      .from(items)
      .where(and(eq(items.sellerId, userId), isNull(items.deletedAt)))
      .orderBy(desc(items.createdAt));
  }

  async getItemsByRequest(requestId: number): Promise<Item[]> {
    return db
      .select()
      .from(items)
      .where(and(eq(items.requestId, requestId), isNull(items.deletedAt)))
      .orderBy(desc(items.createdAt));
  }

  // Soft delete item by setting deletedAt timestamp
  // Does NOT cascade delete related data (itemDocuments, itemPriceOffers, transactions)
  // Intentional: preserves audit trail and historical data for financial/legal records
  // Deleted items are excluded from queries by default (isNull(items.deletedAt))
  async softDeleteItem(id: number): Promise<void> {
    await db
      .update(items)
      .set({ deletedAt: new Date(), version: sql`${items.version} + 1` })
      .where(eq(items.id, id));
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

  async updateItemConditional(id: number, expectedVersion: number, data: Partial<Item>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(items.id, id), eq(items.version, expectedVersion)))
      .returning();
    return item;
  }

  async bulkApproveItemsTransaction(requestId: number, approverId: string): Promise<{ updatedItems: Item[] }> {
    const updatedItems = await db.transaction(async (tx) => {
      const pendingItems = await tx
        .select()
        .from(items)
        .where(and(eq(items.requestId, requestId), eq(items.status, "pending_approval"), isNull(items.deletedAt)));

      if (pendingItems.length === 0) return [];

      const results: Item[] = [];
      for (const item of pendingItems) {
        const [updated] = await tx
          .update(items)
          .set({
            status: "approved",
            priceApprovedBySeller: true,
            approvedPrice: item.maxPrice || item.minPrice || null,
            version: (item.version ?? 1) + 1,
            updatedAt: new Date(),
          })
          .where(and(eq(items.id, item.id), eq(items.version, item.version ?? 1)))
          .returning();
        if (!updated) {
          throw new Error(`CONFLICT:item:${item.id}`);
        }
        results.push(updated);
        await tx.insert(itemPriceOffers).values({
          itemId: item.id,
          proposedByUserId: approverId,
          proposedByRole: "seller",
          minPrice: item.minPrice || null,
          maxPrice: item.maxPrice || null,
          action: "accepted",
        });
      }
      return results;
    });

    return { updatedItems };
  }

  async getMeetings(userId: string): Promise<Meeting[]> {
    const userRequests = await db
      .select({ id: requests.id })
      .from(requests)
      .where(or(eq(requests.sellerId, userId), eq(requests.marchantId, userId)));
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
      .where(and(eq(profiles.role, "marchand"), eq(profiles.status, "pending")));
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
      .where(and(eq(profiles.role, "marchand"), eq(profiles.status, "approved")));
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(and(eq(profiles.role, "marchand"), eq(profiles.status, "pending")));
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

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [row] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return row;
  }

  async getTransactionByItemId(itemId: number): Promise<Transaction | undefined> {
    const [row] = await db.select().from(transactions).where(eq(transactions.itemId, itemId)).limit(1);
    return row;
  }

  async getTransactions(userId: string, role: string): Promise<Transaction[]> {
    if (role === "marchand") {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.marchantId, userId))
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
  ): Promise<{
    total: number;
    receivedTotal: number;
    pendingTotal: number;
    transactions: EarningsHistoryRow[];
  }> {
    const txns = await this.getTransactions(userId, role);
    const payoutRole = role === "marchand" ? "marchand" : "seller";
    const history: EarningsHistoryRow[] = [];
    let total = 0;
    let receivedTotal = 0;
    let pendingTotal = 0;

    for (const txn of txns) {
      const amountRaw = role === "marchand" ? txn.marchantEarning : txn.sellerEarning;
      const amount = parseFloat(amountRaw);
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      total += safeAmount;

      let itemTitle: string | null = null;
      if (txn.itemId != null) {
        const item = await this.getItem(txn.itemId);
        itemTitle = item?.title || null;
      }

      const [payout] = await db.select().from(payouts).where(and(
        eq(payouts.transactionId, txn.id),
        eq(payouts.userId, userId),
        eq(payouts.role, payoutRole),
      )).limit(1);
      const payoutStatus = payout?.status ?? null;
      const payoutPaidAt = payout?.paidAt ? payout.paidAt.toISOString() : null;

      if (payoutStatus === "paid") receivedTotal += safeAmount;
      else pendingTotal += safeAmount;

      history.push({
        id: txn.id,
        itemId: txn.itemId,
        itemTitle,
        salePrice: txn.salePrice,
        amountReceived: safeAmount.toFixed(2),
        role: payoutRole,
        saleStatus: txn.status,
        payoutStatus,
        payoutPaidAt,
        createdAt: txn.createdAt ? txn.createdAt.toISOString() : null,
        stripeCheckoutSessionId: txn.stripeCheckoutSessionId || null,
      });
    }

    return { total, receivedTotal, pendingTotal, transactions: history };
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
    const col = role === "marchand" ? transactions.marchantId : transactions.sellerId;
    const amountCol = role === "marchand" ? transactions.marchantEarning : transactions.sellerEarning;
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

    const col = role === "marchand" ? requests.marchantId : requests.sellerId;
    const [activeReqs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(eq(col, userId), inArray(requests.status, ["pending", "matched", "scheduled", "in_progress"])));

    const itemCol = role === "marchand" ? items.marchantId : items.sellerId;
    const [soldItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(itemCol, userId), eq(items.status, "sold"), isNull(items.deletedAt)));

    const [soldThisMonth] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(itemCol, userId), eq(items.status, "sold"), gte(items.soldAt!, firstOfMonth), isNull(items.deletedAt)));

    const msgCol = role === "marchand" ? messages.senderId : messages.senderId;
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
      .where(and(eq(profiles.role, "marchand"), eq(profiles.status, "approved")));

    const result = await Promise.all(rows.map(async (r) => {
      const [statsRow] = await db
        .select({
          avgRating: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
          reviewCount: sql<number>`count(${reviews.id})`,
        })
        .from(reviews)
        .where(eq(reviews.marchantId, r.profile.userId));
      const [completedRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(requests)
        .where(and(eq(requests.marchantId, r.profile.userId), eq(requests.status, "completed")));
      const [soldRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(items)
        .where(and(eq(items.marchantId, r.profile.userId), eq(items.status, "sold"), isNull(items.deletedAt)));
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
        leboncoinUrl: r.profile.leboncoinUrl,
        vintedUrl: r.profile.vintedUrl,
        ricardoUrl: r.profile.ricardoUrl,
        avgRating: Number(statsRow?.avgRating ?? 0),
        reviewCount: Number(statsRow?.reviewCount ?? 0),
        completedRequests: Number(completedRow?.count ?? 0),
        soldItems: Number(soldRow?.count ?? 0),
      };
    }));
    return result;
  }

  async getResellerById(marchantId: string): Promise<any> {
    const [row] = await db
      .select({ user: users, profile: profiles })
      .from(profiles)
      .leftJoin(users, eq(users.id, profiles.userId))
      .where(eq(profiles.userId, marchantId));
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
      .where(eq(reviews.marchantId, marchantId));
    const [completedRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(requests)
      .where(and(eq(requests.marchantId, marchantId), eq(requests.status, "completed")));
    const [soldRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.marchantId, marchantId), eq(items.status, "sold"), isNull(items.deletedAt)));
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
      leboncoinUrl: row.profile.leboncoinUrl,
      vintedUrl: row.profile.vintedUrl,
      ricardoUrl: row.profile.ricardoUrl,
      avgRating: Number(statsRow?.avgRating ?? 0),
      reviewCount: Number(statsRow?.reviewCount ?? 0),
      avgCommunication: Number(statsRow?.avgCommunication ?? 0),
      avgReliability: Number(statsRow?.avgReliability ?? 0),
      avgHandling: Number(statsRow?.avgHandling ?? 0),
      completedRequests: Number(completedRow?.count ?? 0),
      soldItems: Number(soldRow?.count ?? 0),
    };
  }

  async getReviews(marchantId: string): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.marchantId, marchantId))
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
      .innerJoin(items, and(eq(items.id, itemDocuments.itemId), isNull(items.deletedAt)))
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

  async getDocumentRequestStatus(itemId: number, marchantId: string): Promise<ItemDocumentRequest | undefined> {
    const [req] = await db
      .select()
      .from(itemDocumentRequests)
      .where(and(eq(itemDocumentRequests.itemId, itemId), eq(itemDocumentRequests.marchantId, marchantId)));
    return req;
  }

  async createDocumentRequest(itemId: number, marchantId: string): Promise<ItemDocumentRequest> {
    const [req] = await db.insert(itemDocumentRequests).values({ itemId, marchantId }).returning();
    return req;
  }

  async getDocumentRequestsByRequest(requestId: number): Promise<any[]> {
    const requestItems = await db
      .select({ id: items.id, title: items.title })
      .from(items)
      .where(and(eq(items.requestId, requestId), isNull(items.deletedAt)));
    if (requestItems.length === 0) return [];
    const itemIds = requestItems.map((i) => i.id);
    const docReqs = await db
      .select({ req: itemDocumentRequests, marchant: users })
      .from(itemDocumentRequests)
      .leftJoin(users, eq(users.id, itemDocumentRequests.marchantId))
      .where(inArray(itemDocumentRequests.itemId, itemIds));
    const itemMap = new Map(requestItems.map((i) => [i.id, i]));
    return docReqs.map((r) => ({
      ...r.req,
      itemTitle: itemMap.get(r.req.itemId)?.title || "Unknown Item",
      marchantName: r.marchant
        ? `${r.marchant.firstName || ""} ${r.marchant.lastName || ""}`.trim() || r.marchant.email
        : "Reseller",
    }));
  }

  async getRequestsPendingSellerAction(sellerId: string): Promise<Request[]> {
    // All requests where seller is involved and a marchant is assigned
    const sellerRequests = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.sellerId, sellerId),
          isNotNull(requests.marchantId),
        )
      );
    if (sellerRequests.length === 0) return [];

    const pending: Request[] = [];
    for (const req of sellerRequests) {
      // Case 1: list finalized — check for items awaiting seller price approval
      if (req.listReadyAt) {
        const pendingItems = await db
          .select({ id: items.id })
          .from(items)
          .where(
            and(
              eq(items.requestId, req.id),
              eq(items.status, "pending_approval"),
              isNull(items.deletedAt),
            )
          )
          .limit(1);
        if (pendingItems.length > 0) {
          pending.push(req);
          continue;
        }
      }

      // Case 2: document requests — applies regardless of list finalization
      const docReqs = await db
        .select({ id: itemDocumentRequests.id })
        .from(itemDocumentRequests)
        .innerJoin(items, and(eq(items.id, itemDocumentRequests.itemId), isNull(items.deletedAt)))
        .where(eq(items.requestId, req.id))
        .limit(1);
      if (docReqs.length > 0) {
        pending.push(req);
      }
    }
    return pending;
  }

  async createAgreement(data: InsertAgreement): Promise<Agreement> {
    const [agreement] = await db.insert(agreements).values(data).returning();
    return agreement;
  }

  async getAgreement(id: number): Promise<Agreement | undefined> {
    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, id));
    return agreement;
  }

  async getAgreementByRequest(requestId: number): Promise<Agreement | undefined> {
    const [agreement] = await db.select().from(agreements).where(eq(agreements.requestId, requestId));
    return agreement;
  }

  async updateAgreementStatus(id: number, status: string): Promise<Agreement | undefined> {
    const [agreement] = await db.update(agreements).set({ status }).where(eq(agreements.id, id)).returning();
    return agreement;
  }

  async getAgreementWithDetails(id: number): Promise<any> {
    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, id));
    if (!agreement) return undefined;

    const sigs = await db.select().from(agreementSignatures).where(eq(agreementSignatures.agreementId, id));

    const [sellerUser] = await db.select().from(users).where(eq(users.id, agreement.sellerId));
    const [marchandUser] = await db.select().from(users).where(eq(users.id, agreement.marchantId));
    const [request] = await db.select().from(requests).where(eq(requests.id, agreement.requestId));

    const sigWithNames = await Promise.all(sigs.map(async (sig) => {
      const [u] = await db.select().from(users).where(eq(users.id, sig.userId));
      return {
        ...sig,
        userName: u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Unknown",
      };
    }));

    return {
      ...agreement,
      seller: sellerUser ? { id: sellerUser.id, firstName: sellerUser.firstName, lastName: sellerUser.lastName, email: sellerUser.email } : null,
      marchand: marchandUser ? { id: marchandUser.id, firstName: marchandUser.firstName, lastName: marchandUser.lastName, email: marchandUser.email } : null,
      request: request || null,
      signatures: sigWithNames,
    };
  }

  async getUserAgreements(userId: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(agreements)
      .where(or(eq(agreements.sellerId, userId), eq(agreements.marchantId, userId)))
      .orderBy(desc(agreements.generatedAt));
    return Promise.all(rows.map(async (agreement) => {
      const sigs = await db.select().from(agreementSignatures).where(eq(agreementSignatures.agreementId, agreement.id));
      const [sellerUser] = await db.select().from(users).where(eq(users.id, agreement.sellerId));
      const [marchandUser] = await db.select().from(users).where(eq(users.id, agreement.marchantId));
      const [request] = await db.select().from(requests).where(eq(requests.id, agreement.requestId));
      const sigWithNames = await Promise.all(sigs.map(async (sig) => {
        const [u] = await db.select().from(users).where(eq(users.id, sig.userId));
        return {
          ...sig,
          userName: u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email : "Unknown",
        };
      }));
      return {
        ...agreement,
        seller: sellerUser ? { id: sellerUser.id, firstName: sellerUser.firstName, lastName: sellerUser.lastName, email: sellerUser.email } : null,
        marchand: marchandUser ? { id: marchandUser.id, firstName: marchandUser.firstName, lastName: marchandUser.lastName, email: marchandUser.email } : null,
        request: request || null,
        signatures: sigWithNames,
      };
    }));
  }

  async getAdminAgreements(): Promise<any[]> {
    const rows = await db.select().from(agreements).orderBy(desc(agreements.generatedAt));
    return Promise.all(rows.map(async (agreement) => {
      const sigs = await db.select().from(agreementSignatures).where(eq(agreementSignatures.agreementId, agreement.id));
      const [sellerUser] = await db.select().from(users).where(eq(users.id, agreement.sellerId));
      const [marchandUser] = await db.select().from(users).where(eq(users.id, agreement.marchantId));
      const sellerSig = sigs.find((s) => s.userId === agreement.sellerId);
      const marchandSig = sigs.find((s) => s.userId === agreement.marchantId);
      return {
        ...agreement,
        sellerName: sellerUser ? `${sellerUser.firstName || ""} ${sellerUser.lastName || ""}`.trim() || sellerUser.email : "Unknown",
        marchandName: marchandUser ? `${marchandUser.firstName || ""} ${marchandUser.lastName || ""}`.trim() || marchandUser.email : "Unknown",
        signatureCount: sigs.length,
        sellerSignedAt: sellerSig?.signedAt ?? null,
        marchandSignedAt: marchandSig?.signedAt ?? null,
      };
    }));
  }

  async createAgreementSignature(data: InsertAgreementSignature): Promise<AgreementSignature> {
    const [sig] = await db.insert(agreementSignatures).values(data).returning();
    return sig;
  }

  async getAgreementSignatures(agreementId: number): Promise<AgreementSignature[]> {
    return db.select().from(agreementSignatures).where(eq(agreementSignatures.agreementId, agreementId));
  }

  async getAgreementSignature(agreementId: number, userId: string): Promise<AgreementSignature | undefined> {
    const [sig] = await db.select().from(agreementSignatures).where(
      and(eq(agreementSignatures.agreementId, agreementId), eq(agreementSignatures.userId, userId))
    );
    return sig;
  }

  async getFeeTiers(activeOnly = false): Promise<FeeTier[]> {
    if (activeOnly) {
      return db.select().from(feeTiers).where(eq(feeTiers.isActive, true)).orderBy(feeTiers.minPrice);
    }
    return db.select().from(feeTiers).orderBy(feeTiers.minPrice);
  }

  async getFeeTier(id: number): Promise<FeeTier | undefined> {
    const [tier] = await db.select().from(feeTiers).where(eq(feeTiers.id, id));
    return tier;
  }

  async createFeeTier(data: InsertFeeTier): Promise<FeeTier> {
    const [tier] = await db.insert(feeTiers).values(data).returning();
    return tier;
  }

  async updateFeeTier(id: number, data: Partial<InsertFeeTier>): Promise<FeeTier | undefined> {
    const [tier] = await db.update(feeTiers).set(data).where(eq(feeTiers.id, id)).returning();
    return tier;
  }

  async deleteFeeTier(id: number): Promise<void> {
    await db.update(feeTiers).set({ isActive: false }).where(eq(feeTiers.id, id));
  }

  async getTierForPrice(price: number): Promise<FeeTier | undefined> {
    const [tier] = await db.select().from(feeTiers)
      .where(
        and(
          eq(feeTiers.isActive, true),
          lte(feeTiers.minPrice, String(price)),
          or(isNull(feeTiers.maxPrice), gte(feeTiers.maxPrice, String(price)))
        )
      )
      .orderBy(desc(feeTiers.minPrice))
      .limit(1);
    return tier;
  }

  async checkRangeCoveredByTiers(minPrice: number, maxPrice: number): Promise<boolean> {
    const activeTiers = await db
      .select()
      .from(feeTiers)
      .where(eq(feeTiers.isActive, true))
      .orderBy(asc(feeTiers.minPrice));

    if (activeTiers.length === 0) return false;

    let covered = minPrice;
    for (const tier of activeTiers) {
      const tierMin = parseFloat(tier.minPrice);
      const tierMax = tier.maxPrice !== null ? parseFloat(tier.maxPrice) : Infinity;

      if (tierMin > maxPrice) break;
      if (tierMax < minPrice) continue;
      if (tierMin > covered) return false;
      covered = Math.max(covered, tierMax);
      if (covered >= maxPrice) return true;
    }
    return covered >= maxPrice;
  }

  async getUncoveredItems(): Promise<Item[]> {
    return db
      .select()
      .from(items)
      .where(
        and(
          isNotNull(items.approvedPrice),
          isNull(items.deletedAt),
          sql`NOT EXISTS (
            SELECT 1 FROM fee_tiers
            WHERE fee_tiers.is_active = true
            AND fee_tiers.min_price::numeric <= items.approved_price::numeric
            AND (fee_tiers.max_price IS NULL OR fee_tiers.max_price::numeric >= items.approved_price::numeric)
          )`
        )
      );
  }

  async logTierChange(data: { feeTierId: number | null; adminId: string; action: string; previousValues?: unknown; newValues?: unknown }): Promise<FeeTierChangelog> {
    const [entry] = await db.insert(feeTierChangelog).values({
      feeTierId: data.feeTierId || null,
      adminId: data.adminId,
      action: data.action,
      previousValues: data.previousValues || null,
      newValues: data.newValues || null,
    }).returning();
    return entry;
  }

  async getFeeTierChangelog(): Promise<any[]> {
    const rows = await db
      .select({ log: feeTierChangelog, admin: users, tier: feeTiers })
      .from(feeTierChangelog)
      .leftJoin(users, eq(users.id, feeTierChangelog.adminId))
      .leftJoin(feeTiers, eq(feeTiers.id, feeTierChangelog.feeTierId))
      .orderBy(desc(feeTierChangelog.changedAt));
    return rows.map((r) => ({
      ...r.log,
      adminName: r.admin ? `${r.admin.firstName || ""} ${r.admin.lastName || ""}`.trim() || r.admin.email : "Admin",
      tierLabel: r.tier?.label || null,
    }));
  }

  async seedDefaultFeeTiers(): Promise<void> {
    const existing = await db.select({ id: feeTiers.id }).from(feeTiers).limit(1);
    if (existing.length === 0) {
      const defaults = [
        { label: "Entry (€0–€150)", minPrice: "0", maxPrice: "150", sellerPercent: "50", marchantPercent: "40", platformPercent: "10", isActive: true },
        { label: "Standard (€151–€500)", minPrice: "151", maxPrice: "500", sellerPercent: "55", marchantPercent: "35", platformPercent: "10", isActive: true },
        { label: "Premium (€501+)", minPrice: "501", maxPrice: null, sellerPercent: "60", marchantPercent: "30", platformPercent: "10", isActive: true },
      ];
      for (const tier of defaults) {
        await db.insert(feeTiers).values(tier);
      }
      console.log("[fee-tiers] Seeded 3 default fee tiers.");
      return;
    }

    // One-time migration: ensure the Standard and Premium default tiers use inclusive
    // integer boundaries (151 and 501) so the inclusive query (min <= price <= max)
    // assigns €150 to Entry and €151 to Standard, with no uncovered integer prices.
    // Covers: original wrong decimal values (150.01, 500.01), wrong integer values (150, 500 from
    // a previous bad migration), and any stale off-by-one values.
    const fixed151 = await db
      .update(feeTiers)
      .set({ minPrice: "151" })
      .where(
        and(
          sql`${feeTiers.minPrice}::numeric IN (150, 150.01)`,
          sql`${feeTiers.maxPrice}::numeric = 500`,
        )
      )
      .returning({ id: feeTiers.id });
    if (fixed151.length > 0) {
      console.log(`[fee-tiers] Boundary migration: updated ${fixed151.length} Standard tier(s) to minPrice 151.`);
    }

    const fixed501 = await db
      .update(feeTiers)
      .set({ minPrice: "501" })
      .where(
        and(
          sql`${feeTiers.minPrice}::numeric IN (500, 500.01)`,
          isNull(feeTiers.maxPrice),
        )
      )
      .returning({ id: feeTiers.id });
    if (fixed501.length > 0) {
      console.log(`[fee-tiers] Boundary migration: updated ${fixed501.length} Premium tier(s) to minPrice 501.`);
    }
  }

  async createPriceOffer(data: InsertItemPriceOffer): Promise<ItemPriceOffer> {
    const [row] = await db.insert(itemPriceOffers).values(data).returning();
    return row;
  }

  async getPriceOffersByItem(itemId: number): Promise<(ItemPriceOffer & { proposedByName: string })[]> {
    const rows = await db
      .select({ offer: itemPriceOffers, proposedBy: users })
      .from(itemPriceOffers)
      .leftJoin(users, eq(users.id, itemPriceOffers.proposedByUserId))
      .where(eq(itemPriceOffers.itemId, itemId))
      .orderBy(itemPriceOffers.createdAt);
    return rows.map((r) => ({
      ...r.offer,
      proposedByName: r.proposedBy
        ? `${r.proposedBy.firstName || ""} ${r.proposedBy.lastName || ""}`.trim() || r.proposedBy.email || "Unknown"
        : "Unknown",
    }));
  }

  async getListedItems(): Promise<Item[]> {
    return db
      .select()
      .from(items)
      .where(and(eq(items.status, "listed"), isNull(items.deletedAt)))
      .orderBy(desc(items.listedAt));
  }

  async getCart(userId: string): Promise<Array<{ cartItem: CartItem; item: Item }>> {
    const rows = await db
      .select({ cartItem: cartItems, item: items })
      .from(cartItems)
      .innerJoin(items, eq(items.id, cartItems.itemId))
      .where(and(eq(cartItems.userId, userId), isNull(items.deletedAt)))
      .orderBy(desc(cartItems.createdAt));
    return rows;
  }

  async addCartItem(userId: string, itemId: number): Promise<CartItem> {
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.itemId, itemId)))
      .limit(1);
    if (existing) return existing;
    const [row] = await db.insert(cartItems).values({ userId, itemId }).returning();
    return row;
  }

  async removeCartItem(userId: string, itemId: number): Promise<void> {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.itemId, itemId)));
  }

  async removeCartItems(userId: string, itemIds: number[]): Promise<void> {
    if (itemIds.length === 0) return;
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), inArray(cartItems.itemId, itemIds)));
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user;
  }

  async createPayment(data: {
    userId: string;
    stripeCheckoutSessionId: string;
    amount: string;
    currency: string;
    cartSnapshot: CartSnapshotLine[];
  }): Promise<Payment> {
    const [row] = await db.insert(payments).values({
      userId: data.userId,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      amount: data.amount,
      currency: data.currency,
      status: "pending",
      cartSnapshot: data.cartSnapshot,
    }).returning();
    return row;
  }

  async getPaymentBySession(sessionId: string): Promise<Payment | undefined> {
    const [row] = await db.select().from(payments).where(eq(payments.stripeCheckoutSessionId, sessionId)).limit(1);
    return row;
  }

  async markPaymentPaid(id: number, stripePaymentIntentId: string | null): Promise<Payment | undefined> {
    const [row] = await db
      .update(payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId,
      })
      .where(eq(payments.id, id))
      .returning();
    return row;
  }

  async markReceiptSent(id: number): Promise<void> {
    await db.update(payments).set({ receiptSentAt: new Date() }).where(eq(payments.id, id));
  }

  async listLedger(userId?: string): Promise<LedgerEntry[]> {
    const payRows = await db
      .select({ payment: payments, payer: users })
      .from(payments)
      .leftJoin(users, eq(users.id, payments.userId))
      .orderBy(desc(payments.createdAt));

    const txnRows = await db
      .select({ txn: transactions, itemTitle: items.title })
      .from(transactions)
      .leftJoin(items, eq(items.id, transactions.itemId))
      .orderBy(desc(transactions.createdAt));

    const ids = new Set<string>();
    for (const row of txnRows) {
      ids.add(row.txn.sellerId);
      ids.add(row.txn.marchantId);
      if (row.txn.payerUserId) ids.add(row.txn.payerUserId);
    }
    for (const row of payRows) {
      for (const line of row.payment.cartSnapshot || []) {
        ids.add(line.sellerId);
        ids.add(line.marchantId);
      }
    }
    const people = ids.size
      ? await db.select().from(users).where(inArray(users.id, Array.from(ids)))
      : [];
    const byId = new Map(people.map((person) => [person.id, person]));
    const displayName = (id: string | null | undefined) => {
      if (!id) return null;
      const person = byId.get(id);
      if (!person) return null;
      return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.email || null;
    };

    const stripeEntries: LedgerEntry[] = payRows.map((row) => {
      const lines = row.payment.cartSnapshot || [];
      const sellerId = lines[0]?.sellerId || null;
      const marchantId = lines[0]?.marchantId || null;
      return {
        key: `payment-${row.payment.id}`,
        kind: "stripe",
        createdAt: (row.payment.paidAt || row.payment.createdAt)?.toISOString() ?? null,
        status: row.payment.status,
        amount: row.payment.amount,
        currency: row.payment.currency,
        payerUserId: row.payment.userId,
        payerName: row.payer ? `${row.payer.firstName || ""} ${row.payer.lastName || ""}`.trim() || row.payer.email : null,
        payerEmail: row.payer?.email || null,
        sellerId,
        sellerName: displayName(sellerId),
        marchantId,
        marchantName: displayName(marchantId),
        itemTitles: lines.map((line) => line.title),
        stripeCheckoutSessionId: row.payment.stripeCheckoutSessionId,
        stripePaymentIntentId: row.payment.stripePaymentIntentId,
      };
    });

    const manualEntries: LedgerEntry[] = txnRows
      .filter((row) => !row.txn.paymentId)
      .map((row) => ({
        key: `txn-${row.txn.id}`,
        kind: "manual",
        createdAt: row.txn.createdAt?.toISOString() ?? null,
        status: row.txn.status,
        amount: row.txn.salePrice,
        currency: "eur",
        payerUserId: row.txn.payerUserId,
        payerName: displayName(row.txn.payerUserId),
        payerEmail: row.txn.payerUserId ? byId.get(row.txn.payerUserId)?.email || null : null,
        sellerId: row.txn.sellerId,
        sellerName: displayName(row.txn.sellerId),
        marchantId: row.txn.marchantId,
        marchantName: displayName(row.txn.marchantId),
        itemTitles: row.itemTitle ? [row.itemTitle] : [],
        stripeCheckoutSessionId: row.txn.stripeCheckoutSessionId,
        stripePaymentIntentId: row.txn.stripePaymentIntentId,
      }));

    const merged = [...stripeEntries, ...manualEntries].sort((a, b) => {
      const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return right - left;
    });

    if (!userId) return merged;
    return merged.filter((entry) =>
      entry.payerUserId === userId || entry.sellerId === userId || entry.marchantId === userId,
    );
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return row;
  }

  async getTransactionsByPayment(paymentId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.paymentId, paymentId));
  }

  async createPayoutIfMissing(data: {
    paymentId: number;
    transactionId: number;
    userId: string;
    role: string;
    amount: string;
    currency: string;
  }): Promise<void> {
    await db.insert(payouts).values(data).onConflictDoNothing();
  }

  async setPayoutIbanEncrypted(userId: string, ibanEncrypted: string | null): Promise<void> {
    if (ibanEncrypted === null) {
      await db.delete(payoutBankAccounts).where(eq(payoutBankAccounts.userId, userId));
      return;
    }
    await db.insert(payoutBankAccounts)
      .values({ userId, ibanEncrypted, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: payoutBankAccounts.userId,
        set: { ibanEncrypted, updatedAt: new Date() },
      });
  }

  async listPayoutsForUser(userId: string): Promise<Payout[]> {
    return db.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.createdAt));
  }

  async listPayoutsByStatus(status: string): Promise<AdminPayoutRow[]> {
    const rows = await db
      .select({
        id: payouts.id,
        paymentId: payouts.paymentId,
        transactionId: payouts.transactionId,
        userId: payouts.userId,
        role: payouts.role,
        amount: payouts.amount,
        currency: payouts.currency,
        status: payouts.status,
        createdAt: payouts.createdAt,
        paidAt: payouts.paidAt,
        transferReference: payouts.transferReference,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        bankAccountHolder: profiles.bankAccountHolder,
        bankIbanEncrypted: payoutBankAccounts.ibanEncrypted,
        bankIbanLast4: profiles.bankIbanLast4,
        bankBic: profiles.bankBic,
        itemId: transactions.itemId,
      })
      .from(payouts)
      .leftJoin(users, eq(users.id, payouts.userId))
      .leftJoin(profiles, eq(profiles.userId, payouts.userId))
      .leftJoin(payoutBankAccounts, eq(payoutBankAccounts.userId, payouts.userId))
      .leftJoin(transactions, eq(transactions.id, payouts.transactionId))
      .where(eq(payouts.status, status))
      .orderBy(desc(payouts.createdAt));

    const result: AdminPayoutRow[] = [];
    for (const row of rows) {
      let itemTitle: string | null = null;
      if (row.itemId != null) {
        const item = await this.getItem(row.itemId);
        itemTitle = item?.title || null;
      }
      const name = `${row.firstName || ""} ${row.lastName || ""}`.trim() || null;
      result.push({
        id: row.id,
        paymentId: row.paymentId,
        transactionId: row.transactionId,
        userId: row.userId,
        role: row.role,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        createdAt: row.createdAt,
        paidAt: row.paidAt,
        transferReference: row.transferReference,
        recipientName: name,
        recipientEmail: row.email,
        bankAccountHolder: row.bankAccountHolder,
        bankIbanEncrypted: row.bankIbanEncrypted,
        bankIbanLast4: row.bankIbanLast4,
        bankBic: row.bankBic,
        itemTitle,
      });
    }
    return result;
  }

  async markPayoutPaid(id: number, adminUserId: string, transferReference: string): Promise<Payout | undefined> {
    const [row] = await db.update(payouts).set({
      status: "paid",
      paidAt: new Date(),
      paidByUserId: adminUserId,
      transferReference,
    }).where(and(eq(payouts.id, id), eq(payouts.status, "owed"))).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
