# T-001: Analyse Complète du Modèle d'Assurance

## 🔍 52 Références Trouvées à l'Assurance dans le Code

### 1. SCHEMA (shared/schema.ts)
```
- requests.hasInsurance: boolean (line 55)
- items.hasInsurance: boolean (line 116)
- items.insuranceCost: numeric (line 117)
```

### 2. CONFIGURATION
```
- INSURANCE_RATE = 0.05 (5% du prix)
- Calculé partout: price * 0.05
```

### 3. BACKEND ROUTES (server/routes.ts) - 32 références

**Endpoints majeurs qui gèrent l'assurance:**
- POST /api/requests (line 662) — Seller crée request avec hasInsurance
- PATCH /api/items/:id (line 1507) — Marchand peut modifier hasInsurance après création
- POST /api/items/:id/approve-price (line 1625) — Seller approuve prix + insurance
- POST /api/items/:id/accept-counter-offer (line 1930) — Peut inclure assurance
- POST /api/agreements/:id (line 61) — Calcule insurance dans snapshot

**La fonction clé: `buildAgreementSnapshot()`**
```typescript
const insuranceCost = i.hasInsurance ? (price * 0.05) : 0;
// Stockée dans agreement.itemsSnapshot ET agreement.feeBreakdown
```

### 4. FRONTEND (client/src/) - 18 références

**Create Request**
- create-request.tsx (line 27) — Checkbox hasInsurance au request level
- Stocké dans request.hasInsurance avant transmission

**Request Detail** 
- request-detail.tsx (line 442-443) — Marchand peut modifier `item.hasInsurance` via PATCH
- Marchand toggle l'assurance sur chaque article individuellement
- Mutation: `{ itemId, hasInsurance }`

**Agreement Detail**
- agreement-detail.tsx (line 87, 306-307) — Affiche l'assurance dans le snapshot
- Affichage: `+€X.XX ins.`

### 5. TRANSACTIONS & AGREEMENTS

**Transactions table** (schema.ts:270-289)
```
- salePrice, sellerEarning, marchantEarning, platformEarning
- NO insuranceCost field (❌ assurance pas explicitement tracée)
- sellerEarning/marchantEarning basé sur les % des fees uniquement
```

**Agreements table** (schema.ts:354-371)
```
- itemsSnapshot (JSON) — Contient assurance pour chaque item
- feeBreakdown (JSON) — Contient fees + assurance
- Snapshot est créé une fois quand agreement est généré
```

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### Problème 1: Dual-Level Management
- **Niveau Request** (seller): `requests.hasInsurance = true`
- **Niveau Item** (marchand): `items.hasInsurance` peut être différent!
- Exemple: Seller demande insurance, mais marchand peut la désactiver sur certains articles
- ❌ Source of truth ambiguë

### Problème 2: Assurance n'affecte pas les Earnings
```javascript
// Fee calculation (routes.ts:63-65)
sellerAmount = price * sellerPct  // Pas d'assurance deduite!
marchantAmount = price * marchantPct
platformAmount = remaining

// Insurance is SEPARATE
insuranceCost = price * 0.05
```
- L'assurance est calculée mais pas incluse dans le split seller/marchand/plateforme
- ❌ Unclear où l'argent de l'assurance va

### Problème 3: Assurance Modifiable par Marchand
- Après que request.hasInsurance est défini par le seller
- Le marchand peut ajouter/retirer assurance sur chaque article
- Via PATCH /api/items/:id
- ❌ Marchand peut contredire la volonté du seller

### Problème 4: Pas de Traçabilité d'Assurance Payée
- `transactions` table n'a pas de champ `insuranceCost`
- Assurance est dans le snapshot JSON du agreement
- ❌ Pas de line-item clair pour l'assurance dans les transactions

### Problème 5: Calculations Inconsistent
- 3 endroits différents calculent l'assurance:
  1. buildAgreementSnapshot (line 61)
  2. PATCH /api/items (line 1545)
  3. Approve price endpoint (line 1625)
  4. Accept counter-offer (line 1930)
- ❌ Risque d'inconsistance si l'un change

---

## 📊 FLOW ACTUEL (PROBLÉMATIQUE)

```
1. SELLER creates request
   → request.hasInsurance = true

2. MARCHAND accepts request
   → request.marchantId = marchand_id

3. MARCHAND creates articles
   → items.hasInsurance = request.hasInsurance (copy)

4. MARCHAND can MODIFY insurance on each item
   → PATCH /api/items/:id { hasInsurance: false }
   → Peut désactiver même si seller a demandé!

5. SELLER approves price
   → Valide item.approvedPrice + item.hasInsurance
   → Inclus dans agreement snapshot

6. AGREEMENT created with SNAPSHOT
   → itemsSnapshot contient insurance
   → feeBreakdown contient insurance line items
   → Mais transactions table ne track pas qui paie l'assurance

7. SALE completed
   → Argent transféré selon fees (sellerEarning, marchantEarning)
   → Assurance cost = ??? (pas clair dans transactions)
```

---

## ✅ CE QUE LA FIX DOIT FAIRE

### Consolidation Level
- ✅ Request level = seller's ONLY choice
- ❌ Item level management (remove)

### Who Pays
- ✅ Seller paie (request level décision)
- ❌ Pas marchand

### Immutability
- ✅ Une fois request.hasInsurance = true, cannot be changed by marchand
- ❌ Pas de PATCH /api/items pour l'assurance

### Calculation
- ✅ Central location (buildAgreementSnapshot)
- ❌ Pas de calculs dispersés

### Traceability
- ✅ transactions ou agreement doit clearly montrer qui paie l'assurance
- ❌ Pas de ambiguity

---

## 🎯 TÂCHES POUR T-002 À T-009

### T-002: Schema Update
```sql
-- Remove from items:
ALTER TABLE items DROP COLUMN hasInsurance;
ALTER TABLE items DROP COLUMN insuranceCost;
-- Or DEPRECATED flag them

-- requests.hasInsurance remains
-- Assertions table keeps snapshot (no change needed)
```

### T-003: Routes Update
```
POST /api/requests {hasInsurance}
PATCH /api/requests/:id {hasInsurance} — Only before marchand accepts
-- NO /api/items/:id {hasInsurance} endpoint
```

### T-004: Financial Calculation
```
When agreement created:
- insuranceCost = price * 0.05
- Who pays? Mark in feeBreakdown: "paid_by: seller"
- Update agreement.feeBreakdown to show explicit insurance line
```

### T-005: Frontend Cleanup
```
- Remove PATCH /api/items insurance mutation from request-detail.tsx
- Hide/disable insurance checkbox at item level (marchand view)
- Show "Insurance: Set by seller, cannot change" message
```

### T-006: Seller UX
```
- create-request.tsx: Keep checkbox ✓
- request-detail.tsx (seller view): Show insurance cost in summary
- agreement-detail.tsx: Already shows "+€X.XX ins." ✓
```

### T-007: Tests
```
✓ Request with hasInsurance=true → insurance calculated
✓ Marchand cannot modify insurance after accepting request
✓ Agreement snapshot includes insurance with seller as payer
✓ Transactions show insurance line item
```

### T-008: Data Migration
```
Audit existing data:
- requests with hasInsurance=true
- items with hasInsurance that DIFFERS from request
- agreements with inconsistent snapshots
- transactions that might have paid insurance
```

### T-009: Documentation
```
Document: Insurance is request-level, seller-paid feature
APIs affected: /api/requests, /api/agreements
```

---

## 📋 FINDINGS SUMMARY

| Aspect | Current | Needed |
|--------|---------|--------|
| Source of Truth | Dual (request + item) | Single (request only) |
| Who Controls | Seller + Marchand | Seller only |
| Calculation Location | 4 places | 1 place (buildAgreementSnapshot) |
| Traceable in Transactions | ❌ No | ✅ Yes (line item) |
| Immutable After Request | ❌ No | ✅ Yes |
| Frontend Clarity | ❌ Confusing | ✅ Clear UI |

---

## ⚡ NEXT STEPS

1. ✅ T-001 Analysis COMPLETE
2. → Proceed to T-002: Schema update
3. → Follow with backend routes (T-003, T-004)
4. → Then frontend cleanup (T-005, T-006)
5. → Finally tests, migration, docs (T-007, T-008, T-009)

