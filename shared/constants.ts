// ============================================================
// Sellzy — Centralized constants (single source of truth)
// ============================================================

// ─── Item categories ─────────────────────────────────────────
export const ITEM_CATEGORIES = [
  "all_fashion",
  "clothing",
  "watches_jewelry",
  "accessories_bags",
  "furniture",
  "home_appliances",
  "decoration",
  "home_linen",
  "electronics",
  "computers",
  "phones_wearables",
  "books",
  "wines",
  "musical_instruments",
  "games_toys",
  "bicycles",
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

// ─── Categories requiring authenticity certificate ───────────
export const LUXURY_CATEGORIES: ItemCategory[] = [
  "watches_jewelry",
  "accessories_bags",
];

// ─── Item conditions ─────────────────────────────────────────
export const ITEM_CONDITIONS = [
  "new_with_tags",
  "like_new",
  "good",
  "fair",
] as const;

export type ItemCondition = typeof ITEM_CONDITIONS[number];

// ─── Service types ───────────────────────────────────────────
export const SERVICE_TYPES = [
  "classic",
  "express",
  "sos_dressing",
] as const;

export type ServiceType = typeof SERVICE_TYPES[number];

// ─── Request statuses ────────────────────────────────────────
export const REQUEST_STATUSES = [
  "pending",
  "matched",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
  "flagged",
] as const;

export type RequestStatus = typeof REQUEST_STATUSES[number];

// ─── Item statuses ───────────────────────────────────────────
export const ITEM_STATUSES = [
  "pending_approval",
  "approved",
  "listed",
  "sold",
] as const;

export type ItemStatus = typeof ITEM_STATUSES[number];

// ─── User roles ──────────────────────────────────────────────
export const USER_ROLES = [
  "seller",
  "reusse",
  "admin",
] as const;

export type UserRole = typeof USER_ROLES[number];

// ─── Category-level allowed fields (shared with server validation) ──
export const CATEGORY_ALLOWED_FIELDS: Partial<Record<ItemCategory, string[]>> = {
  all_fashion: [],
  clothing: ["brand", "size", "condition"],
  watches_jewelry: ["brand", "material", "condition", "certificatePhotos"],
  accessories_bags: ["brand", "subcategory", "condition", "certificatePhotos"],
  furniture: ["brand", "material", "dimensions", "condition"],
  home_appliances: ["brand", "applianceType", "condition"],
  decoration: ["decorStyle", "material", "condition"],
  home_linen: ["subcategory", "size", "condition"],
  electronics: ["brand", "subcategory", "condition"],
  computers: ["brand", "ram", "deviceStorage", "condition"],
  phones_wearables: ["brand", "model", "deviceStorage", "condition"],
  books: ["author", "genre", "language", "condition"],
  wines: ["subcategory", "vintage", "volume"],
  musical_instruments: ["instrumentType", "brand", "condition"],
  games_toys: ["ageRange", "brand", "condition"],
  bicycles: ["brand", "subcategory", "frameSize", "condition"],
};

// ─── i18n key maps (prevent typos when translating constants) ─
export const CATEGORY_I18N_KEYS: Record<ItemCategory, string> = {
  all_fashion: "catAllFashion",
  clothing: "catClothing",
  watches_jewelry: "catWatchesJewelry",
  accessories_bags: "catAccessoriesBags",
  furniture: "catFurniture",
  home_appliances: "catHomeAppliances",
  decoration: "catDecoration",
  home_linen: "catHomeLinen",
  electronics: "catElectronics",
  computers: "catComputers",
  phones_wearables: "catPhonesWearables",
  books: "catBooks",
  wines: "catWines",
  musical_instruments: "catMusicalInstruments",
  games_toys: "catGamesToys",
  bicycles: "catBicycles",
};

export const CONDITION_I18N_KEYS: Record<ItemCondition, string> = {
  new_with_tags: "condNew",
  like_new: "condLikeNew",
  good: "condGood",
  fair: "condFair",
};

export const STATUS_I18N_KEYS: Record<RequestStatus, string> = {
  pending: "statusPending",
  matched: "statusMatched",
  scheduled: "statusScheduled",
  in_progress: "statusInProgress",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
  flagged: "flaggedStatus",
};

export const ITEM_STATUS_I18N_KEYS: Record<ItemStatus, string> = {
  pending_approval: "statusPendingApproval",
  approved: "statusApproved",
  listed: "statusListed",
  sold: "statusSold",
};

export const SERVICE_TYPE_I18N_KEYS: Record<ServiceType, string> = {
  classic: "classic",
  express: "express",
  sos_dressing: "sosDressing",
};

export const ROLE_I18N_KEYS: Record<UserRole, string> = {
  seller: "roleSeller",
  reusse: "roleReseller",
  admin: "roleAdmin",
};
