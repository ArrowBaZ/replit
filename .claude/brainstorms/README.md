# Brainstorms for Sellzy Improvements (April 2026)

Three focused PRD brainstorms to reduce seller friction, improve seller/reseller confidence through documentation, and implement transparent, tiered commission structures.

## 📋 Brainstorms Created

### 1. [Seller Documentation & Media Hub](2026-04-10-seller-documentation-media.md)
**Slug:** `seller-documentation-media`

Sellers upload photos and authenticity certificates during item submission. Resellers can request additional docs via integrated chat. Both parties get real-time notifications.

**Key approach:** Chat-integrated document requests (reuses existing messaging infrastructure)

**Success metrics:**
- Sellers can upload 3-5 photos + 2-3 docs during item creation
- Resellers can request additional docs with one click
- Both parties notified within 30 seconds
- Reseller confidence in authenticity improves

**Integration:** Used during item evaluation (before reseller commitment)

---

### 2. [Smart Agreement Generation & Digital Signing](2026-04-10-smart-agreement-generation.md)
**Slug:** `smart-agreement-generation`

Auto-generate contracts when reseller commits to items. Include item count, pricing, and platform/seller/reseller fee breakdown based on tiered pricing model. Both parties sign digitally. Creates audit trail and legal record.

**Key approach:** Simple auto-generation + email signing (MVP scope; can upgrade to DocuSign later)

**Fee Structure (integrated):**
- €60–€150: Seller 50%, Reseller 40%, Platform 10%
- €151–€500: Seller 55%, Reseller 35%, Platform 10%
- €501+: Seller 60%, Reseller 30%, Platform 10%

**Success metrics:**
- Contract auto-generates within 5 seconds
- Both parties receive signing email within 1 minute
- Signing takes < 1 minute
- 100% of agreements have signed contract with correct fee tiers
- All disputes resolvable with signed contract + timestamp

**Integration:** Triggered after reseller commitment; uses live fee tiers from PRD 3

---

### 3. [Tiered Fee Configuration System](2026-04-10-tiered-fee-configuration.md)
**Slug:** `tiered-fee-configuration`

Admin-controlled pricing tiers with full transparency dashboard visible to sellers and resellers. Shows exact commission splits at each price tier. Supports EUR/CHF pricing globally.

**Key approach:** Simple admin config + live dashboard (no historical versioning in MVP)

**Features:**
- Admin panel to define/modify price tiers and fee percentages
- Public dashboard showing current tiers to sellers/resellers
- Automatic EUR/CHF conversion (single global model)
- Complete audit trail of tier changes (admin, timestamp)
- Contract integration (contracts locked to fees at signing time)

**Success metrics:**
- Admins can manage up to 10 price tiers
- Fee calculations always exact (no rounding errors)
- Sellers see tier earnings estimate before listing
- Resellers see cost breakdown before committing
- All tier changes logged with admin ID + timestamp

---

## 🚀 Next Steps

Choose one:

1. **Review & refine** — Improve these documents through structured review before planning
2. **Proceed to planning** — Run `/copilot-plan` to create implementation plans
3. **Ask more questions** — Continue exploring specific aspects
4. **Done for now** — Return to these brainstorms later

Run `/copilot-plan seller-documentation-media` or `/copilot-plan smart-agreement-generation` when ready to create implementation plans.
