---
name: Constants & i18n Refactor
description: Extract scattered metadata into shared constants, migrate to i18next, improve DX and test coverage
type: brainstorm
date: 2026-03-27
---

# Brainstorm: Code Refactor – Constants, i18n, and Test Coverage

## What We're Building

A comprehensive refactor to centralize metadata (CATEGORIES, CONDITIONS, statuses, SERVICE_TYPES, ROLES), migrate from custom i18n to i18next, improve type safety, and establish a test foundation. This addresses DX friction points where constants are scattered, translations require manual mappings, and validation rules aren't shared between client/server.

**Current State:**
- CATEGORIES properly typed in `shared/schema.ts` ✅
- CONDITIONS duplicated in UI code ⚠️
- Custom i18n system (882-line file) handling 400+ keys with manual status mappings
- Zero test coverage despite Vitest infrastructure ready
- Server validation rules not shared with client

---

## Why This Approach

1. **DX Improvement:** Remove scattered constants, reduce manual mappings, add IDE autocomplete
2. **Type Safety:** Ensure no invalid values slip through (client/server mismatch prevention)
3. **i18n Foundation:** Migrate to i18next for better ecosystem support and scalability
4. **Quality:** Establish test patterns with 50+ tests for validation logic

---

## Key Decisions

- **i18n Strategy:** Migrate to **i18next** (industry standard, plugin ecosystem, better scaling)
- **Constants Location:** Centralized in `shared/constants.ts` with TypeScript `as const` for proper typing
- **Translation Files:** JSON-based structure in `/locales/{lang}.json` (one per language)
- **Validation:** Shared Zod schemas in `shared/validation.ts` used by both client and server
- **Rollout:** Phased approach (see Approaches section) allowing incremental delivery and validation

---

## Approaches Considered

### Approach 1: Phased Refactor (Recommended) ✅
**Three focused phases, each delivering value incrementally**

**Phase 1 (Constants Foundation):** Extract CATEGORIES, CONDITIONS, statuses, SERVICE_TYPES, ROLES to `shared/constants.ts`
- ~2-3 hours
- Removes duplication, improves DX immediately
- Output: Constants file + type definitions + updated imports across codebase

**Phase 2 (i18n Migration):** Implement i18next
- Create translation files for en/fr
- Update provider + all components using translations
- Replace manual statusMap logic with i18next
- ~2-3 hours
- Output: Working i18next setup with type-safe key generation

**Phase 3 (Validation & Tests):** Add shared schemas and test suite
- Create Zod schemas for validation
- Write 50+ tests (constants, validation, i18n keys)
- ~2-3 hours
- Output: Comprehensive test coverage, bug prevention

**Pros:**
- Each phase reviewable independently
- Value delivered early (Phase 1 fixes DX)
- Easier to catch and debug issues
- Team familiarity with changes

**Cons:**
- Takes longer (3 PRs)
- Requires coordination between phases
- Intermediate state might feel incomplete

**Best for:** Your case — learning as you go, 0% baseline coverage, verification after each step

---

### Approach 2: Monolithic Refactor
**One coordinated PR covering all changes simultaneously**

- Extract constants + update usages + migrate i18n + add tests in parallel
- Single atomic change
- ~6-8 hours of work

**Pros:**
- Cleaner atomic change (one "before/after")
- No intermediate state

**Cons:**
- Massive PR (hard to review)
- Higher risk if issues surface
- Tests written after changes (easier to miss edge cases)

**Best for:** Very small teams with high review bandwidth

---

## Detailed Scope

### Phase 1: Constants Foundation
**Files Created/Modified:**
- **Create:** `shared/constants.ts` (single source of truth)
- **Modify:** `shared/schema.ts` (import from constants)
- **Modify:** `client/src/pages/create-request.tsx` (remove CONDITIONS duplicate)
- **Modify:** All files using hardcoded values (via search + replace)

**Constants to Extract:**
1. `ITEM_CATEGORIES` (14 items: tops, bottoms, dresses, etc.)
2. `ITEM_CONDITIONS` (4 items: new_with_tags, like_new, good, fair)
3. `REQUEST_STATUSES` (5+ statuses: pending, matched, completed, etc.)
4. `ITEM_STATUSES` (3+ statuses)
5. `USER_ROLES` (3 items: user, seller, admin)
6. `SERVICE_TYPES` (3 items: classic, express, sosDressing)

**Type Pattern:**
```typescript
export const ITEM_CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
```

**Deliverable:** Constants file + updated type inference + zero test coverage (setup only)

---

### Phase 2: i18n Migration
**Files Created/Modified:**
- **Create:** `/locales/en.json`, `/locales/fr.json`
- **Create:** `client/src/lib/i18n-keys.ts` (type-safe key export)
- **Modify:** `client/src/lib/i18next.config.ts` (new file)
- **Modify:** `client/src/App.tsx` (replace custom provider with i18next)
- **Modify:** All components using `t()` (minimal changes, mostly grep + replace)

**Translation Structure:**
```json
{
  "categories": {
    "tops": "Tops",
    "bottoms": "Bottoms"
  },
  "conditions": {
    "new_with_tags": "New with Tags",
    "like_new": "Like New"
  },
  "statuses": {
    "pending": "Pending",
    "matched": "Matched"
  }
}
```

**DX Improvement:**
- Type-safe keys (no silent failures)
- Namespacing (categories.*, conditions.*, etc.)
- Remove manual statusMap logic (i18next handles it)

**Deliverable:** Working i18next setup + replaced all translations + type safety

---

### Phase 3: Validation & Tests
**Files Created/Modified:**
- **Create:** `shared/validation.ts` (Zod schemas)
- **Create:** `__tests__/constants.test.ts`
- **Create:** `__tests__/validation.test.ts`
- **Create:** `__tests__/i18n-keys.test.ts`

**Test Coverage:**
- Constant values match schema constraints
- Translation keys exist for all constants
- Validation schemas reject invalid values
- Client/server validation parity

**Deliverable:** 50+ tests + validation schemas + bug prevention

---

## Constraints & Requirements

1. **Backward Compatibility:** All changes must work with existing API (no schema changes)
2. **i18n Coverage:** Must support existing en + fr languages
3. **Type Safety:** Must work with strict TypeScript mode (already enabled)
4. **No Breaking Changes:** DX improvement, not feature changes
5. **Test Infrastructure:** Leverage existing Vitest setup (node + jsdom environments)

---

## Resolved Questions

✅ **Scope:** CATEGORIES + CONDITIONS + all statuses + SERVICE_TYPES + ROLES + shared validation schemas
✅ **Rollout Strategy:** Phased (3 focused PRs)
✅ **i18n Choice:** i18next (industry standard)
✅ **Priority:** Equal weight to DX, type safety, i18n, and tests

---

## Success Criteria

1. **Phase 1:** Constants file exists, zero duplication, DX improved (IDE autocomplete works)
2. **Phase 2:** i18next working, all translations present, manual mappings removed
3. **Phase 3:** 50+ tests pass, validation prevents invalid values, client/server validation consistent

**Overall:** Codebase ready to scale translations, developers have better ergonomics, bugs prevented by type safety.

---

## Next Steps

Run `/copilot-plan constants-i18n-refactor` to create detailed implementation plan with:
- File-by-file changes
- Code examples
- Testing strategy
- Review checklist

---

**Document:** Generated 2026-03-27 | Brainstorm: Code Refactor
