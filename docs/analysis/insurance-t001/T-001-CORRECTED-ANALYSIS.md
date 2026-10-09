# T-001: Analyse CORRIGÉE - Flux Réel d'Assurance

## ✅ NOUVEAU FLUX COMPRIS

```
1. SELLER creates request
   → request.hasInsurance = ❌ SUPPRIMÉ (pas à ce niveau!)

2. MARCHAND accepts request + crée articles

3. MARCHAND FINALISE la liste d'articles
   → État: "list finalized" ou similaire
   → Plus d'ajout/suppression d'articles possible

4. SELLER CAN NOW:
   ✅ Valider les articles (approve)
   ✅ Négocier le prix (counter-offer)
   ✅ COCHER L'ASSURANCE (item.hasInsurance) pour chaque article
   
5. Une fois seller valide = Agreement créé

KEY: L'assurance est une OPTION DU SELLER au niveau de l'ITEM
     Pas du marchand, pas au niveau de la request
```

---

## 🎯 CHANGEMENTS POUR LA FIX

### SUPPRESSION
```javascript
❌ requests.hasInsurance — REMOVE COMPLETELY
   - Ne pas créer de request avec assurance
   - Pas de checkbox "Add insurance" en créant la request
```

### CONSERVATION  
```javascript
✅ items.hasInsurance — KEEP (reste au niveau item)
   ✅ items.insuranceCost — KEEP (reste au niveau item)
   ✅ Mais: SEULEMENT géré par le SELLER, pas le marchand
```

### QUI PEUT MODIFIER items.hasInsurance?
```
❌ Marchand: PAS après avoir crée l'item
✅ Seller: OUI après que marchand ait finalisé la liste

Timing:
- Marchand crée item → item.hasInsurance = null/false (default)
- Marchand finalise liste
- Seller voit items dans request-detail
- Seller peut cocher hasInsurance (avant validation)
```

### Affichage & UX
```
Request Detail (Seller View):
- Voir les articles créés par marchand
- Pour CHAQUE article:
  - [ ] Insurance (5% du prix) - checkbox
  - [ ] Negotiable price - input field
  - Bouton: Validate Article

Une fois tous les articles validés = Agreement généré
```

---

## 📋 IMPACT SUR LES TÂCHES T-002 À T-009

### T-002: Schema Update
```sql
-- SUPPRIME:
ALTER TABLE requests DROP COLUMN hasInsurance;

-- GARDE:
items.hasInsurance -- reste
items.insuranceCost -- reste

-- AJOUTE (optionnel, pour clarity):
items.insuranceDecidedBy = 'seller' -- qui a décidé
items.insuranceDecidedAt = timestamp -- quand
```

### T-003: Routes Update
```
❌ SUPPRIME:
   POST /api/requests - remove hasInsurance field
   PATCH /api/requests - remove hasInsurance

✅ UPDATE:
   PATCH /api/items/:id { hasInsurance }
   - Allow seller to toggle hasInsurance
   - ONLY if request status allows seller validation
   - ONLY before agreement is signed

✅ ADD CHECK:
   - Can seller modify? Is list finalized?
   - Is request in validation/negotiation state?
```

### T-004: Financial Calculation
```
No change needed for insurance calculation
- Reste: insuranceCost = price * 0.05
- Qui paie? SELLER (to be tracked in future)
- Pour l'instant: juste stocker l'info que option existe
```

### T-005: Remove Request-Level Insurance
```
create-request.tsx:
- ❌ SUPPRIME: Insurance checkbox du step 3
- ✅ GARDE: Tout le reste de la form

request-detail.tsx:
- ✅ GARDE: Insurance checkbox au niveau des items (seller view)
- ✅ GARDE: Seller peut cocher/décocher avant validation
```

### T-006: Add Seller Insurance Validation
```
request-detail.tsx (Seller View):
- Après que marchand finalise la liste
- Pour chaque item, afficher:
  ☐ Add Insurance (+5% = €X.XX)
  - Description: "Optional insurance coverage for this item"

- Seller peut:
  ✅ Check la case
  ✅ Uncheck la case
  ✅ BEFORE validating the item
```

### T-007: Tests
```
✓ requests.hasInsurance n'existe pas (removed)
✓ Seller CAN modify items.hasInsurance
✓ Marchand CANNOT modify items.hasInsurance (after created)
✓ Insurance checkbox appears in seller's item validation view
✓ Agreement snapshot includes hasInsurance for each item
✓ insuranceCost calculated correctly (5% of price)
```

### T-008: Data Migration
```
Migration task:
- Audit existing requests.hasInsurance values
- Copy to items where request_id matches (if needed)
- Mark as "migrated_from_request_level"
- Test that no data lost
```

### T-009: Documentation
```
Document:
- Insurance is item-level feature
- Only seller can set it (after marchand finalizes list)
- 5% of item price
- No payment handling yet (future enhancement)
```

---

## 🔄 CURRENT ISSUE FIXED

Before:
```
❌ Dual management: request.hasInsurance + items.hasInsurance
❌ Marchand could modify insurance
❌ Seller couldn't control it at item level
```

After Fix:
```
✅ Single location: items.hasInsurance only
✅ Seller controls it (item-level validation step)
✅ Marchand cannot change it (read-only after creation)
✅ Clear UX: Insurance option in validation screen
```

---

## 📌 KEY DECISIONS

1. **WHERE**: Insurance at item level (not request)
2. **WHO CONTROLS**: Seller only (via validation/negotiation screen)
3. **WHEN**: After marchand finalizes list, before agreement
4. **COST**: 5% of item price (stored as insuranceCost)
5. **PAYMENT**: Not implemented yet (just option info for now)

