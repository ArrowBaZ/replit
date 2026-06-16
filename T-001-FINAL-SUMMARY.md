# ✅ T-001: ANALYSIS COMPLETE - Ready for T-002

## Flux Final Compris et Validé

```
BEFORE (Broken):
1. Seller creates request WITH insurance option
2. Marchand creates items, can modify insurance
3. Seller doesn't control item-level insurance properly

AFTER (Fixed):
1. Seller creates request (NO insurance field)
2. Marchand accepts + creates articles + FINALIZES list
3. Seller validates articles and can TOGGLE insurance per item
4. Insurance remains at item level, controlled by seller only
```

---

## 🎯 T-002 SCHEMA UPDATE - EXACT CHANGES

### REMOVE (Completely Delete)
```sql
ALTER TABLE requests 
DROP COLUMN hasInsurance;
-- This column should NOT exist anymore
```

### KEEP (No Changes Needed)
```sql
-- items table keeps these:
- items.hasInsurance (boolean, default false)
- items.insuranceCost (numeric, calculated as price * 0.05)
```

### NOTES
- No new columns needed
- No migration needed for existing data (just audit & document)
- requests.hasInsurance removal is the key change

---

## 🚀 NEXT TASKS AFTER T-002

### T-003: Backend Routes
- Remove `hasInsurance` from POST /api/requests validation
- Remove `hasInsurance` from PATCH /api/requests  
- Keep PATCH /api/items/:id { hasInsurance } but add seller-only check

### T-004: Financial Calculation
- No change needed for insurance logic
- Insurance still = price * 0.05
- Just document that it's seller-controlled for now

### T-005: Frontend - Remove Request-Level
- Remove insurance checkbox from create-request.tsx step 3
- Keep everything else of create-request flow

### T-006: Frontend - Add Item-Level (Seller View)
- Add insurance checkbox to request-detail.tsx item validation area
- Show: "☐ Add Insurance (+5% = €X.XX)"
- Only visible to seller, in validation screen

### T-007: Tests
- Verify requests.hasInsurance doesn't exist
- Verify seller can toggle items.hasInsurance
- Verify marchand cannot modify it
- Tests for agreement snapshot with seller's insurance choices

### T-008: Data Migration
- Audit existing requests with hasInsurance=true
- Document for removal
- Verify no critical dependency

### T-009: Documentation
- Update API docs: insurance is item-level, seller-controlled
- Add flow diagram to docs
- Note: payment handling future enhancement

---

## 📊 ANALYSIS ARTIFACTS CREATED

| File | Purpose |
|------|---------|
| T-001-ANALYSIS.md | 52 references mapped, all code locations |
| T-001-CORRECTED-ANALYSIS.md | Updated with correct flow |
| T-001-FINAL-SUMMARY.md | This file - ready for T-002 |
| Copilot/prd/fix-insurance-seller-billing.md | Updated PRD |

---

## ✅ READY TO PROCEED TO T-002?

All analysis complete. Ready to update schema.

Changes:
- ✅ Identified: requests.hasInsurance to remove
- ✅ Identified: items fields to keep
- ✅ No other schema changes needed
- ✅ No migrations complex logic needed

**T-002 is straightforward**: Just remove the column and update any code that references it.

