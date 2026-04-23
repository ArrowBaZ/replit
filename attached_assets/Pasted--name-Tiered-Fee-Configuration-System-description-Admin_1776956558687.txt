---
name: Tiered Fee Configuration System
description: Admin-controlled pricing tiers with full transparency dashboard for sellers/resellers showing exact commission splits
type: brainstorm
date: 2026-04-10
feature_slug: tiered-fee-configuration
---

# Brainstorm: Tiered Fee Configuration System

## What We're Building

An admin-facing system to define and manage tiered commission structures based on item sale value. Paired with a transparency dashboard visible to sellers and resellers during negotiation and contract signing, showing exactly how fees are split at each price tier. Supports global EUR/CHF pricing models with automatic currency conversion.

## Why This Approach

Transparent, dynamic pricing builds trust with both sellers and resellers. A configurable system allows the platform to:
- **Experiment with fee models** — Adjust seller/reseller/platform splits to optimize growth
- **Support different categories** — Luxury items might have different splits than basics (future phase)
- **Regional adaptability** — EUR and CHF pricing handled automatically
- **Reduce disputes** — Both parties see exact fee breakdown before commitment
- **Compliance** — Document all fee structures in contracts for legal protection

## Key Decisions

- **Admin Control:** Only platform admins can define/modify price tiers and fee percentages
- **Global Model:** Single EUR/CHF-agnostic tier structure with automatic currency equivalents
- **Visibility:** Sellers see their tier and earnings; resellers see their acquisition cost and margin
- **Audit Trail:** All fee structure changes logged with timestamp and admin who made the change (for legal disputes)
- **Contract Integration:** Agreement generation uses live fee tiers (if tiers change, new contracts use new fees; existing contracts locked to their original fees)
- **Simplicity (MVP):** Start with 3 tiers as defined; add category-specific tiers in future if needed

## Approaches Considered

### Approach 1: Simple Admin Config + Live Dashboard (Recommended)
**Description:**
Admin panel with tier editor (define price ranges, seller/reseller/platform percentages). Dashboard displays tiers publicly to sellers/resellers during listing and contract. No historical tier versioning; all contracts use current tiers.

**Pros:**
- Minimal complexity — one configuration, live everywhere
- Easy to understand and manage
- Sellers/resellers always see current economics
- Fast to implement

**Cons:**
- If tiers change, past contracts don't reflect old fees (potential dispute confusion)
- Can't analyze "what if" scenarios

**Why chosen:** MVP scope; meets transparency goal with minimal overhead.

---

### Approach 2: Tier Versioning + Historical Tracking
**Description:**
Admin defines tiers; system auto-versions them on each change. Contracts store which tier version they used. Dashboard shows "current" and "previous" tiers. Historical analysis possible.

**Pros:**
- Perfect for legal disputes (contract always shows correct fees for its date)
- Allows A/B testing of fee models
- Clear audit trail

**Cons:**
- More complex data model
- Could confuse sellers/resellers seeing multiple tier versions

**Why rejected:** Adds complexity; defer to when we need A/B testing or have had disputes.

---

### Approach 3: Category-Specific Tiers
**Description:**
Different fee structures per category (luxury, basics, accessories). Sellers see their category's tiers when listing.

**Pros:**
- Can optimize economics per category
- Luxury items can support lower reseller cut

**Cons:**
- Requires category mapping in items table
- More admin burden (define 3+ tier sets)
- Sellers might game the system (list item in cheaper tier's category)

**Why rejected:** Out of scope for MVP; single global model sufficient.

---

## Constraints & Requirements

- **Technical:**
  - Tier definitions stored in database (not hardcoded)
  - Admin panel for CRUD operations on tiers
  - Validation: percentage totals must equal 100% (seller + reseller + platform)
  - No tier can leave a party with < 0% (basic validation)

- **UX:**
  - Sellers see their tier when listing (before contract)
  - Resellers see tier breakdown before committing
  - Both see final amounts in contract email
  - Mobile-friendly display of fee breakdowns

- **Data:**
  - Tier changes log admin ID and timestamp
  - Contracts store snapshot of tiers used at signing time
  - Historical tier versions retrievable for audit (future enhancement)

- **Regions:**
  - EUR is base currency
  - CHF equivalents auto-calculated (1:1 by default, adjustable if needed)
  - Same percentage splits apply to both currencies

## Resolved Decisions

✅ **Fee splits are fixed** — Always 50/40/10, 55/35/10, or 60/30/10 by tier. Not negotiable per-transaction.  
✅ **Full transparency to both parties** — Sellers and resellers see tier breakdown for each item at all times.  
✅ **Negotiation is about items, not fees** — Seller & reseller discuss which items to sell (e.g., "you can sell 50 of these 100 wines, not the rest"). Fees are automatic once items are agreed.  
✅ **Tier stability** — Tiers are the business model and unlikely to change. If they do, existing deals are locked to their original tier version (contract captures tier snapshot at signing).  
✅ **Fee visibility (registered users only)** — Tiers visible in dashboard to logged-in sellers/resellers, not published publicly on website.  
✅ **Reseller fee visibility timing** — Resellers see fee breakdown when preparing/adding items to their list (not just at contract time).

## Success Criteria

✅ Admins can define up to 10 price tiers (no per-tier limit on sellers/resellers/platform %)  
✅ Fee calculations are always exact — no rounding errors in contracts  
✅ Sellers see their tier earnings estimate before listing  
✅ Resellers see tier breakdown and their cost before committing  
✅ Both parties see exact amounts in signed contract  
✅ Admin can change tiers and see impact on upcoming contracts within 5 seconds  
✅ All tier changes logged with admin ID + timestamp  
✅ Legal/finance team can audit fee structure history  

## Next Steps

Once brainstorm is approved:
1. Confirm tier change policy (immediate vs. scheduled)
2. Answer open questions (especially regional legal requirements)
3. Review contract template language to ensure fees are clearly explained
4. Run `/copilot-plan tiered-fee-configuration` to create implementation plan
