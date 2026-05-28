---
tags: [copilot, prd, audit, i18n]
feature: i18n-consistency-audit-fix
status: active
date: 2026-05-28
type: refactor
origin: Based on brainstorms/2026-03-27-constants-i18n-refactor.md with current state audit
---

# PRD: i18n Consistency Audit & Fix

## Overview

The website currently has **mixed language labels** across different UI components. The signup page has English profile selection ("I want to Sell" / "I want to Help Sell") while the form fields are translated via i18n, creating an inconsistent user experience. Additionally, the i18n system is centralized in a single 882-line file with no French translation file, making it hard to maintain and switch languages.

This plan audits the current state, documents inconsistencies, and systematically fixes them using the phased approach from the March 27 PRD.

---

## Problem Statement / Motivation

### Current Issues (Audit Findings)

1. **Hardcoded English Labels**
   - ProfileTypeSelector component: "I want to Sell", "I want to Help Sell" (no translation)
   - "What best describes you?" — not translated
   - Many UI elements like buttons and headings are hardcoded

2. **Inconsistent i18n Usage**
   - 718+ instances of `t()` function calls
   - Some pages translate, others hardcode (e.g., terms.tsx has hardcoded French content)
   - Terminology mix: "marchand" (French) in code, English labels in UI

3. **No French Translation File**
   - All translations embedded in i18n.tsx (single context object)
   - No separate `fr.json` or `en.json` files
   - Language switching doesn't work properly (relies on context, not files)

4. **Missing Keys in i18n**
   - ProfileTypeSelector labels not in i18n.tsx
   - Form placeholder texts scattered (some hardcoded, some translated)
   - Error messages inconsistently handled

### Why This Matters

- **User Confusion**: Switching to French leaves English buttons and labels, breaking UX
- **Developer Friction**: Adding new labels requires editing i18n.tsx (long file, hard to review)
- **Scaling Risk**: Adding languages (German, Spanish) becomes exponentially harder
- **Maintenance Debt**: No test coverage to prevent regressions

---

## Proposed Solution

### High-Level Approach (Two-Phase)

**Phase 1: Audit & Standardization (Current Sprint)**
- Document all mixed language elements across the site
- Extract all hardcoded labels to i18n.tsx
- Ensure all user-facing text uses `t()` function
- Create French translation file from existing i18n context
- **Deliverable**: Fully translated UI, no hardcoded labels, language switch works

**Phase 2: Migrate to i18next (Future, builds on Phase 1)**
- Implement i18next with JSON files (from March 27 PRD)
- Establish type-safe key generation
- Add test coverage for translation keys
- **Deliverable**: Scalable, maintainable i18n system

---

## Phase 1: Audit & Standardization (2-3 hours)

### Goals

1. Map all UI elements with language issues
2. Extract hardcoded labels to i18n.tsx
3. Create French translation file
4. Verify language switch works end-to-end
5. Establish naming conventions for consistency

### Files to Review & Modify

#### Component Audit Checklist

- [ ] `client/src/components/profile-type-selector.tsx` — All labels hardcoded (English)
- [ ] `client/src/pages/signup.tsx` — Some fields translated, profile selector not
- [ ] `client/src/pages/terms.tsx` — French content hardcoded, should use i18n
- [ ] `client/src/components/app-sidebar.tsx` — Check menu items
- [ ] `client/src/pages/landing.tsx` — Check hero, features, testimonials sections
- [ ] `client/src/pages/marchand-dashboard.tsx` — Check all labels
- [ ] Any toast/error messages — Should be in i18n

#### Files to Create/Modify

**Create:**
- `locales/en.json` — Extract all keys from i18n.tsx English translations
- `locales/fr.json` — Add French translations (create missing ones)
- `client/src/lib/i18n-audit-checklist.md` — Document all keys found

**Modify:**
- `client/src/lib/i18n.tsx` — Add missing keys, keep both English & French
- `client/src/components/profile-type-selector.tsx` — Add `useI18n()` hook
- `client/src/pages/terms.tsx` — Replace hardcoded French with `t()` calls
- `client/src/components/app-sidebar.tsx` — Audit menu items
- All other components with hardcoded text

### Audit Detailed Steps

#### T-101: Profile Type Selector - Audit & Translation

**Current State:**
```typescript
<h3 className="font-semibold">I want to Sell</h3>
<h3 className="font-semibold">I want to Help Sell</h3>
<h2 className="text-xl font-semibold">What best describes you?</h2>
<p className="text-sm text-muted-foreground mt-1">Choose your profile type to get started</p>
```

**To Extract:**
- `profileTypeTitle` = "What best describes you?"
- `profileTypeSubtitle` = "Choose your profile type to get started"
- `sellerLabel` = "I want to Sell"
- `sellerDesc` = "I have items to sell"
- `marchandLabel` = "I want to Help Sell"
- `marchandDesc` = "I want to fulfill requests from sellers"

**French Translations Needed:**
- `profileTypeTitle` = "Qui êtes-vous ?"
- `profileTypeSubtitle` = "Choisissez votre type de profil pour commencer"
- `sellerLabel` = "Je veux vendre"
- `marchandLabel` = "Je veux aider à vendre"

---

#### T-102: Signup Form - Audit & Verify Consistency

**Current State:**
- Form labels use `t("emailLabel")`, `t("firstName")`, etc. ✓
- Profile selector is hardcoded (see T-101)
- Error messages use `t()` ✓

**To Verify:**
- All form placeholders are in i18n (check Input components)
- All validation error messages are in i18n
- Button labels ("Continue", "Sign Up") are in i18n
- Toast messages are in i18n

---

#### T-103: Terms Page - Audit & Extract French Content

**Current State:**
```typescript
const sections = lang === "fr" ? [
  { title: "...", content: "..." },
  // hardcoded French
] : [
  { title: "...", content: "..." },
  // hardcoded English
]
```

**To Fix:**
- Extract each section title and content to i18n.tsx keys
- Replace hardcoded arrays with `t()` lookups
- Verify French translations are complete

---

#### T-104: App Sidebar - Audit & Standardization

**Current State:**
- `t("discoverMarchands")` ✓
- `t("marchand")` ✓
- Some hardcoded role labels (e.g., "Admin")

**To Verify:**
- All menu items use `t()`
- Role labels are consistent (Seller, Marchand, Admin)
- Sidebar group labels are in i18n

---

#### T-105: Landing Page - Audit & Extract All Labels

**Scope:** `client/src/pages/landing.tsx`

**Sections to Audit:**
- Hero section (title, subtitle, CTA buttons)
- Features section (3 feature blocks with titles & descriptions)
- How It Works (3 steps with titles & descriptions)
- Testimonials (3 testimonial quotes + attribution)
- Footer

**Expected Hardcoded Elements:** Many — hero title, step descriptions, testimonial quotes

---

### Standardization Tasks

#### T-201: Extract All Hardcoded Labels to i18n.tsx

**Input:** Audit findings from T-101 through T-105

**Output:** i18n.tsx updated with all missing keys

**Naming Convention:**
```
Feature-related keys:
- camelCase for single words/phrases
- Nested structure for related items:
  profileType: { title, subtitle, seller: { label, description }, marchand: { label, description } }
  
OR flat structure:
  profileTypeTitle, profileTypeSubtitle, sellerLabel, sellerDesc, marchandLabel, marchandDesc
```

**Decision:** Use flat structure for simplicity (already established pattern in i18n.tsx)

---

#### T-202: Create French Translation Object

**Input:** All keys extracted in T-201

**Process:**
1. For each key in English, create French translation
2. Use existing French translations in i18n.tsx as reference
3. Flag missing/unclear translations for review

**Output:** French translations object ready to be merged into i18n.tsx

---

#### T-203: Update Components to Use i18n

**Input:** Audit findings, extracted keys

**Components to Update:**
- ProfileTypeSelector — add `useI18n()` hook
- Terms page — replace hardcoded French sections with `t()` calls
- Landing page — ensure all text uses `t()`
- Any other components with hardcoded labels

**Verification:** `npm run dev` → switch language, verify all text updates

---

#### T-204: Create Translation JSON Files

**Goal:** Export all keys to `locales/en.json` and `locales/fr.json` for future i18next migration

**Process:**
1. Extract keys structure from updated i18n.tsx
2. Format as JSON with proper nesting
3. Create both en.json and fr.json
4. Validate JSON syntax

**Output:** Ready-to-use translation files for Phase 2 migration

---

#### T-205: Test Language Switching End-to-End

**Acceptance Criteria:**
- [ ] Click language toggle in any component
- [ ] All visible text switches to selected language (EN ↔ FR)
- [ ] No hardcoded English labels remain visible
- [ ] Form placeholders are translated
- [ ] Error messages are translated
- [ ] Signup page profile selector shows in correct language
- [ ] Terms page displays correct language
- [ ] Landing page displays correct language

**Test Scenarios:**
1. Load app in English, switch to French, verify all text updates
2. Load app in French, switch to English, verify all text updates
3. Navigate between pages, verify language persists
4. Check console for missing translation warnings

---

### Integration Test Scenarios

#### Scenario 1: New User Signup (French)
**Setup:** User selects French language
1. Load signup page
2. Profile selector displays French labels ("Je veux vendre", "Je veux aider à vendre")
3. Form labels are French ("Email", "Prénom", "Nom")
4. Button text is French ("Continuer", "S'inscrire")
5. Validation errors in French

**Expected:** Fully French experience, no English elements

---

#### Scenario 2: Add New Label (Developer Workflow)
**Setup:** Team wants to add a new form field
1. Add key to i18n.tsx (English + French)
2. Use `t("newKey")` in component
3. Switch language, new label appears in both languages

**Expected:** Single change point, no duplication

---

---

## Success Metrics

### Phase 1 Completion
- ✅ All hardcoded English/French labels extracted to i18n.tsx
- ✅ i18n.tsx has complete key set (no gaps)
- ✅ French translations complete for all keys
- ✅ JSON files created (locales/en.json, locales/fr.json)
- ✅ No hardcoded labels visible in UI
- ✅ Language switch works perfectly
- ✅ No console warnings about missing translations

**Acceptance:**
```bash
npm run dev
# Manual test: switch language, verify all text updates
# No hardcoded English in French mode, no hardcoded French in English mode
```

---

## Dependencies & Risks

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Missed hardcoded labels** | Medium | Systematic audit checklist, grep for common patterns |
| **Incomplete French translations** | Medium | Review translations with French speaker or use existing context |
| **Language switch not persisting** | Low | Verify localStorage in i18n context |
| **Toast/error messages** | Low | Test error scenarios during QA |
| **New labels added during Phase 1** | Low | Document naming convention, code review checklist |

---

## Task Breakdown

| ID | Title | Description | Acceptance Criteria | Phase | Priority | Est. Time |
|--|--|--|--|--|--|--|
| T-101 | Audit: Profile Type Selector | Map all hardcoded labels in ProfileTypeSelector component | <ul><li>All 6 text elements identified (title, subtitle, 2x label, 2x description)</li><li>Hardcoded English vs. translated accounted for</li><li>French translations noted</li></ul> | 1 | 1 | 30m |
| T-102 | Audit: Signup Form | Check consistency of form labels, placeholders, errors | <ul><li>All form fields checked for translation</li><li>Error messages verified in i18n</li><li>Validation messages mapped</li></ul> | 1 | 1 | 30m |
| T-103 | Audit: Terms Page | Extract hardcoded French sections | <ul><li>All section titles and content identified</li><li>Estimated 10-15 content blocks</li><li>French + English versions mapped</li></ul> | 1 | 1 | 45m |
| T-104 | Audit: App Sidebar | Check menu items, role labels | <ul><li>All menu items verified</li><li>Role labels checked (Seller, Marchand, Admin)</li><li>Group labels verified</li></ul> | 1 | 2 | 30m |
| T-105 | Audit: Landing Page | Extract all hero, features, how-it-works, testimonials, footer labels | <ul><li>5+ sections identified</li><li>20+ text elements mapped</li><li>Existing i18n keys vs. new keys documented</li></ul> | 1 | 1 | 1h |
| T-106 | Audit: Other Components | Grep for hardcoded labels in remaining components | <ul><li>Grep command finds all hardcoded English text</li><li>Buttons, tooltips, placeholders logged</li><li>List of remaining components created</li></ul> | 1 | 2 | 30m |
| T-201 | Extract: Add Missing Keys to i18n.tsx | Consolidate all audit findings into i18n.tsx | <ul><li>All hardcoded labels now in i18n.tsx</li><li>Naming convention consistent (camelCase, flat structure)</li><li>No key conflicts</li><li>`npm run tsc --noEmit` passes</li></ul> | 1 | 1 | 1h |
| T-202 | Translate: Create French Translations | Add French translations for all new keys | <ul><li>French translations complete for all new keys</li><li>No blank values</li><li>Terminology consistent with existing translations (Marchand vs. Reseller, Vendeur vs. Seller)</li><li>Reviewed for context accuracy</li></ul> | 1 | 1 | 1.5h |
| T-203 | Refactor: Update Components to Use i18n | Replace hardcoded labels with `t()` calls | <ul><li>ProfileTypeSelector uses `useI18n()` and `t()`</li><li>Terms page uses `t()` for all sections</li><li>Landing page verified</li><li>All other components checked</li><li>Component tests pass</li></ul> | 1 | 1 | 1.5h |
| T-204 | Export: Create locales/en.json and fr.json | Generate JSON translation files from i18n.tsx | <ul><li>`locales/en.json` created with all keys</li><li>`locales/fr.json` created with all translations</li><li>JSON syntax valid (can parse)</li><li>Structure matches keys in i18n.tsx</li></ul> | 1 | 2 | 30m |
| T-205 | Verify: Test Language Switching End-to-End | Manual QA of language switch functionality | <ul><li>Switch EN → FR, all text translates</li><li>Switch FR → EN, all text translates</li><li>No hardcoded labels visible</li><li>Language persists on reload</li><li>Form placeholders translated</li><li>Error messages translated</li><li>Signup flow works in both languages</li></ul> | 1 | 1 | 1h |

---

## Technical Approach

### Naming Convention (Established)

**Flat structure (already used in i18n.tsx):**
```typescript
profileTypeTitle: "What best describes you?",
profileTypeSubtitle: "Choose your profile type to get started",
sellerLabel: "I want to Sell",
sellerDesc: "I have items to sell",
marchandLabel: "I want to Help Sell",
marchandDesc: "I want to fulfill requests from sellers",
```

**Alternative: Nested (for future i18next migration):**
```typescript
profileType: {
  title: "What best describes you?",
  subtitle: "Choose your profile type to get started",
  seller: { label: "I want to Sell", desc: "..." },
  marchand: { label: "I want to Help Sell", desc: "..." },
}
```

**Decision:** Use flat structure now (matches existing pattern), can reorganize during i18next migration in Phase 2.

---

### French Terminology (Consistent with Codebase)

- **Seller** = "Vendeur" (not "Vendeur d'articles")
- **Marchand/Reseller** = "Marchand" (French for merchant, already used in codebase)
- **Help Sell** = "Aider à vendre"
- **Items** = "Articles"
- **Requests** = "Demandes"

---

## Alternative Approaches Considered

### Alternative 1: Just Fix English, Keep French for Later
- **Pros**: Faster, focus on English UX first
- **Cons**: French users still see mixed language UI
- **Why Rejected**: Both languages should be complete and consistent

### Alternative 2: Use i18next Immediately (Merge with Phase 2)
- **Pros**: Standardized i18n system right away
- **Cons**: More complex PR, multiple changes at once
- **Why Rejected**: Phase 1 focuses on finding/fixing content issues, Phase 2 handles system migration

---

## Next Steps (After Approval)

1. **Assign Tasks T-101 through T-205**
2. **Run Audit** (T-101 → T-106): Document all language issues
3. **Extract & Translate** (T-201 → T-202): Consolidate into i18n.tsx
4. **Refactor Components** (T-203): Update to use i18n
5. **Export & Verify** (T-204 → T-205): Create JSON files, test language switch
6. **Review**: PR with all changes + checklist
7. **Plan Phase 2**: Migrate to i18next using output from Phase 1

---

**Document:** Generated 2026-05-28 | i18n Consistency Audit & Fix PRD
