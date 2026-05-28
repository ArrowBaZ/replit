# i18n Consistency Audit Findings

**Date:** 2026-05-28
**Status:** In Progress

---

## T-101: Profile Type Selector Audit

**File:** `client/src/components/profile-type-selector.tsx`

### Hardcoded Elements (NOT in i18n)

| Element | English Text | Status | Required French |
|---------|--------------|--------|-----------------|
| Main Title | "What best describes you?" | ❌ HARDCODED | "Qui êtes-vous ?" |
| Subtitle | "Choose your profile type to get started" | ❌ HARDCODED | "Choisissez votre type de profil pour commencer" |
| Seller Label | "I want to Sell" | ❌ HARDCODED | "Je veux vendre" |
| Seller Desc | "I have items to sell" | ❌ HARDCODED | "J'ai des articles à vendre" |
| Marchand Label | "I want to Help Sell" | ❌ HARDCODED | "Je veux aider à vendre" |
| Marchand Desc | "I want to fulfill requests from sellers" | ❌ HARDCODED | "Je veux répondre aux demandes des vendeurs" |

### Issue Found

**Wording Inconsistency:** The signup form also has similar labels in i18n:
- `imASeller: "I'm a Seller"` (different from ProfileTypeSelector "I want to Sell")
- `sellerDesc: "I have clothes to sell and want expert help."` (similar but different)

**French Translation Issues:**
- `sellerDesc` typo: "vetements" → should be "vêtements"
- Accent issues in French translations

### Recommendation

Update ProfileTypeSelector to use i18n with these keys:
- `profileTypeQuestion` = "What best describes you?"
- `profileTypeHint` = "Choose your profile type to get started"
- `sellerOption` = "I want to Sell"
- `sellerOptionDesc` = "I have items to sell"
- `marchandOption` = "I want to Help Sell"
- `marchandOptionDesc` = "I want to fulfill requests from sellers"

---

## T-102: Signup Form Audit (In Progress)

**File:** `client/src/pages/signup.tsx`

### Status
- Form labels: ✅ Using `t()` for most fields
- Profile selector: ❌ Hardcoded (see T-101)
- Error messages: ✅ Using `t()`
- Validation: ✅ Using i18n for errors

### Hardcoded Elements Found
- None in form itself (all use `t()`)
- Profile selector is separate issue (T-101)

---

## T-103: Terms Page Audit (In Progress)

**File:** `client/src/pages/terms.tsx`

### Status
- Sections are hardcoded in JavaScript arrays
- French and English content duplicated

### Hardcoded Content
```typescript
const sections = lang === "fr" ? [
  { title: "...", content: "..." },  // Hardcoded French
] : [
  { title: "...", content: "..." },  // Hardcoded English
]
```

Needs to extract each section to i18n keys.

---

## T-104: App Sidebar Audit (In Progress)

**File:** `client/src/components/app-sidebar.tsx`

### Status
- Most items use `t()` ✅
- Role labels: Mostly translated, need verification

---

## T-105: Landing Page Audit (In Progress)

**File:** `client/src/pages/landing.tsx`

### Status
- To be reviewed

---

## T-106: Grep Results (In Progress)

---

## Summary

- **Total Hardcoded Elements Found So Far:** 6 (ProfileTypeSelector)
- **Components Needing Review:** 5 (in progress)
- **French Translation Issues:** 2-3 typos found
- **Estimated Additional Elements:** 20-30 (from landing page, terms page)

---

## Next Steps

1. Complete audits T-102 through T-106
2. Create comprehensive list of all missing i18n keys
3. Extract and add to i18n.tsx (T-201)
4. Create French translations (T-202)
5. Refactor components (T-203)
