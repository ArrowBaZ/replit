---
tags: [copilot, prd, refactoring]
feature: constants-i18n-refactor
status: active
date: 2026-03-27
type: refactor
origin: brainstorms/2026-03-27-constants-i18n-refactor.md
---

# PRD: Constants Management & i18n Migration

## Overview

A comprehensive three-phase refactor to centralize scattered metadata constants, migrate from a custom i18n system to i18next, establish shared validation schemas between client and server, and create a test foundation. This improves developer experience, prevents client/server validation mismatches, and prepares the codebase for scaling.

### Current Pain Points
- **Scattered Constants**: CATEGORIES in `shared/schema.ts`, CONDITIONS in `client/src/pages/create-request.tsx`, other constants implicit or hardcoded
- **Manual i18n Mappings**: `useTranslateStatus()` manually maps status values to translation keys (error-prone, not scalable)
- **Type Safety Gaps**: Status as `varchar` with no runtime constraint; CONDITIONS accepted as string without validation
- **Zero Test Coverage**: Vitest infrastructure ready but untested (no test files written)
- **Client/Server Validation Parity**: Server validation rules (CATEGORY_ALLOWED_FIELDS) not enforced on client

---

## Problem Statement / Motivation

### Why This Matters

1. **Developer Friction**: Adding a new status requires changes in 4+ places (schema → routes → i18n → statusMap → translations). Easy to miss a step.
2. **Bug Vulnerability**: Invalid values can slip through (client accepts string, server validates with hardcoded logic).
3. **Scalability Risk**: Current i18n.tsx (882 lines) becomes unmaintainable as you add languages or constants.
4. **Knowledge Debt**: No single place to review "what are all our statuses?" or "what fields does each category allow?"

### Success Indicators (Why Worth Doing)

- **DX**: Developers can add a new constant in one place, IDE autocomplete works
- **Type Safety**: TypeScript prevents invalid values at compile time (e.g., `type Status = "pending" | "matched"` instead of string)
- **Testability**: Validation logic has comprehensive test coverage (50+ tests)
- **Scalability**: Adding French translations doesn't require code changes

---

## Proposed Solution

### High-Level Approach

**Three independent phases, each delivering value:**

1. **Phase 1 (Constants Foundation)**: Extract all metadata into `shared/constants.ts`, establish type-safe patterns, remove duplication
   - Deliverable: Single source of truth for metadata
   - Time: 2-3 hours
   - Risk: Low (refactoring only, no behavior changes)

2. **Phase 2 (i18n Migration)**: Implement i18next, create JSON translation files, replace custom i18n context
   - Deliverable: Type-safe i18n setup, manual mappings eliminated
   - Time: 2-3 hours
   - Risk: Medium (touches all translation usage)

3. **Phase 3 (Validation & Tests)**: Create Zod schemas for shared validation, write 50+ tests for validation logic and i18n
   - Deliverable: Comprehensive test coverage, client/server validation parity
   - Time: 2-3 hours
   - Risk: Medium (establishes test patterns)

### Architecture

#### Constants System (Phase 1)

```
shared/constants.ts (new)
├── ITEM_CATEGORIES (from schema.ts)
├── ITEM_CONDITIONS
├── REQUEST_STATUSES
├── ITEM_STATUSES
├── USER_ROLES
├── SERVICE_TYPES
└── CATEGORY_ALLOWED_FIELDS (from routes.ts)

Type inference pattern:
  export const CATEGORIES = ["tops", "bottoms"] as const;
  export type ItemCategory = typeof CATEGORIES[number];
  // ItemCategory = "tops" | "bottoms"

shared/schema.ts (modified)
└── Import constants from shared/constants.ts (remove duplicates)
```

#### i18n System (Phase 2)

```
locales/
├── en.json
│   ├── categories: { tops: "Tops", bottoms: "Bottoms", ... }
│   ├── conditions: { new_with_tags: "New with Tags", ... }
│   ├── statuses: { pending: "Pending", matched: "Matched", ... }
│   └── roles: { user: "User", seller: "Seller", ... }
└── fr.json
    └── (same structure, French translations)

client/src/lib/
├── i18n-keys.ts (new: type-safe key generation)
├── i18next.config.ts (new: i18next setup)
└── [removed] i18n.tsx (deleted: custom context, replaced by i18next)

client/src/App.tsx (modified)
└── Replace <I18nProvider> with i18next <I18nextProvider>
```

#### Validation System (Phase 3)

```
shared/validation.ts (new)
├── Constants validation (Zod)
│   └── Ensure CATEGORIES/CONDITIONS/STATUSES are valid strings
├── Category field validation (Zod refinement)
│   └── Ensure fields match category (shared client/server)
└── Translation key validation (Zod)
    └── Ensure all constant values have translations

__tests__/
├── constants.test.ts (25+ tests)
│   └── Verify constants match schema, no duplicates
├── validation.test.ts (15+ tests)
│   └── Test Zod schemas, edge cases
├── i18n-keys.test.ts (10+ tests)
│   └── Verify i18n keys exist for all constants
└── integration.test.ts (5+ tests)
    └── Client/server validation parity
```

#### Type Safety Pattern (Applied Throughout)

```typescript
// Before (string type, unsafe)
const status: string = "invalid_status"; // ✗ No error

// After (literal union, safe)
const status: typeof REQUEST_STATUSES[number] = "invalid_status"; // ✗ TypeScript error
const status: typeof REQUEST_STATUSES[number] = "pending"; // ✓ OK

// In components
<select>
  {REQUEST_STATUSES.map(status => (
    <option key={status} value={status}>
      {t(`statuses.${status}`)}
    </option>
  ))}
</select>
```

---

## Technical Considerations

### Architecture Impacts

1. **Import Graph**: Phase 1 introduces `shared/constants.ts`, which `shared/schema.ts` imports. No circular dependencies.
2. **Provider Hierarchy**: Phase 2 replaces React Context provider. Must update `App.tsx` and all test providers.
3. **Translation Keys**: Phase 2 assumes namespace structure (categories.*, conditions.*). If keys don't match constants, runtime errors.
4. **Validation Layer**: Phase 3 adds Zod schemas; client must parse responses before use.

### Performance Implications

- **Bundle Size**: i18next adds ~15KB (gzipped), custom i18n.tsx is ~20KB → net ~5KB savings
- **Runtime**: Zod validation is synchronous, minimal overhead (microseconds per validation)
- **Lazy Loading**: i18next supports lazy language loading (not required in Phase 2, but available for future)

### Security Considerations

- **Input Validation**: Zod schemas prevent invalid enum values from reaching the server
- **Type Safety**: Eliminates string-based type coercion vulnerabilities
- **Translation Injection**: JSON files are static (no code injection risk)
- **No Breaking Changes**: All API contracts remain the same (data shape unchanged)

### TypeScript & Type Safety

- **Strict Mode**: Already enabled, no changes needed
- **Type Inference**: Use `as const` + `typeof` for literal types (established pattern in codebase)
- **Exhaustive Checks**: Enable TypeScript to enforce exhaustive switch statements on enums

```typescript
// Before: string type, not exhaustive
function statusColor(s: string) {
  switch (s) {
    case "pending": return "yellow";
    case "matched": return "green";
    // Missing "completed" — no error
  }
}

// After: literal union, exhaustive
type Status = typeof REQUEST_STATUSES[number];
function statusColor(s: Status) {
  switch (s) {
    case "pending": return "yellow";
    case "matched": return "green";
    // Missing "completed" — TypeScript error ✓
  }
}
```

---

## System-Wide Impact

### Interaction Graph

```
Request Creation Flow:
User Input → React Form → validate(data, schema) → API POST → Server parse → DB insert
                           ↓ (Phase 3: client-side validation)         ↓ (existing)
                     Prevents invalid CATEGORY          Zod validation already present
                     Matches CATEGORY_ALLOWED_FIELDS    (will share schema in Phase 3)

Status Display Flow:
DB fetch → API response → Status component → t(`statuses.${status}`) → UI
           ↓ (Phase 1: type-safe status)   ↓ (Phase 2: i18next lookup)
         Type: REQUEST_STATUS (literal)    No manual statusMap needed
```

### Error Propagation

- **Phase 1**: No changes to error handling. Constants are plain values.
- **Phase 2**: i18next.t() returns key name if translation missing (silent, already in custom i18n)
- **Phase 3**: Zod validation errors use i18next for localized error messages (new, can be deferred)

### State Lifecycle Risks

1. **Phase 1**: Constants are immutable (const). No state lifecycle risk.
2. **Phase 2**: i18next language change must update all components using translations. Already handled by existing `useTranslation()` hook pattern.
3. **Phase 3**: Validation state must be consistent between client and server. Sharing Zod schemas ensures parity.

### API Surface Parity

- **No API changes**: All three phases are internal refactoring
- **Request/Response**: Data shape unchanged (CATEGORY values stay the same)
- **Type Exports**: `shared/schema.ts` continues to export ItemCategory type
- **Backward Compatibility**: All changes are additive or replacements of equivalent code

---

## Success Metrics

### Phase 1 Completion
- ✅ `shared/constants.ts` created with all 6 constant arrays
- ✅ Zero duplication (all hardcoded values found and consolidated)
- ✅ All constants use `as const` for proper typing
- ✅ Type inference works (`ItemCategory = typeof ITEM_CATEGORIES[number]`)
- ✅ IDE autocomplete shows all valid values
- ✅ No test failures in existing code

**Acceptance**: Run `npm run test:run` — all existing tests pass (0 changes to behavior)

### Phase 2 Completion
- ✅ i18next installed and configured
- ✅ Translation files created (`locales/en.json`, `locales/fr.json`)
- ✅ All 400+ translation keys migrated to JSON structure
- ✅ No manual statusMap logic (removed from useTranslateStatus)
- ✅ All components use `useTranslation()` from i18next
- ✅ Language switching works (localStorage persists)

**Acceptance**:
```bash
npm run test:run  # All existing tests pass
npm run dev       # Manual test: switch language, verify all labels update
```

### Phase 3 Completion
- ✅ 50+ tests written (constants.test.ts, validation.test.ts, i18n-keys.test.ts)
- ✅ `shared/validation.ts` includes Zod schemas for all constants
- ✅ Validation tests verify client/server parity
- ✅ All constants have translations
- ✅ Test coverage ≥80% for new code

**Acceptance**:
```bash
npm run test:coverage  # Shows ≥80% coverage for shared/ and __tests__/
npm run test:run       # All 50+ new tests pass
```

---

## Dependencies & Risks

### External Dependencies (Phase 2)

- **i18next**: ^23.0.0 (industry standard, maintained, 35KB gzipped)
- **react-i18next**: ^13.0.0 (React bindings)
- **i18next-browser-languagedetector**: For auto language detection (optional, Phase 2)

**Risk**: Adding dependencies increases bundle size and maintenance. Mitigation: i18next is stable and widely used.

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Phase 1: Import cycle** | Low | Graph check: constants → nothing, schema → constants (one direction) |
| **Phase 1: Missed duplication** | Low | Grep for all hardcoded values: search for constant names in codebase |
| **Phase 2: Missing translations** | Medium | Test verifies key exists for every constant value |
| **Phase 2: i18next config error** | Low | Provide minimal working config in PR; document setup |
| **Phase 3: Validation too strict** | Medium | Review schema with team; ensure backward compatible |
| **Phase 3: Test flakiness** | Low | Use deterministic mocks; avoid setTimeout in tests |
| **All: Large PR surface** | Medium | Phased approach allows incremental review; each phase focused |

---

## Technical Approach

### Architecture Decisions

1. **Why Centralized Constants** (not enums):
   - Enums add complexity (enum types ≠ const values)
   - `as const` + type inference achieves same safety with less boilerplate
   - Matches existing codebase patterns (schema.ts)

2. **Why i18next** (not custom i18n):
   - Industry standard: used by 100K+ projects
   - Plugin ecosystem: pluralization, date formatting, etc.
   - Type-safe key generation (optional, improves DX)
   - Easier to scale to 10+ languages

3. **Why Zod for Validation** (not tRPC or other):
   - Already in use in routes.ts
   - Lightweight, runtime validation
   - Enables shared client/server validation
   - Optional, but beneficial (Phase 3)

### Implementation Phases

#### Phase 1: Constants Foundation (2-3 hours)

**Goal**: Single source of truth for all metadata

**Files to Create**:
- `shared/constants.ts` (new)

**Files to Modify**:
- `shared/schema.ts` (import ITEM_CATEGORIES from constants, remove duplicate definition)
- `client/src/pages/create-request.tsx` (import CONDITIONS from constants)
- `server/routes.ts` (import CATEGORY_ALLOWED_FIELDS from constants)
- Any other file with hardcoded status/category/role values (via grep + replace)

**Type Pattern**:
```typescript
export const ITEM_CATEGORIES = [
  "all_fashion", "clothing", "watches_jewelry", // ... (16 total)
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number];

export const REQUEST_STATUSES = ["pending", "matched", "completed"] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];
```

**Verify**:
- `npm run test:run` — all existing tests pass
- No circular imports (check with `tsc --noEmit`)

---

#### Phase 2: i18n Migration (2-3 hours)

**Goal**: Type-safe, scalable translation system

**Install Dependencies**:
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Files to Create**:
- `locales/en.json` (English translations, extracted from i18n.tsx)
- `locales/fr.json` (French translations, already in i18n.tsx)
- `client/src/lib/i18next.config.ts` (i18next setup)
- `client/src/lib/i18n-keys.ts` (type-safe key generation, optional but recommended)

**Files to Modify**:
- `client/src/App.tsx` (replace I18nProvider with i18next provider)
- `client/src/lib/i18n.tsx` (update to use i18next or delete if no longer needed)
- All components using `useI18n()` → `useTranslation()` from i18next

**Example Translation Structure** (`locales/en.json`):
```json
{
  "categories": {
    "all_fashion": "All Fashion",
    "clothing": "Clothing",
    "watches_jewelry": "Watches & Jewelry"
  },
  "conditions": {
    "new_with_tags": "New with Tags",
    "like_new": "Like New",
    "good": "Good",
    "fair": "Fair"
  },
  "statuses": {
    "pending": "Pending",
    "matched": "Matched",
    "completed": "Completed"
  },
  "roles": {
    "user": "User",
    "seller": "Seller",
    "admin": "Admin"
  }
}
```

**Type-Safe Key Generation** (`client/src/lib/i18n-keys.ts`):
```typescript
import { ITEM_CATEGORIES, REQUEST_STATUSES, ITEM_CONDITIONS, USER_ROLES } from "@shared/constants";

export const I18N_KEYS = {
  categories: ITEM_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: `categories.${cat}` }), {}),
  statuses: REQUEST_STATUSES.reduce((acc, s) => ({ ...acc, [s]: `statuses.${s}` }), {}),
  // ... etc
} as const;

// Usage:
const { t } = useTranslation();
t(I18N_KEYS.categories.clothing); // ✓ Type-safe, autocomplete works
t("categories.invalid"); // ✗ TypeScript error
```

**Verify**:
- `npm run dev` → Switch language in UI, verify all labels update
- `npm run test:run` — all tests pass
- Check console for missing translation warnings

---

#### Phase 3: Validation & Tests (2-3 hours)

**Goal**: 50+ tests, shared validation, bug prevention

**Files to Create**:
- `shared/validation.ts` (Zod schemas)
- `__tests__/constants.test.ts` (25+ tests)
- `__tests__/validation.test.ts` (15+ tests)
- `__tests__/i18n-keys.test.ts` (10+ tests)

**Shared Validation Schemas** (`shared/validation.ts`):
```typescript
import { z } from "zod";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, REQUEST_STATUSES } from "./constants";

// Const-based validation (safer than string literals)
export const CategorySchema = z.enum(ITEM_CATEGORIES);
export const ConditionSchema = z.enum(ITEM_CONDITIONS);
export const StatusSchema = z.enum(REQUEST_STATUSES);

// Example: Create request validation
export const CreateRequestSchema = z.object({
  category: CategorySchema, // Type: "all_fashion" | "clothing" | ...
  condition: ConditionSchema,
  title: z.string().min(1),
  // ... other fields
});

export type CreateRequest = z.infer<typeof CreateRequestSchema>;
```

**Test Strategy** (`__tests__/constants.test.ts`):
```typescript
describe("Constants", () => {
  test("ITEM_CATEGORIES has no duplicates", () => {
    const unique = new Set(ITEM_CATEGORIES);
    expect(unique.size).toBe(ITEM_CATEGORIES.length);
  });

  test("All categories have translations", () => {
    ITEM_CATEGORIES.forEach(cat => {
      expect(i18n.exists(`categories.${cat}`)).toBe(true);
    });
  });

  test("STATUS values match RequestStatus type", () => {
    // Verify all statuses can be assigned to type
    const _exhaustive: RequestStatus[] = REQUEST_STATUSES;
  });
});
```

**Client-Side Usage** (Phase 3 enables this):
```typescript
// In create-request.tsx
const formSchema = CreateRequestSchema;
const form = useForm({ resolver: zodResolver(formSchema) });

// Client validates before sending
// Server also validates with same schema
```

**Verify**:
- `npm run test:coverage` — ≥80% coverage for shared/ and __tests__/
- `npm run test:run` — all 50+ new tests pass
- `npm run dev` → No console warnings about invalid values

---

## Alternative Approaches Considered

### Alternative 1: Keep Custom i18n, Just Extract Constants
- **Approach**: Do Phase 1 + Phase 3, skip i18next migration
- **Pros**: Smaller scope, no external dependencies
- **Cons**: Custom i18n.tsx continues to grow, manual mappings stay, no ecosystem benefits
- **Why Rejected**: Doesn't solve the core DX problem (manual mappings); i18next is low-risk, high-value

### Alternative 2: Use TypeScript Enums Instead of `as const`
- **Approach**: `enum Status { Pending = "pending", Matched = "matched" }`
- **Pros**: Semantic clarity (these are "enums")
- **Cons**: Enums add runtime overhead, can't iterate easily (no Object.values equivalent), more boilerplate
- **Why Rejected**: `as const` achieves same safety with less complexity; matches codebase patterns

### Alternative 3: Monolithic PR (All Phases at Once)
- **Approach**: Extract constants, migrate i18n, add tests in one 8-hour PR
- **Pros**: One atomic change, done quickly
- **Cons**: Massive PR (500+ lines), harder to review, higher risk if issues surface
- **Why Rejected**: Phased approach allows incremental verification; team has 0% test baseline

---

## Integration Test Scenarios

These are cross-layer scenarios that unit tests won't catch:

### Scenario 1: Adding a New Status (Full Workflow)
**Setup**: Team decides to add "cancelled" status

**Steps**:
1. Add "cancelled" to `REQUEST_STATUSES` in `shared/constants.ts`
2. Add translations in `locales/en.json` and `locales/fr.json`
3. Type system automatically updates `RequestStatus` type
4. Component `<StatusSelect>` shows new option (via map over constants)
5. Test validates "cancelled" translation exists

**Expected**: No code changes needed beyond constants file

**Verification**:
```bash
# Verify type updated
npm run tsc -- --noEmit

# Verify translation exists
npm run test:run -- i18n-keys.test.ts

# Manual: UI shows new status option
```

---

### Scenario 2: Client Rejects Invalid Category Before Server
**Setup**: Attacker sends invalid category in POST request

**Before Refactor**: Request reaches server, server rejects (no early validation)
**After Refactor** (Phase 3): Client form validation rejects before submission

**Steps**:
1. Form uses `CreateRequestSchema` from `shared/validation.ts`
2. User enters invalid category → form shows error
3. Request never reaches server

**Expected**: Zod validation catches invalid enum value

**Verification**:
```typescript
test("CategorySchema rejects invalid values", () => {
  expect(() => CategorySchema.parse("invalid_category")).toThrow();
  expect(() => CategorySchema.parse("clothing")).not.toThrow();
});
```

---

### Scenario 3: Language Switch Updates All Statuses
**Setup**: User switches from English to French, page displays request statuses

**Steps**:
1. User clicks language toggle → i18next updates
2. All components using `t("statuses.pending")` re-render
3. Status labels change to French

**Expected**: Synchronous, no flicker

**Verification**:
```bash
npm run dev
# Manually switch language, verify all status labels update instantly
```

---

### Scenario 4: New Developer Adds Field to Category
**Setup**: Developer wants category to have a new field (e.g., "size" for clothing)

**Steps**:
1. Add field to `CATEGORY_ALLOWED_FIELDS` mapping in `shared/constants.ts`
2. Client & server validation schemas automatically reflect change (both import from shared)
3. Form component iterates over allowed fields (via constant)

**Expected**: No code duplication, single source of truth

**Verification**:
```bash
npm run test:run -- validation.test.ts  # Tests verify field is validated
npm run dev  # New field appears in form
```

---

### Scenario 5: Refactoring with Type Safety
**Setup**: Developer wants to rename "pending" status to "awaiting_match"

**Steps**:
1. Change `REQUEST_STATUSES` in `shared/constants.ts`
2. TypeScript compiler finds all usages: `switch(status)` statements, components, tests
3. Developer must update each location (explicit, no silent failures)

**Expected**: Compile error if any location missed

**Verification**:
```bash
npm run tsc -- --noEmit  # TypeScript error until all references updated
```

---

## Risk Analysis & Mitigation

### Technical Risks

| Risk | Phase | Severity | Mitigation | Owner |
|------|-------|----------|-----------|-------|
| **Import cycle** | 1 | Low | Verify constants.ts imports nothing; schema.ts imports constants | Code review |
| **Missed duplication** | 1 | Low | Grep all files for hardcoded values before closing Phase 1 | Grep script |
| **Type inference fails** | 1 | Low | Verify `ItemCategory` type has 16 literal options (not string) | tsc --noEmit |
| **i18next config error** | 2 | Medium | Provide minimal working config in PR; test language switch | Manual QA |
| **Missing translations** | 2 | Medium | Test fails if translation key missing for constant value | Test suite |
| **Custom i18n conflicts** | 2 | Medium | Ensure old i18n context removed before i18next initialization | Code review |
| **Validation too strict** | 3 | Medium | Backward compatible: existing data still valid (same enum values) | Test suite |
| **Breaking test change** | 3 | Low | Update test mocks to use new validation schemas | Incremental |
| **Large PR surface** | All | Medium | Use phased approach; each phase ≤300 lines changed | Phased review |

### Operational Risks

| Risk | Mitigation |
|------|-----------|
| **Team unfamiliar with i18next** | Provide setup documentation; reference i18next official docs |
| **Language switching not working** | Test on staging; verify localStorage persistence |
| **Partial rollout** | Use feature branches; only merge complete phases |

### Rollback Plan

- **Phase 1**: Easy rollback — revert constants.ts, restore duplicates in other files
- **Phase 2**: Revert i18next provider, restore custom i18n context
- **Phase 3**: Revert test files; existing tests already pass

---

## Detailed Task Breakdown

| ID | Title | Description | Acceptance Criteria | Phase | Priority | Est. Time |
|--|--|--|--|--|--|--|
| T-001 | Create constants.ts | Extract all metadata into single file with proper typing | <ul><li>File created at `shared/constants.ts`</li><li>6 constants defined: CATEGORIES, CONDITIONS, STATUSES (request/item), ROLES, SERVICE_TYPES</li><li>Each uses `as const` for literal typing</li><li>No imports of schema.ts (avoid circular)</li><li>`tsc --noEmit` passes</li></ul> | 1 | 1 | 1h |
| T-002 | Update schema.ts imports | Replace CATEGORIES definition with import from constants | <ul><li>`shared/schema.ts` imports from constants</li><li>ItemCategory type still exported and correct</li><li>No behavior change</li><li>All existing tests pass (`npm run test:run`)</li></ul> | 1 | 1 | 30m |
| T-003 | Remove CONDITIONS duplication | Remove CONDITIONS from create-request.tsx, import from constants | <ul><li>`client/src/pages/create-request.tsx` imports CONDITIONS</li><li>No hardcoded array in component</li><li>Component tests pass</li></ul> | 1 | 1 | 30m |
| T-004 | Consolidate status constants | Extract REQUEST_STATUSES and ITEM_STATUSES from routes.ts | <ul><li>Both status arrays in constants.ts</li><li>`server/routes.ts` imports from constants</li><li>No hardcoded status strings (grep verifies)</li><li>Server tests pass</li></ul> | 1 | 2 | 1h |
| T-005 | Extract CATEGORY_ALLOWED_FIELDS | Move category field validation mapping from routes.ts to constants | <ul><li>Mapping in `shared/constants.ts`</li><li>`server/routes.ts` imports it</li><li>Type-safe: uses `Record<ItemCategory, string[]>`</li><li>Validation still works (`npm run test:run`)</li></ul> | 1 | 2 | 30m |
| T-006 | Verify no duplication | Grep for all hardcoded values; ensure none remain | <ul><li>Grep for status/category/role names finds only in constants.ts</li><li>No hardcoded enums in components or routes</li><li>Create script to verify</li></ul> | 1 | 1 | 30m |
| T-007 | Install i18next dependencies | Add i18next, react-i18next, language detector | <ul><li>`package.json` has i18next@^23.0.0, react-i18next@^13.0.0</li><li>`npm install` succeeds</li><li>No version conflicts</li></ul> | 2 | 1 | 15m |
| T-008 | Create translation files | Extract all translations from i18n.tsx into `locales/en.json` and `locales/fr.json` | <ul><li>`locales/en.json` created with namespace structure</li><li>`locales/fr.json` created with French translations</li><li>All 400+ keys migrated</li><li>Structure matches constants (categories.*, conditions.*, statuses.*)</li></ul> | 2 | 1 | 1.5h |
| T-009 | Setup i18next config | Create `client/src/lib/i18next.config.ts` with initialization | <ul><li>File imports locales and configures i18next</li><li>Language detection works (localStorage + browser)</li><li>Fallback to English</li><li>No errors in console</li></ul> | 2 | 1 | 30m |
| T-010 | Replace provider in App.tsx | Swap custom I18nProvider with i18next provider | <ul><li>`client/src/App.tsx` uses i18next provider</li><li>Old custom provider removed</li><li>App boots without errors</li><li>Language persistence works</li></ul> | 2 | 1 | 30m |
| T-011 | Update component translations | Replace all `useI18n()` with `useTranslation()` from i18next | <ul><li>All components using translation hook updated</li><li>No usage of custom i18n() call</li><li>All component tests pass</li><li>UI shows correct translations</li></ul> | 2 | 2 | 1.5h |
| T-012 | Remove statusMap logic | Delete manual useTranslateStatus mapping | <ul><li>`useTranslateStatus()` hook removed</li><li>Status rendering uses i18next directly: `t(\`statuses.\${status}\`)`</li><li>Component tests updated</li></ul> | 2 | 2 | 30m |
| T-013 | Create shared validation schemas | Build `shared/validation.ts` with Zod schemas | <ul><li>CategorySchema, ConditionSchema, StatusSchema defined</li><li>All use enum() from Zod</li><li>CreateRequestSchema uses schemas</li><li>No circular imports</li></ul> | 3 | 1 | 1h |
| T-014 | Write constants tests | Create `__tests__/constants.test.ts` (25+ tests) | <ul><li>Tests verify no duplicates in each constant</li><li>Tests check all values are strings</li><li>Tests verify type inference: `ItemCategory = typeof CATEGORIES[number]`</li><li>All 25+ tests pass</li><li>`npm run test:coverage` shows ≥80%</li></ul> | 3 | 1 | 1.5h |
| T-015 | Write validation tests | Create `__tests__/validation.test.ts` (15+ tests) | <ul><li>Tests verify Zod schemas accept valid values</li><li>Tests verify Zod schemas reject invalid values</li><li>Edge cases: empty string, null, undefined</li><li>All 15+ tests pass</li></ul> | 3 | 2 | 1h |
| T-016 | Write i18n key tests | Create `__tests__/i18n-keys.test.ts` (10+ tests) | <ul><li>Tests verify translation key exists for each constant value</li><li>Tests for both en and fr languages</li><li>Warns if key missing</li><li>All 10+ tests pass</li></ul> | 3 | 2 | 30m |

---

## Sources & References

### Brainstorm Document
- Original brainstorm: `/Users/fabienplart/.claude/brainstorm-constants-i18n-refactor.md` (2026-03-27)
  - Decisions: Phased approach, i18next choice, centralized constants

### Codebase Analysis
- Detailed analysis: `/Users/fabienplart/Projects/local/replit/CODEBASE_ANALYSIS.md`
  - Current patterns, gaps, recommendations

### Code Examples (Reference)
- Constants pattern: `/Users/fabienplart/Projects/local/replit/shared/schema.ts` (lines 63-82)
- Validation pattern: `/Users/fabienplart/Projects/local/replit/server/routes.ts` (lines 70-111)
- Current i18n: `/Users/fabienplart/Projects/local/replit/client/src/lib/i18n.tsx` (882 lines)
- Test setup: `/Users/fabienplart/Projects/local/replit/docs/solutions/build-errors/setup-vitest-test-infrastructure-typescript-react-express.md`

### External Documentation
- **i18next**: https://www.i18next.com/
- **react-i18next**: https://react.i18next.com/
- **Zod**: https://zod.dev/ (for validation schemas)
- **TypeScript `as const`**: https://www.typescriptlang.org/docs/handbook/literal-types.html#const-type-parameters

---

## Notes

### Why This Approach Wins

1. **Phased**: Each phase delivers value. Phase 1 alone fixes DX. No need to wait for full completion.
2. **Low Risk**: Phase 1 is pure refactoring (no behavior change). Phases 2-3 are well-tested frameworks (i18next, Zod).
3. **Type Safe**: Leverages existing codebase patterns (`as const`). No new complexity.
4. **Scalable**: Foundation ready for 10+ languages, custom fields per category, etc.

### Success Looks Like

- **Week 1 (Phase 1)**: Developers happy — add a new status in one place, IDE autocomplete works
- **Week 2 (Phase 2)**: Translations work, no manual mappings, language switching smooth
- **Week 3 (Phase 3)**: Tests prevent bugs, validation is consistent between client/server

### Next Steps

1. Approve this PRD
2. Create feature branch: `git checkout -b feat/constants-i18n-refactor`
3. Follow task breakdown above (start with T-001, T-002, etc.)
4. After Phase 1 complete: create PR, merge, then Phase 2
5. Same process for Phase 3

---

**Document:** Generated 2026-03-27 | Comprehensive PRD for Constants & i18n Refactor
