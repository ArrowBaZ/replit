# Sellzy Codebase Analysis: Metadata, Constants, i18n & Code Quality

## Executive Summary

The Sellzy codebase demonstrates a **well-structured, multilingual approach** with centralized constants, strong TypeScript typing, and a comprehensive i18n system. However, there are opportunities to improve **type safety, scalability, and DX** by establishing better patterns for constants management and translations.

---

## 1. Metadata/Constants Patterns

### Current State

#### Location & Organization

| Category | Location | Status |
|----------|----------|--------|
| **Item Categories** | `shared/schema.ts` (lines 63-80) | ✅ Centralized |
| **Conditions** | `client/src/pages/create-request.tsx` (line 17) | ⚠️ Scattered |
| **Service Types** | Multiple locations (no single source) | ⚠️ Scattered |
| **Request/Item Statuses** | Implicit in code, no constants file | ⚠️ Not defined |
| **Roles** | Implicit in code | ⚠️ Not defined |

#### Code Examples

**✅ Good: ITEM_CATEGORIES (shared/schema.ts)**
```typescript
// Lines 63-80 - Single source of truth, exported from shared module
export const ITEM_CATEGORIES = [
  "all_fashion",
  "clothing",
  "watches_jewelry",
  // ... 13 more
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];
```

**⚠️ Problem: CONDITIONS scattered (client/src/pages/create-request.tsx)**
```typescript
// Line 16-17 - Local definition, not shared with server
const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"] as const;
const CONDITIONS = ["new_with_tags", "like_new", "good", "fair"] as const;
```

**⚠️ Problem: SERVICE_TYPES not defined**
```typescript
// client/src/pages/create-request.tsx, lines 37-59
// Service types hardcoded in UI with no server-side validation constants
const serviceTypes = [
  { value: "classic", label: t("classic"), ... },
  { value: "express", label: t("express"), ... },
  { value: "sos_dressing", label: t("sosDressing"), ... },
];
```

**⚠️ Problem: Statuses implicit**
```typescript
// No constants for: pending, matched, scheduled, in_progress, completed, cancelled, etc.
// Values discovered by reading schema.ts and routes.ts
```

### Server-Side Constants (server/routes.ts)

The server maintains **category-aware field validation** with a map structure:

```typescript
// Lines 70-87 - Good pattern but not shared with client
const CATEGORY_ALLOWED_FIELDS: Partial<Record<typeof ITEM_CATEGORIES[number], string[]>> = {
  all_fashion: [],
  clothing: ["brand", "size", "condition"],
  watches_jewelry: ["brand", "material", "condition", "certificatePhotos"],
  // ... more categories
};
```

This is excellent for **server validation** but creates a gap:
- Client doesn't know which fields are allowed per category
- Leads to potential inconsistency if server schema updates without client update

### Type Safety

**Strong:** ITEM_CATEGORIES uses `as const` for literal types
```typescript
// This gives us proper type inference
type ItemCategory = typeof ITEM_CATEGORIES[number];
// = "all_fashion" | "clothing" | "watches_jewelry" | ...
```

**Weak:** Other constants lack proper typing
```typescript
// In create-request.tsx
const CONDITIONS = ["new_with_tags", "like_new", "good", "fair"] as const;
// Works, but only locally

// In routes.ts, conditions are strings without validation
condition: z.string().optional(),
```

---

## 2. Internationalization Setup

### Architecture

**Framework:** Custom context-based i18n (not i18next or react-intl)

**Location:** `/client/src/lib/i18n.tsx` (882 lines)

### Current Implementation

#### Language Support
- English (en)
- French (fr) - Default language
- Stored in localStorage as `sellzy-lang`
- Graceful fallback: if key missing, tries other language

#### Provider Pattern
```typescript
// lines 838-860
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sellzy-lang") as Language;
      if (stored === "en" || stored === "fr") return stored;
    }
    return "fr"; // Default to French
  });
  // ... rest of implementation
}
```

#### Hook API
```typescript
// Usage throughout codebase
const { t } = useI18n();
t("heroTitle")  // Returns translated string
```

#### Translation Keys
- **Total keys:** 400+ UI strings
- **Coverage:** Landing, onboarding, dashboards, requests, items, profile, admin, static pages
- **Type safety:** `TranslationKey = keyof typeof translations.en`

#### Status Translations
```typescript
// lines 866-879 - Special helper for status fields
export function useTranslateStatus(status: string): string {
  const { t } = useI18n();
  const statusMap: Record<string, TranslationKey> = {
    pending: "statusPending",
    matched: "statusMatched",
    // ... 9 more statuses
  };
  return t(statusMap[status] || status);
}
```

### Translation Coverage

| Feature | EN | FR | Notes |
|---------|----|----|-------|
| Categories | ✅ | ✅ | catTops, catClothing, etc. (14 keys) |
| Conditions | ✅ | ✅ | condNew, condLikeNew, etc. (4 keys) |
| Statuses | ✅ | ✅ | statusPending, statusMatched, etc. (11 keys) |
| Service Types | ✅ | ✅ | classic, express, sosDressing |
| Roles | ❌ | ❌ | No translation keys for seller/reseller/admin |
| Error Messages | ✅ | ✅ | Partial coverage |

### DX Issues with Current i18n

1. **Manual statusMap maintenance** - If a new status is added to schema, developer must:
   - Add status key to translations.en
   - Add status key to translations.fr
   - Add mapping in statusMap

2. **No constants for translation keys** - Easy to typo keys
   ```typescript
   t("statusPending")   // ✅ Works
   t("statuspendig")    // ❌ Typo - returns "statuspendig" instead of failing
   ```

3. **Single file growing** - i18n.tsx is 882 lines, harder to maintain

4. **Server/Client translation gap** - Server doesn't have access to translations
   - Cannot send localized error messages
   - Cannot send localized status labels in API responses

---

## 3. Code Quality Baseline

### TypeScript Configuration

**File:** `tsconfig.json`

**Strict Mode:** ✅ **ENABLED** (line 9: `"strict": true`)

This includes:
- ✅ `noImplicitAny`
- ✅ `strictNullChecks`
- ✅ `strictFunctionTypes`
- ✅ `strictBindCallApply`
- ✅ `strictPropertyInitialization`

**Path Aliases:** ✅ Configured
```json
"paths": {
  "@/*": ["./client/src/*"],
  "@shared/*": ["./shared/*"]
}
```

### Test Infrastructure

**Framework:** Vitest with coverage tracking

**Configuration:** `vitest.config.ts`
- ✅ Coverage provider: v8
- ✅ Coverage thresholds: **80%** for lines, functions, branches, statements
- ✅ Separate test environments: jsdom (client), node (server)
- ✅ Setup files configured for both projects

**Current Test Status:** ❌ **NO TESTS WRITTEN YET**
- No test files found in project (excluding node_modules)
- Infrastructure is ready but unused
- Test directory structure exists (`server/test/`) with helpers only

### Code Organization

**Monorepo Structure:**
```
project/
├── shared/
│   ├── schema.ts        ✅ Centralized data models & ITEM_CATEGORIES
│   └── models/
│       └── auth.ts
├── server/
│   ├── routes.ts        ✅ Category-aware validation (CATEGORY_ALLOWED_FIELDS)
│   └── replit_integrations/
└── client/
    └── src/
        ├── lib/
        │   └── i18n.tsx ✅ Centralized translations
        └── pages/
```

**Good Practices:**
- ✅ Shared module for schema definitions
- ✅ Type generation from Drizzle schema
- ✅ Validation with Zod
- ✅ Constants exported with proper types

**Areas for Improvement:**
- ⚠️ Constants not systematically organized (scattered across files)
- ⚠️ No constants file for `shared/constants.ts`
- ⚠️ Category-aware validation only on server, not shared
- ⚠️ No tests covering constant usage

### Type Safety Assessment

| Aspect | Score | Notes |
|--------|-------|-------|
| Strict Mode | ✅ A | Enabled globally |
| Shared Types | ✅ A | Drizzle schema + type inference |
| Category Types | ✅ A | ItemCategory literal type |
| Status Types | ⚠️ C | String types, no validation |
| Validation | ✅ A | Zod schemas on server |
| Constants | ⚠️ C | Scattered, not all typed |
| i18n Keys | ⚠️ C | Manual validation, prone to typos |

---

## 4. Related Patterns

### Enum Pattern Usage

**Current:** No enums defined. Using string constants and Zod validation instead.

```typescript
// Current approach (Zod validation)
category: z.enum(ITEM_CATEGORIES),
condition: z.string().optional(),
status: varchar("status", { length: 20 })  // String, validated at app level
```

**Alternative available:**
```typescript
// Could use TypeScript enums (not currently used)
enum ItemStatus {
  PENDING = "pending",
  MATCHED = "matched",
  // ...
}
```

### Validation Patterns

**Server-side (routes.ts):**
- ✅ Zod schemas for all request bodies
- ✅ Custom refinement for category-field validation
- ✅ Middleware-based validation

**Client-side (pages):**
- ✅ React Hook Form with some validation
- ⚠️ Limited validation before submission
- ⚠️ No shared validation schemas between client/server

### Translation Utility Patterns

1. **Direct key access:** `t("heroTitle")`
2. **Status mapping:** `useTranslateStatus(status)`
3. **Manual mapping in components:**
   ```typescript
   const categoryLabels: Record<string, string> = {
     tops: t("catTops"),
     bottoms: t("catBottoms"),
     // ... duplicated in multiple components
   ```

---

## 5. DX Issues & Friction Points

### A. Constants Management

**Problem 1: Duplication**
- CONDITIONS defined in `client/src/pages/create-request.tsx` (line 17)
- Actual conditions stored in database but never validated against a shared list
- Server has no explicit CONDITIONS constant

**Problem 2: Server/Client Mismatch**
- CATEGORY_ALLOWED_FIELDS (server-only) prevents client from knowing which fields to show
- Service types not validated against a constants list
- Roles (seller, reusse, admin) mentioned in code but never defined

**Problem 3: Adding New Constants**
Current process requires changes across multiple files:
1. Add to schema.ts (ITEM_CATEGORIES)
2. Add to server/routes.ts validation
3. Add to i18n.tsx translation keys
4. Add to client components manually
5. Add statusMap entry if applicable
6. No single file to review all constants

### B. Internationalization

**Problem 1: Translation Key Typos**
```typescript
t("statusPendng")  // Typo - silently returns key instead of error
```

**Problem 2: Status Translation Maintenance**
- Must update three places: translations.en, translations.fr, statusMap
- Easy to add status to schema but forget translations

**Problem 3: No Translation for Metadata**
- Roles not translated (seller/reseller/admin show in English only)
- Categories in database but not all have display-friendly labels

**Problem 4: i18n File Growing**
- 882 lines in single file
- Mix of all UI strings makes it hard to find metadata translations
- No organization by feature/domain

### C. Type Safety Gaps

**Problem 1: String-based Status**
```typescript
// No type checking - any string accepted
status: varchar("status", { length: 20 }).notNull().default("pending");

// Should be:
status: varchar("status", { length: 20 }).notNull().$type<RequestStatus>()
```

**Problem 2: Unvalidated Constants**
```typescript
// Client sends conditions but no shared validation
const CONDITIONS = ["new_with_tags", "like_new", "good", "fair"] as const;
// Server accepts any string for condition field
condition: z.string().optional(),
```

**Problem 3: No Exhaustive Status Handling**
```typescript
// Easy to miss cases
switch(status) {
  case "pending": ...
  case "completed": ...
  // What about "matched", "scheduled", etc?
}
```

---

## 6. Current Test Coverage

**Status:** ✅ Infrastructure ready, ❌ **Zero tests written**

**Setup files exist:**
- `/server/test/setup.ts` - Empty setup
- `/server/test/auth-helper.ts` - Helper utilities (not tests)
- `/server/test/mock-storage.ts` - Mock implementations
- `client/src/test/setup.ts` - Referenced but likely empty

**What needs testing:**
1. ✅ Category validation (validateCategoryFields in routes.ts)
2. ✅ Status transitions
3. ✅ i18n key resolution
4. ✅ Type coverage for constants

---

## 7. Recommendations for Improvement

### Immediate (High Priority)

#### 1. Create `shared/constants.ts`
**Goal:** Single source of truth for all metadata

```typescript
// shared/constants.ts
export const ITEM_CATEGORIES = [
  "all_fashion", "clothing", "watches_jewelry",
  // ... as currently in schema.ts
] as const;

export const ITEM_CONDITIONS = [
  "new_with_tags", "like_new", "good", "fair"
] as const;

export const SERVICE_TYPES = [
  "classic", "express", "sos_dressing"
] as const;

export const REQUEST_STATUSES = [
  "pending", "matched", "scheduled", "in_progress",
  "completed", "cancelled"
] as const;

export const ITEM_STATUSES = [
  "pending_approval", "approved", "listed", "sold"
] as const;

export const USER_ROLES = [
  "seller", "reusse", "admin"
] as const;

// Type exports
export type ItemCategory = typeof ITEM_CATEGORIES[number];
export type ItemCondition = typeof ITEM_CONDITIONS[number];
export type ServiceType = typeof SERVICE_TYPES[number];
export type RequestStatus = typeof REQUEST_STATUSES[number];
export type ItemStatus = typeof ITEM_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];
```

**Usage in schema.ts:**
```typescript
import { ITEM_CATEGORIES, ItemCategory, ITEM_CONDITIONS } from "@shared/constants";

// Remove duplicate definitions
// Use imports instead
```

#### 2. Add Condition Validation to Server
**Goal:** Prevent invalid conditions from being saved

```typescript
// server/routes.ts
import { ITEM_CONDITIONS } from "@shared/constants";

const itemFields = {
  condition: z.enum(ITEM_CONDITIONS).optional(),
  // ... rest
};
```

#### 3. Create `shared/i18n-keys.ts`
**Goal:** Prevent typos in translation keys

```typescript
// shared/i18n-keys.ts
export const TRANSLATION_KEYS = {
  categories: {
    tops: "catTops",
    bottoms: "catBottoms",
    dresses: "catDresses",
    // ... all categories
  },
  conditions: {
    new_with_tags: "condNew",
    like_new: "condLikeNew",
    good: "condGood",
    fair: "condFair",
  },
  statuses: {
    pending: "statusPending",
    matched: "statusMatched",
    // ... all statuses
  },
  roles: {
    seller: "roleSeller",
    reusse: "roleReseller",
    admin: "roleAdmin",
  },
} as const;
```

#### 4. Update i18n.tsx to Use Keys
**Goal:** Reduce manual maintenance, improve DX

```typescript
// client/src/lib/i18n.tsx
import { TRANSLATION_KEYS } from "@shared/i18n-keys";

export function useTranslateStatus(status: string): string {
  const { t } = useI18n();
  const key = TRANSLATION_KEYS.statuses[status as keyof typeof TRANSLATION_KEYS.statuses];
  return t(key || status);
}

// Helper for categories
export function useTranslateCategory(category: string): string {
  const { t } = useI18n();
  const key = TRANSLATION_KEYS.categories[category as keyof typeof TRANSLATION_KEYS.categories];
  return t(key || category);
}
```

#### 5. Add Missing Role Translations
**Goal:** Complete i18n coverage

```typescript
// client/src/lib/i18n.tsx
// In translations.en and translations.fr
roleSeller: "Seller",
roleReseller: "Reseller",
roleAdmin: "Administrator",
```

### Medium Priority

#### 1. Add Basic Test Suite
**Files to test:**
- `shared/constants.ts` - Ensure exports are valid
- `server/routes.ts` - Category validation logic
- `client/src/lib/i18n.tsx` - Translation resolution

**Example:**
```typescript
// server/routes.ts.test.ts
import { validateCategoryFields } from "../routes";
import { ITEM_CATEGORIES } from "@shared/constants";

describe("Category validation", () => {
  it("should accept clothing category with size", () => {
    const data = { category: "clothing", size: "M" };
    // validate and assert
  });

  it("should reject clothing category with ageRange", () => {
    const data = { category: "clothing", ageRange: "5-7" };
    // validate and assert
  });
});
```

#### 2. Create Category Metadata
**Goal:** Store per-category field configuration client-side

```typescript
// shared/category-schema.ts
export const CATEGORY_SCHEMA = {
  all_fashion: { fields: [] },
  clothing: { fields: ["brand", "size", "condition"] },
  watches_jewelry: { fields: ["brand", "material", "condition", "certificatePhotos"] },
  // ... matching server's CATEGORY_ALLOWED_FIELDS
} as const;
```

**Usage in client:**
```typescript
// client/src/pages/request-detail.tsx
import { CATEGORY_SCHEMA } from "@shared/category-schema";

const allowedFields = CATEGORY_SCHEMA[selectedCategory]?.fields || [];
```

#### 3. Improve Type Safety for Statuses
**Goal:** Exhaustive status handling

```typescript
// In schema.ts or constants.ts
export type RequestStatus = "pending" | "matched" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type ItemStatus = "pending_approval" | "approved" | "listed" | "sold" | "returned";

// In server routes
status: varchar("status", { length: 20 }).notNull().$type<RequestStatus>()
```

### Long-term (Enhancement)

#### 1. Explore Type-Safe i18n
**Goal:** Compile-time validation of i18n keys

Options:
- **tRPC with typed procedures** for API responses with translations
- **Zod schema + i18n metadata** combined
- **Code generation** from constant definitions

#### 2. API Response Localization
**Goal:** Server sends localized metadata

```typescript
// API Response
{
  item: {
    category: "clothing",
    categoryLabel: "Vêtements",  // Localized based on Accept-Language
    condition: "good",
    conditionLabel: "Bon état"
  }
}
```

#### 3. Consider i18next Migration
**Goal:** More mature i18n solution (if needs grow)

Current custom solution is light and works, but `i18next` offers:
- Pluralization
- Namespacing
- Backend language detection
- Community plugins

---

## 8. Summary Table: Current vs. Recommended

| Aspect | Current | Recommended | Effort |
|--------|---------|-------------|--------|
| Constants | Scattered across 3+ files | Centralized in `shared/constants.ts` | 2h |
| Type Safety | Mostly good, gaps with status | Add type constraints to schema | 1h |
| Validation | Server-side only | Shared schema/Zod validation | 2h |
| i18n Keys | Manual strings in code | Constants in `shared/i18n-keys.ts` | 1.5h |
| Translations | 90% complete | Add roles, ensure all metadata translated | 30m |
| Tests | Zero coverage | Start with constants + validation | 3h |
| i18n File Size | 882 lines | Split by domain/feature | 2h |

---

## 9. File References

### Key Files to Review/Modify

| File | Purpose | Priority |
|------|---------|----------|
| `shared/schema.ts` | Data models, ITEM_CATEGORIES | High |
| `server/routes.ts` | API validation, CATEGORY_ALLOWED_FIELDS | High |
| `client/src/lib/i18n.tsx` | Translations, useTranslateStatus | High |
| `client/src/pages/create-request.tsx` | Constants duplicated here | High |
| `client/src/pages/request-detail.tsx` | Uses ITEM_CATEGORIES, statuses | Medium |
| `tsconfig.json` | Type settings (already strict) | Reference |
| `vitest.config.ts` | Test infrastructure ready | Medium |

---

## 10. Health Check Results

### ✅ Strengths
- **TypeScript Strict Mode** enabled globally
- **Centralized ITEM_CATEGORIES** in shared module with proper types
- **Comprehensive i18n system** with both EN/FR translations
- **Server-side validation** with Zod
- **Test infrastructure** ready (Vitest + coverage thresholds)
- **Type inference** from Drizzle schema
- **Modular architecture** with clear server/client/shared separation

### ⚠️ Weaknesses
- **Constants scattered** across multiple files
- **Status types** not validated at database level
- **Service types/roles** not defined as constants
- **No tests written** despite infrastructure
- **Translation key mapping** manual and error-prone
- **Category metadata** duplicated (server vs. client)
- **Roles not translated** in i18n

### ❌ Blockers
- None that prevent shipping, but DX friction will increase with new constants

---

## 11. Next Steps for You

1. **Review** this analysis against your experience
2. **Prioritize** which recommendations fit your timeline
3. **Start** with creating `shared/constants.ts` (highest ROI)
4. **Follow** with i18n-keys organization
5. **Add** tests for critical validation paths

Would you like me to help implement any of these recommendations or dive deeper into specific areas?
