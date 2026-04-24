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
    getItems: vi.fn().mockResolvedValue([]),
    getItemsByRequest: vi.fn().mockResolvedValue([]),
    createItem: vi.fn().mockResolvedValue({ id: 1 }),
    updateItem: vi.fn().mockResolvedValue(undefined),

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

    getFeeTiers: vi.fn().mockResolvedValue([]),
    getFeeTier: vi.fn().mockResolvedValue(undefined),
    createFeeTier: vi.fn().mockResolvedValue({ id: 1 }),
    updateFeeTier: vi.fn().mockResolvedValue(undefined),
    deleteFeeTier: vi.fn().mockResolvedValue(undefined),
    getTierForPrice: vi.fn().mockResolvedValue(undefined),
    logTierChange: vi.fn().mockResolvedValue({ id: 1 }),
    getFeeTierChangelog: vi.fn().mockResolvedValue([]),
    seedDefaultFeeTiers: vi.fn().mockResolvedValue(undefined),
  };

  return { ...defaults, ...overrides } as IStorage;
}
