---
tags: [copilot, prd]
feature: fix-insurance-seller-billing
status: active
date: 2026-06-16
type: fix
---

# Fix Insurance Billing: Move from Marchand to Seller Level

## Problem Statement

Currently, `requests.hasInsurance` exists but should be **removed**. Insurance should be a **seller-level decision at the item validation stage**, not at request creation.

**Current broken flow:**
1. Seller creates request with `hasInsurance = true` ❌ WRONG LEVEL
2. Marchand accepts request and creates articles
3. Marchand can modify `item.hasInsurance` ❌ MARCHAND SHOULDN'T CONTROL THIS
4. Seller doesn't get proper control over insurance per item

**Required flow:**
1. Seller creates request (NO insurance field)
2. Marchand accepts request and creates articles
3. Marchand **finalizes** the article list
4. **Seller validates each article** and can:
   - ✅ Negotiate price
   - ✅ **Check "Add Insurance" (5% of price)** for each item
5. Once seller validates = Agreement created

---

## Core Functionality

1. **Insurance selection at request level** — Seller chooses insurance when creating request
2. **Insurance validation at seller approval** — Seller approves/validates insurance before transaction
3. **Proper billing to seller** — €10.00 charge calculated and presented to seller, not marchand
4. **Transparent transaction record** — Insurance cost visible to seller in request summary

---

## Scope & Boundaries

**In Scope:**
- Remove `requests.hasInsurance` completely (schema, routes, UI)
- Keep insurance as **item-level only** controlled by seller
- Add insurance checkbox to seller's item validation screen
- Ensure marchand cannot modify insurance after item creation
- Display insurance cost (5% of price) clearly to seller
- Ensure agreement snapshot tracks seller's insurance choices

**Out of Scope:**
- Implementing insurance payment handling (future enhancement)
- Refunding existing incorrectly-billed insurance charges (separate task)
- Payment processing implementation
- UI/UX redesign (minimal changes to current screens)

---

## Acceptance Criteria

- [ ] `requests.hasInsurance` field is **completely removed** from schema and routes
- [ ] `items.hasInsurance` and `items.insuranceCost` remain (item-level only)
- [ ] Insurance checkbox in create-request.tsx is **removed** (no insurance at request level)
- [ ] Insurance checkbox appears in request-detail.tsx **at item level** (seller validation view only)
- [ ] Seller CAN toggle insurance for each item **before validating the article**
- [ ] Marchand CANNOT modify insurance (read-only after item creation)
- [ ] Insurance cost (5% of price) is calculated and displayed next to each item
- [ ] Insurance option appears in seller's item validation/negotiation screen
- [ ] Agreement snapshot correctly includes `hasInsurance` per item (seller's choice)
- [ ] All existing tests pass; new tests verify seller-level item insurance control

---

## Technical Considerations

### Architecture
- **Current**: Dual insurance management (request + item levels) → confusion about who pays
- **Target**: Single source of truth at request level → seller owns insurance decision and cost

### Data Model Changes
```
-- Remove from items table:
ALTER TABLE items DROP COLUMN hasInsurance (if not used elsewhere);
ALTER TABLE items DROP COLUMN insuranceCost (if not used elsewhere);

-- requests table remains unchanged:
-- hasInsurance: boolean (seller's choice)
```

### Business Logic
- When request is created with `hasInsurance = true`, calculate €10.00 fee
- When request is finalized/validated by seller, include insurance in total cost
- Transaction records should show: `description: "Insurance - +€10.00"` with seller as payer

### UI Layer
- **Create Request**: Keep checkbox (seller level) ✓
- **Request Detail** (marchand view): Show insurance as read-only info (no checkbox)
- **Request Detail** (seller view): Show insurance cost in summary before validation
- **Transaction/Invoice**: Display insurance as line item

---

## System-Wide Impact

### Interaction Graph
- Request creation → Seller checkbox triggers `hasInsurance = true`
- Request acceptance (marchand) → Respects seller's choice, cannot override
- Request validation (seller) → Sees and confirms insurance cost
- Financial calculation → Includes €10.00 for seller

### Error Propagation
- If seller sets `hasInsurance = true` but can't afford €10.00 → Transaction blocked with clear error
- Insurance cost not calculated → Default to €0, log warning, flag for review

### State Lifecycle
- `requests.hasInsurance` is immutable once request is accepted
- Cannot change insurance option after marchand starts processing items

### API Surface Parity
- `/api/requests` POST/GET/PATCH — insurance managed here only
- `/api/items` — insurance removed or kept as read-only metadata
- Financial endpoints updated to include insurance line items

---

## Success Metrics

- ✅ Seller fully controls insurance decision
- ✅ Insurance cost clearly attributed to seller
- ✅ Marchand cannot override/ignore seller's insurance choice
- ✅ No confusing dual-level insurance checkboxes
- ✅ Financial records show correct payer (seller, not marchand)

---

## Dependencies & Risks

**Risks:**
1. **Data inconsistency** — Existing requests might have inconsistent `requests.hasInsurance` vs `items.hasInsurance` values
   - *Mitigation:* Migration script to audit and fix inconsistencies; add data validation tests
2. **Existing transactions** — Older transactions might show marchand as insurer
   - *Mitigation:* Flag as technical debt, document in release notes
3. **UI confusion** — Current screens might show insurance at both levels during transition
   - *Mitigation:* Clear UI removal in marchand view (disable/hide checkbox)

**Dependencies:**
- None on other features; this is isolated to request/item/financial logic

---

## Tasks

| ID    | Title | Description | Acceptance Criteria | Priority | Passes | Notes |
|-------|-------|-------------|---------------------|----------|--------|-------|
| T-001 | Analyze current insurance data model | Review schema, requests table, items table, transactions to understand current state | - Schema reviewed (requests.hasInsurance, items.hasInsurance) <br/> - Existing data audited for inconsistencies <br/> - Document findings in ticket | 1 | false | Understanding phase |
| T-002 | Update request schema to consolidate insurance | Remove insurance fields from items, confirm requests.hasInsurance as SSOT | - items.hasInsurance/insuranceCost removed or deprecated <br/> - requests.hasInsurance remains primary <br/> - DB migration tested locally | 1 | false | Schema change |
| T-003 | Update backend routes to handle request-level insurance | Modify `/api/requests` endpoints to manage insurance billing correctly | - POST /api/requests validates hasInsurance <br/> - PATCH /api/requests allows seller to update insurance (before marchand accepts) <br/> - Routes locked after marchand acceptance | 2 | false | Backend logic |
| T-004 | Update financial calculation for insurance | Ensure €10.00 charge is attributed to seller in transaction records | - /api/requests calculates insuranceCost = 10.00 when hasInsurance = true <br/> - Transaction records include insurance as line item <br/> - Seller sees cost in summary before confirmation | 2 | false | Billing logic |
| T-005 | Remove insurance checkbox from item-level (marchand view) | Hide/disable insurance checkbox in request-detail.tsx for marchand | - Insurance shows as read-only status in marchand item list <br/> - No ability to change insurance at item level <br/> - Clear messaging: "Insurance set by seller" | 2 | false | Marchand UI |
| T-006 | Add insurance cost display to seller request summary | Show €10.00 insurance fee to seller before validation | - Create-request step 4 review shows insurance cost <br/> - Request-detail.tsx (seller view) displays insurance in cost breakdown <br/> - Pre-validation modal confirms insurance charge | 3 | false | Seller UI |
| T-007 | Write tests for request-level insurance billing | Unit + integration tests for insurance at request level | - Test: Request with hasInsurance=true calculates €10.00 <br/> - Test: Marchand cannot change insurance after accepting <br/> - Test: Financial records show seller as payer <br/> - npm run test:client && npm run test:server pass | 3 | false | Testing |
| T-008 | Create data migration for existing requests | Script to fix any inconsistent insurance data | - Audit script identifies mismatched requests/items insurance <br/> - Migration script corrects inconsistencies <br/> - Pre-migration backup created <br/> - Post-migration verification run | 2 | false | Data cleanup |
| T-009 | Update API documentation | Document insurance as request-level responsibility | - API docs updated for /api/requests insurance parameter <br/> - Decision documented: "Insurance is seller choice, billed to seller" <br/> - Examples show correct flow | 3 | false | Documentation |

---

## Implementation Phases

### Phase 1: Foundation (Data & Backend)
- T-001: Analyze current data
- T-002: Update schema
- T-003: Update request routes
- T-004: Financial calculation

### Phase 2: Frontend (User-Facing Changes)
- T-005: Remove marchand-level checkbox
- T-006: Add seller-facing cost display
- T-007: Tests

### Phase 3: Cleanup
- T-008: Data migration
- T-009: Documentation

---

## Sources

**Current implementation files:**
- Request creation: `client/src/pages/create-request.tsx:27, 125, 346-357`
- Request detail: `client/src/pages/request-detail.tsx:442-443, 1296, 1899-1953`
- Schema: `shared/schema.ts:55 (requests), 116-117 (items)`

**Related:**
- Insurance translations: Fixed in commit 388b9d7
- Fee tier structure: `shared/schema.ts` (feeTiers table)
