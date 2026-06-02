import { vi } from "vitest";
import type { IStorage } from "../storage";

export function createMockStorage(
  overrides: Partial<Record<keyof IStorage, unknown>> = {},
): IStorage {
  const defaults: IStorage = {
    getProfile: vi.fn().mockResolvedValue(undefined),
    createProfile: vi.fn().mockResolvedValue({ id: 1 }),
    updateProfile: vi.fn().mockResolvedValue(undefined),

    getRequests: vi.fn().mockResolvedValue([]),
    getAvailableRequests: vi.fn().mockResolvedValue([]),
    getRequest: vi.fn().mockResolvedValue(undefined),
    createRequest: vi.fn().mockResolvedValue({ id: 1 }),
    updateRequest: vi.fn().mockResolvedValue(undefined),
    acceptRequest: vi.fn().mockResolvedValue(undefined),

    getItem: vi.fn().mockResolvedValue(undefined),
    getItemIncludingDeleted: vi.fn().mockResolvedValue(undefined),
    getItems: vi.fn().mockResolvedValue([]),
    getItemsByRequest: vi.fn().mockResolvedValue([]),
    createItem: vi.fn().mockResolvedValue({ id: 1 }),
    updateItem: vi.fn().mockResolvedValue(undefined),
    updateItemConditional: vi.fn().mockResolvedValue(undefined),
    softDeleteItem: vi.fn().mockResolvedValue(undefined),
    bulkApproveItemsTransaction: vi.fn().mockResolvedValue({ updatedItems: [] }),

    getMeetings: vi.fn().mockResolvedValue([]),
    getMeetingsByRequest: vi.fn().mockResolvedValue([]),
    createMeeting: vi.fn().mockResolvedValue({ id: 1 }),
    getMeeting: vi.fn().mockResolvedValue(undefined),
    updateMeeting: vi.fn().mockResolvedValue({ id: 1 }),

    getConversations: vi.fn().mockResolvedValue([]),
    getMessagesBetween: vi.fn().mockResolvedValue([]),
    createMessage: vi.fn().mockResolvedValue({ id: 1 }),
    markMessagesRead: vi.fn().mockResolvedValue(undefined),

    getNotifications: vi.fn().mockResolvedValue([]),
    createNotification: vi.fn().mockResolvedValue({ id: 1 }),
    markNotificationRead: vi.fn().mockResolvedValue(undefined),
    markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),

    getAllUsersWithProfiles: vi.fn().mockResolvedValue([]),
    getPendingReusses: vi.fn().mockResolvedValue([]),
    updateProfileStatus: vi.fn().mockResolvedValue(undefined),
    getAdminStats: vi.fn().mockResolvedValue({
      totalUsers: 0,
      totalSellers: 0,
      totalReusses: 0,
      pendingApplications: 0,
      totalRequests: 0,
      activeRequests: 0,
    }),

    createTransaction: vi.fn().mockResolvedValue({ id: 1 }),
    updateTransaction: vi.fn().mockResolvedValue({ id: 1 }),
    getTransactionByItemId: vi.fn().mockResolvedValue(undefined),
    getTransactions: vi.fn().mockResolvedValue([]),
    getEarnings: vi.fn().mockResolvedValue({ total: 0, transactions: [] }),

    getAdminRequests: vi.fn().mockResolvedValue([]),
    logModerationAction: vi.fn().mockResolvedValue({ id: 1 }),
    getModerationActions: vi.fn().mockResolvedValue([]),

    getEarningsSummary: vi.fn().mockResolvedValue([]),
    getActivityStats: vi.fn().mockResolvedValue({
      activeRequests: 0,
      soldItems: 0,
      soldThisMonth: 0,
      messagesThisMonth: 0,
    }),

    getResellers: vi.fn().mockResolvedValue([]),
    getResellerById: vi.fn().mockResolvedValue(undefined),
    getReviews: vi.fn().mockResolvedValue([]),
    createReview: vi.fn().mockResolvedValue({ id: 1 }),
    reportRequest: vi.fn().mockResolvedValue(undefined),

    getItemDocuments: vi.fn().mockResolvedValue([]),
    getItemDocument: vi.fn().mockResolvedValue(undefined),
    createItemDocument: vi.fn().mockResolvedValue({ id: 1 }),
    deleteItemDocument: vi.fn().mockResolvedValue(undefined),
    getDocumentsByUser: vi.fn().mockResolvedValue([]),
    getDocumentRequestStatus: vi.fn().mockResolvedValue(undefined),
    createDocumentRequest: vi.fn().mockResolvedValue({ id: 1 }),

    createAgreement: vi.fn().mockResolvedValue({ id: 1 }),
    getAgreement: vi.fn().mockResolvedValue(undefined),
    getAgreementByRequest: vi.fn().mockResolvedValue(undefined),
    updateAgreementStatus: vi.fn().mockResolvedValue(undefined),
    getAgreementWithDetails: vi.fn().mockResolvedValue(undefined),
    getAdminAgreements: vi.fn().mockResolvedValue([]),
    getUserAgreements: vi.fn().mockResolvedValue([]),
    createAgreementSignature: vi.fn().mockResolvedValue({ id: 1 }),
    getAgreementSignatures: vi.fn().mockResolvedValue([]),
    getAgreementSignature: vi.fn().mockResolvedValue(undefined),

    getFeeTiers: vi.fn().mockResolvedValue([]),
    getFeeTier: vi.fn().mockResolvedValue(undefined),
    createFeeTier: vi.fn().mockResolvedValue({ id: 1 }),
    updateFeeTier: vi.fn().mockResolvedValue(undefined),
    deleteFeeTier: vi.fn().mockResolvedValue(undefined),
    getTierForPrice: vi.fn().mockResolvedValue(undefined),
    checkRangeCoveredByTiers: vi.fn().mockResolvedValue(true),
    getUncoveredItems: vi.fn().mockResolvedValue([]),
    logTierChange: vi.fn().mockResolvedValue({ id: 1 }),
    getFeeTierChangelog: vi.fn().mockResolvedValue([]),
    seedDefaultFeeTiers: vi.fn().mockResolvedValue(undefined),

    createPriceOffer: vi.fn().mockResolvedValue({ id: 1 }),
    getPriceOffersByItem: vi.fn().mockResolvedValue([]),

    getRequestsPendingSellerAction: vi.fn().mockResolvedValue([]),
    getDocumentRequestsByRequest: vi.fn().mockResolvedValue([]),
  };

  return { ...defaults, ...overrides } as IStorage;
}
