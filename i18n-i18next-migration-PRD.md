---
tags: [copilot, prd, refactoring, i18n]
feature: i18n-i18next-migration
status: active
date: 2026-05-28
type: refactor
origin: Based on brainstorms/2026-03-27-constants-i18n-refactor.md - Phase 2 implementation
---

# PRD: Phase 2 - Migrate to i18next

## Overview

Phase 1 successfully extracted all hardcoded labels and added them to `i18n.tsx` with complete French translations. Phase 2 will migrate from the custom i18n context system to **i18next**, a production-grade internationalization framework.

This migration will:
1. Create JSON translation files (`locales/en.json`, `locales/fr.json`)
2. Install and configure i18next
3. Replace custom i18n context with i18next provider
4. Update all components to use i18next hooks
5. Remove the custom i18n system

**Expected Time:** 2-3 hours  
**Risk Level:** Medium (touches provider pattern, all translation usage)  
**Dependencies:** i18next, react-i18next, i18next-browser-languagedetector

---

## Problem Statement

### Current State (After Phase 1)
- Custom i18n system works but is not scalable
- i18n.tsx is 1200+ lines
- Adding new languages requires editing the monolithic file
- No separation of concerns (config, translations, hooks in one file)
- Difficult to review/maintain large translation file
- No lazy-loading capabilities

### Phase 2 Goals
1. **Scalability:** Add new languages without touching code
2. **Maintainability:** Separate concerns (config, translations, components)
3. **Standards:** Use industry-standard i18next
4. **DX:** Type-safe key generation (optional but recommended)
5. **Ecosystem:** Access i18next plugins (pluralization, ICU formatting, etc.)

---

## Proposed Solution

### Architecture

```
locales/
├── en.json          (English translations)
└── fr.json          (French translations)

client/src/lib/
├── i18next.config.ts      (i18next initialization)
├── i18n-keys.ts           (type-safe key generation - optional)
└── i18n.tsx               (REMOVED - replaced by i18next)

client/src/
├── App.tsx                (Use i18next provider instead of custom)
└── [all components use useTranslation() from i18next]
```

### Three Focused Tasks

| Task | Description | Time | Risk |
|------|-------------|------|------|
| T-301 | Install dependencies & create locales | 30m | Low |
| T-302 | Setup i18next config & provider | 1h | Medium |
| T-303 | Update components to use i18next | 1h | Medium |
| T-304 | Test language switching & cleanup | 30m | Low |

---

## Phase 2 Tasks

### T-301: Install Dependencies & Create Locale Files

**Install packages:**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

**Create locale files from i18n.tsx:**

**locales/en.json** — Extract all English keys from i18n.tsx
```json
{
  "nav": {
    "features": "Features",
    "howItWorks": "How It Works",
    "logIn": "Log In",
    "getStarted": "Get Started"
  },
  "landing": {
    "heroTitle": "Turn Your Unused Items Into Cash",
    "heroSubtitle": "Connect with expert resellers...",
    "startSelling": "Start Selling Now"
  },
  "profileType": {
    "question": "What best describes you?",
    "hint": "Choose your profile type to get started",
    "seller": {
      "label": "I want to Sell",
      "desc": "I have items to sell"
    },
    "marchand": {
      "label": "I want to Help Sell",
      "desc": "I want to fulfill requests from sellers"
    }
  },
  "terms": {
    "title": "Terms of Service",
    "section1": {
      "title": "1. Acceptance of Terms",
      "content": "By using Sellzy, you agree..."
    },
    "section2": { ... },
    ...
  },
  "auth": {
    "signUp": "Sign Up",
    "emailLabel": "Email",
    "passwordLabel": "Password",
    ...
  }
}
```

**locales/fr.json** — Copy French translations from i18n.tsx

**Acceptance Criteria:**
- ✅ Both JSON files created with valid syntax
- ✅ All keys from i18n.tsx migrated to JSON
- ✅ French translations are accurate
- ✅ `npm install` succeeds without errors
- ✅ Files placed in `locales/` directory at project root

---

### T-302: Setup i18next Config & Provider

**Create client/src/lib/i18next.config.ts:**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

**Update client/src/App.tsx:**
```typescript
import './lib/i18next.config.ts'; // Initialize i18next before rendering

function App() {
  return (
    <Routes>
      {/* Routes using useTranslation() from react-i18next */}
    </Routes>
  );
}
```

**Optional: Create client/src/lib/i18n-keys.ts (Type-Safe Keys)**
```typescript
import en from '../../locales/en.json';

// Generate type-safe key paths
export const I18N_KEYS = {
  nav: {
    features: 'nav.features',
    howItWorks: 'nav.howItWorks',
    logIn: 'nav.logIn',
  },
  landing: {
    heroTitle: 'landing.heroTitle',
    // ...
  },
} as const;

// Usage in components:
// const { t } = useTranslation();
// t(I18N_KEYS.landing.heroTitle) // Type-safe!
```

**Acceptance Criteria:**
- ✅ i18next.config.ts created and initializes correctly
- ✅ App.tsx imports config before rendering
- ✅ Language detection works (localStorage + browser lang)
- ✅ No console errors on app load
- ✅ (Optional) i18n-keys.ts provides type-safe keys

---

### T-303: Update Components to Use i18next

**Pattern for all components:**

**Before (Custom i18n):**
```typescript
import { useI18n } from '@/lib/i18n';

export function Component() {
  const { t } = useI18n();
  return <h1>{t('profileTypeQuestion')}</h1>;
}
```

**After (i18next):**
```typescript
import { useTranslation } from 'react-i18next';

export function Component() {
  const { t } = useTranslation();
  return <h1>{t('profileType.question')}</h1>;
}
```

**Components to Update:**
- All components currently using `useI18n()`
- All components using `useTranslateStatus()` (delete, use i18next directly)
- All pages using translations

**Search & Replace Strategy:**
```bash
# Find all useI18n imports
grep -r "useI18n" ./client/src

# Replace with useTranslation from react-i18next
# Update key paths to match JSON structure (e.g., profileType.question)
```

**Acceptance Criteria:**
- ✅ All `import { useI18n }` replaced with `import { useTranslation } from 'react-i18next'`
- ✅ All `useI18n()` replaced with `useTranslation()`
- ✅ All key paths updated to match JSON structure (use dots for nested keys)
- ✅ `useTranslateStatus()` hook removed (use direct i18next)
- ✅ All components render without console errors
- ✅ Language switching works in all components

---

### T-304: Test & Cleanup

**Testing:**
1. Load app in English, verify all text displays ✅
2. Switch to French, verify all text translates ✅
3. Reload page, verify language persists ✅
4. Check console for missing translation warnings ✅
5. Test language switch on:
   - Signup/profile selector page
   - Terms page
   - Dashboard
   - All other pages
6. Verify no broken components ✅

**Cleanup:**
- Delete `client/src/lib/i18n.tsx` (custom provider)
- Delete `useTranslateStatus()` function
- Remove any imports of old i18n system
- Update test files if they import old i18n
- Remove old i18n context from test providers

**Acceptance Criteria:**
- ✅ All manual tests pass
- ✅ Language switch works everywhere
- ✅ No console warnings about missing translations
- ✅ Old i18n system completely removed
- ✅ App boots without errors
- ✅ Tests pass (or updated to use i18next)

---

## File Structure After Migration

```
project/
├── locales/
│   ├── en.json          (800+ keys, nested structure)
│   └── fr.json          (800+ keys, French translations)
│
├── client/src/lib/
│   ├── i18next.config.ts       (NEW - i18next setup)
│   ├── i18n-keys.ts            (NEW - optional type-safe keys)
│   └── i18n.tsx                (DELETED - custom provider)
│
├── client/src/
│   ├── App.tsx                 (MODIFIED - import config)
│   └── [all components]        (MODIFIED - use useTranslation)
│
└── [test files]                (UPDATED - use new i18next)
```

---

## Key Path Structure (JSON vs i18n.tsx)

### Before (Flat Keys in i18n.tsx)
```typescript
profileTypeQuestion: "What best describes you?",
profileTypeHint: "Choose your profile type to get started",
sellerOption: "I want to Sell",
```

### After (Nested in JSON)
```json
{
  "profileType": {
    "question": "What best describes you?",
    "hint": "Choose your profile type to get started",
    "seller": {
      "label": "I want to Sell",
      "desc": "I have items to sell"
    }
  }
}
```

### Migration Mapping
```
i18n.tsx Key              →  JSON Path
profileTypeQuestion       →  profileType.question
profileTypeHint          →  profileType.hint
sellerOption             →  profileType.seller.label
sellerOptionDesc         →  profileType.seller.desc
termsSection1Title       →  terms.section1.title
termsSection1Content     →  terms.section1.content
```

---

## Technical Considerations

### Bundle Size Impact
- **i18next:** ~15KB (gzipped)
- **react-i18next:** ~5KB
- **i18next-browser-languagedetector:** ~3KB
- **Removed custom i18n.tsx:** -20KB
- **Net change:** ~3KB increase (acceptable for features gained)

### Performance
- Language detection from localStorage is instant
- JSON parsing happens once on app load
- No runtime performance impact
- Lazy-loading available if needed in future

### Type Safety
- Optional: Use `i18n-keys.ts` to generate type-safe key paths
- Provides IDE autocomplete for translation keys
- Prevents typos in key names
- Can be deferred to future enhancement

---

## Dependencies & Risks

### Dependencies to Install
```json
{
  "i18next": "^23.0.0",
  "react-i18next": "^13.0.0",
  "i18next-browser-languagedetector": "^7.0.0"
}
```

### Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Key path mismatch** | Medium | Test language switch thoroughly before cleanup |
| **Missing translations** | Low | i18next logs warnings if key missing |
| **Component breaking** | Medium | Replace one component type at a time, test |
| **localStorage state** | Low | Test with cleared localStorage |
| **Test providers** | Medium | Update test file providers to use i18next |
| **Circular imports** | Low | Keep config separate, import in App.tsx |

---

## Alternative Approaches Considered

### Alternative 1: Keep Custom i18n, Just Clean It Up
- **Pros:** Smaller scope, no new dependencies
- **Cons:** Maintains technical debt, harder to add features
- **Why Rejected:** Phase 2 goal is to move to standard solution

### Alternative 2: Use react-intl Instead
- **Pros:** Alternative industry standard
- **Cons:** More complex setup, steeper learning curve
- **Why Rejected:** i18next is simpler and more widely used

### Alternative 3: Skip Type-Safe Keys
- **Pros:** Faster migration, fewer files
- **Cons:** Easier to introduce typos in keys
- **Why Rejected:** Include as optional enhancement, quick to implement

---

## Success Metrics

### Phase 2 Completion
- ✅ `locales/en.json` and `locales/fr.json` created with all translations
- ✅ i18next configuration in `client/src/lib/i18next.config.ts`
- ✅ All components updated to use `useTranslation()` from react-i18next
- ✅ Custom i18n system completely removed
- ✅ Language switching works on all pages
- ✅ No console errors or warnings
- ✅ Tests pass (updated for i18next)

**Acceptance:**
```bash
npm run dev
# Manually test: switch language, verify all text updates
# No errors in console, no missing translation warnings
```

---

## Task Breakdown

| ID | Title | Description | Acceptance Criteria | Est. Time |
|--|--|--|--|--|
| T-301 | Install & Create Locales | Install i18next packages, create JSON locale files from i18n.tsx | <ul><li>JSON files created with valid syntax</li><li>All keys migrated</li><li>npm install succeeds</li></ul> | 30m |
| T-302 | Setup i18next Config | Create i18next.config.ts, update App.tsx, optional i18n-keys.ts | <ul><li>Config file created and initializes</li><li>App imports config</li><li>No console errors on load</li><li>Language detection works</li></ul> | 1h |
| T-303 | Update Components | Replace all useI18n with useTranslation, update key paths | <ul><li>All imports replaced</li><li>All key paths updated to JSON structure</li><li>No broken components</li><li>useTranslateStatus removed</li></ul> | 1h |
| T-304 | Test & Cleanup | Test language switching, remove old i18n, verify everything works | <ul><li>Manual tests pass</li><li>All language switches work</li><li>Old system removed</li><li>No console warnings</li></ul> | 30m |

---

## Implementation Notes

### Key Path Convention
Use nested structure for organization:
```json
{
  "nav": { ... },
  "landing": { ... },
  "auth": { ... },
  "profileType": { ... },
  "terms": { ... },
  "dashboard": { ... },
  "requests": { ... },
  "items": { ... },
  "messages": { ... },
  "schedule": { ... },
  "profile": { ... },
  "admin": { ... }
}
```

### Component Update Pattern
```typescript
// BEFORE
import { useI18n } from '@/lib/i18n';
const { t } = useI18n();
t('profileTypeQuestion')

// AFTER
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
t('profileType.question')
```

### Language Persistence
i18next-browser-languagedetector handles this automatically:
1. Checks localStorage for 'i18nextLng'
2. Falls back to browser language
3. Defaults to 'en' if no match

---

## Next Steps

1. **Approve this Phase 2 PRD**
2. **Create feature branch:** `git checkout -b feat/i18next-migration`
3. **Execute tasks T-301 through T-304 in order**
4. **Test thoroughly before merging**
5. **Create PR with detailed description**
6. **Merge after review**

---

**Document:** Generated 2026-05-28 | Phase 2 - i18next Migration PRD
