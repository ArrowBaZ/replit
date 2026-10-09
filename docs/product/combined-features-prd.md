---
tags: [copilot, prd]
feature: combined-features-2.2-to-2.5
status: active
date: 2026-03-25
type: feat
---

# Features 2.2–2.5: Moderation, Photos, Dashboards, and Reseller Discovery

A comprehensive PRD covering listing moderation/validation (2.2), photo uploads and guidance (2.3), reseller dashboard (2.4), and reseller listing for sellers (2.5). These features work together to improve content quality, seller guidance, reseller transparency, and user trust on the Sellzy marketplace.

---

## Overview

These four features address key marketplace gaps:

1. **Listing Moderation (2.2)**: Ensure content quality and compliance through reseller flagging, inactivity detection, and admin reviews
2. **Photo Uploads (2.3)**: Enable rich visual content with guidance on authenticity certificates and wardrobe context
3. **Reseller Dashboard (2.4)**: Empower resellers with business intelligence on revenue, activity, and performance metrics
4. **Reseller Discovery (2.5)**: Help sellers find and evaluate resellers based on verified stats, ratings, and location

Together, they create a more trustworthy, transparent marketplace where:
- Low-quality listings are caught early
- Visual content builds confidence in items
- Resellers can track and optimize their business
- Sellers can make informed reseller choices

---

## Feature 2.2: Listing Moderation and Validation

### Problem Statement / Motivation

**Challenges:**
- Sellers may post non-compliant listings (prohibited items, low-quality photos, unrealistic prices)
- Inaccurate or misleading descriptions damage buyer trust
- No clear feedback loop: sellers don't know why their requests aren't getting engagement
- Admins lack visibility into which listings need review
- Resellers have no tool to report problematic listings

**Impact:**
- Low-quality listings hurt marketplace reputation
- Sellers feel uninformed about platform standards
- Admins can't proactively manage content
- Compliance/legal risks if prohibited items slip through

**Solution:**
Implement a moderation system where:
- **Resellers** can flag non-compliant listings with comments
- **Admins** receive notifications and can review flagged listings
- **Inactivity detection** automatically deactivates listings with no engagement for 2 weeks
- **Comments** from resellers are visible only to admin (not the seller initially)
- **Trust score** system rates listings based on seller history and quality signals

### Proposed Solution

**Component 1: Reseller Reporting**

Resellers can flag a listing from the request detail page:
1. Button: "Report Listing" (red/warning color)
2. Modal with:
   - Dropdown: Category (prohibited items, misleading description, low quality, other)
   - Text area: Detailed comment (required)
   - Checkbox: "Follow up on seller response" (optional)
3. Admin notified immediately: "Listing flagged by {reseller} for {reason}"
4. Seller receives notification: "Your listing [ID] has been reported. [Optional: admin can optionally contact you]"
5. Comment logged in moderation audit trail

**Component 2: Inactivity Detection**

Automated job (runs daily at 2 AM):
1. Query requests with no activity (no new messages, no views) for 14+ days
2. Check: request status is "pending" or "matched" (exclude completed/cancelled)
3. Auto-deactivate: Change request status to "inactive"
4. Notification to admin: "Listing [{ID}] inactive for 2+ weeks"
5. Notification to seller: "Your listing [ID] has been deactivated due to inactivity. [Contact admin to reactivate]"
6. Reseller note: Private comment field (visible only to that reseller) for tracking reasons

**Component 3: Trust Score System**

Listing quality rating algorithm:
- **Base score**: 100 points
- **Deductions**:
  - Seller has pending/rejected applications: -10
  - Seller has previous flagged listings: -5 per flag
  - Photos insufficient (< 3): -15
  - Listing age > 30 days without activity: -10
  - Price below 10€ or above 10,000€: -5
  - Missing key fields (condition, size, brand): -5
  - Seller new (< 7 days old): -20
- **Bonuses**:
  - Authenticity certificate uploaded: +10
  - High-quality description (> 100 words): +5
  - Multiple photos (5+): +5
  - Successful past transactions: +10
- **Result**: Score displayed as 1-5 stars on admin listing view

**Database Changes:**
- Add `moderationFlags` table (flagging history)
- Add `trustScore` calculated field on requests
- Add `inactiveReason` text field to requests
- Add `reseller_comments` in moderation_actions table (not visible to seller)

### Technical Considerations

**Architecture Impacts:**
- New scheduled job for inactivity detection (Cron/Node scheduler)
- New API endpoints:
  - `POST /api/requests/:id/flag` - Reseller flags request
  - `GET /api/admin/requests/flagged` - Admin views flagged requests
  - `POST /api/requests/:id/deactivate` - Manual deactivation by admin
  - `POST /api/requests/:id/reactivate` - Re-enable inactive request
- New database tables: `moderationFlags`, `moderationActions`
- Notification triggers for flag, inactivity, deactivation

**Performance:**
- Inactivity job queries requests table (indexed on status, createdAt) - acceptable
- Trust score calculated on-demand (cache if expensive)
- Flag count per request low (expected < 10 flags per 1000 requests)

**Security:**
- Only admins can see reseller comments
- Reseller can only flag requests they're not assigned to
- Seller cannot see who flagged their listing (privacy)
- Audit trail logs all moderation actions

### System-Wide Impact

**Interaction Graph:**
1. Reseller flags request → `POST /api/requests/:id/flag`
2. Creates `moderationFlags` record + notification for admin
3. Admin reviews → `GET /api/admin/requests/flagged`
4. Admin takes action → Creates `moderationActions` log entry
5. Seller notified via notification system

**Notification Types:**
- `listing_flagged` - Seller receives (may or may not include reason)
- `listing_inactive` - Seller receives when auto-deactivated
- `listing_reactivated` - Seller receives when reactivated
- `flag_received` - Admin receives alert

**State Lifecycle:**
- Request status: `pending`/`matched` → `inactive` (auto-deactivation)
- Request status: `inactive` → `pending`/`matched` (manual reactivation)
- Trust score: Updated when flag added/removed or seller completes transaction

### Success Metrics

1. **Moderation speed**: 90% of flagged listings reviewed within 24 hours
2. **Quality improvement**: Average trust score increases by 10% month-over-month
3. **Inactivity detection**: 99% of inactive listings correctly identified
4. **Seller engagement**: 80% of sellers reactivate inactive listings
5. **Compliance**: 0 prohibited items slip past flagged listings
6. **False positives**: < 5% of flagged listings are legitimate (review accuracy)

### Dependencies & Risks

**Dependencies:**
- Notification system (already implemented)
- Request status field in database
- Admin review capability
- Audit logging system

**Risks:**
- **False flags**: Resellers flag legitimate listings maliciously
  - Mitigation: Track flagging history, warn repeat false-flagger resellers
- **Inactivity overreach**: Listings deactivated that seller is actively working on (no messages yet)
  - Mitigation: 2-week grace period is reasonable; allow manual override
- **Seller burnout**: Too many deactivations discourage sellers
  - Mitigation: Clear communication about why (metrics provided)
- **Admin overload**: If flagged count spikes
  - Mitigation: Prioritize by trust score, batch review

---

## Feature 2.3: Photo Uploads and Seller Guidance

### Problem Statement / Motivation

**Challenges:**
- Current system supports photos but lacks guidance
- High-value items need authenticity verification but no structured way to provide it
- Sellers don't know best practices (photo composition, lighting, angles)
- Wardrobe context helps evaluate condition but isn't encouraged
- Photos scattered across items without clear guidance

**Impact:**
- Buyer confidence drops without visual proof
- Luxury items susceptible to counterfeiting
- High-value transactions at risk
- Unclear item condition leads to disputes

**Solution:**
Implement photo upload system with:
1. **Structured guidance**: Clear instructions for different photo types
2. **Authenticity certificates**: Dedicated section for receipts, COAs, certificates
3. **Wardrobe context**: Optional photos showing item in styling context
4. **Progressive disclosure**: Sellers see tips as they upload

### Proposed Solution

**Component 1: Photo Upload UI**

Sellers can upload up to 5 photos per item:
1. Upload area: Drag-and-drop or file picker
2. Real-time preview: Show uploaded photos as grid
3. Reorder: Drag to change display order
4. Delete: Remove unwanted photos
5. Labels: Option to mark photo type (front view, back view, detail, care tag, etc.)

**Component 2: Seller Guidance**

**Inline Tips:**
- "Take photos in natural light for accurate color"
- "Include close-up of brand label or care tag"
- "Show item on hanger or laid flat (not on body)"
- "Include photo of any defects or wear"

**Knowledge Base Modal:**
- "How to take great product photos" (video or slideshow)
- "Luxury item photography tips" (lighting, backgrounds)
- "Why wardrobe context matters" (shows styling, condition, scale)

**Authenticity Certificates Section:**
- Dedicated upload area for luxury items
- Supported: Receipt photos, brand certificate, COA, authenticity card
- Label field: "Type of certificate" dropdown
- Visibility: Only shown if item brand is luxury brands list (hardcoded)

**Wardrobe Photos Section:**
- Optional: "Show me styling this in my wardrobe"
- Guidance: "Photos of item on hanger or styled (without close-ups of defects)"
- Max 3 wardrobe photos per item

**Component 3: Display in Listings**

Item detail page shows:
1. Main photo (first uploaded)
2. Photo thumbnails: Click to view full-size
3. "Authenticity" section: If certificates provided, show count/list
4. "Styling" section: If wardrobe photos provided, carousel view
5. Photo metadata: Timestamp, file size (for transparency)

### Technical Considerations

**Architecture Impacts:**
- Extend `items.photos` schema to include metadata: `{ path, type, label, uploadedAt }`
- New certificate storage field: `items.certificates` (array of cert objects)
- New wardrobe photo field: `items.wardrobePhotos` (array of paths)
- Or: Add columns `certificatePhotos` and `wardrobePhotos` to items table

**File Storage:**
- Use existing presigned URL flow (Replit Object Storage)
- Path format: `/objects/uploads/{uuid}` (already implemented)
- Max file size: 10MB per photo, 50MB total per item
- Validation: Only JPG, PNG accepted

**Performance:**
- Photos served from Replit Object Storage (CDN-backed)
- No server processing (no image resizing, thumbnailing)
- Lazy-load photos below fold on listing page

**Security:**
- Validate file MIME type server-side (not just extension)
- Scan for malicious content (consider VirusTotal API if high-risk)
- Seller cannot view other seller's certificate photos
- Rate limit: Max 20 uploads per user per day (prevent abuse)

### System-Wide Impact

**Interaction Graph:**
1. Seller uploads photo → `POST /api/uploads/request-url` → presigned URL
2. Seller uploads file directly to storage
3. Seller posts back object path → `POST /api/items/:id/upload-photo`
4. Photo metadata stored in items table
5. Photo displayed on item detail page for reusses/buyers

**Notification:** No notifications needed (internal to seller's workflow)

**Data Flow:**
- Photos array stored in PostgreSQL (just paths)
- Actual files in Replit Object Storage
- Certificates array follows same pattern

### Success Metrics

1. **Adoption**: 80% of new listings include 3+ photos
2. **Certificate use**: 20% of luxury items include authenticity certificate
3. **Wardrobe context**: 30% of clothing items include wardrobe photos
4. **Impact on sales**: Listings with 5 photos convert 2x better than 1 photo
5. **Upload success**: 99.5% of uploads complete without errors
6. **Guidance helpfulness**: 70% of sellers find tips useful (survey)

### Dependencies & Risks

**Dependencies:**
- Presigned URL flow (already implemented)
- Items schema with photos array
- Object Storage service (Replit)

**Risks:**
- **Poor quality photos hurt sales**: Seller uploads blurry photos
  - Mitigation: Provide guidance, show quality score before upload
- **Abuse**: Seller uploads inappropriate/irrelevant images
  - Mitigation: Manual review flag system, rate limiting
- **File size explosion**: Photos too large, storage costs spike
  - Mitigation: Enforce max file size, compress on client-side
- **Mobile upload issues**: Connectivity drops, partial uploads
  - Mitigation: Resume capability, clear error messages

---

## Feature 2.4: Reseller Dashboard

### Problem Statement / Motivation

**Challenges:**
- Resellers lack visibility into business performance
- No way to track earnings month-over-month
- Can't see what types of requests are most profitable
- No metrics on response time or conversion rate
- Resellers can't optimize their strategy

**Impact:**
- Resellers churn (don't feel valued or in control)
- Platform loses resellers to competitors with better tools
- Resellers make blind decisions (no data to optimize)
- Missed opportunity to share best practices

**Solution:**
Build a comprehensive dashboard showing:
1. **Revenue**: Monthly earnings visualization
2. **Activity**: Listings created, inquiries, responses
3. **Performance**: Conversion rate, response time, rating

### Proposed Solution

**Component 1: Monthly Revenue**

Chart showing earnings over time:
- Last 12 months as bar chart or line graph
- Y-axis: Earnings (€)
- X-axis: Month
- Hover: Show exact amount, number of sales, average sale price
- Filter: Date range selector (last 30 days, 90 days, 12 months, custom)
- Metric card: "This month: €XXX" (highlights current month)

**Revenue Breakdown:**
- By category: Earnings by clothing category (dresses, shoes, accessories)
- By status: Completed vs. pending/in-progress
- Cumulative: Total career earnings

**Component 2: Activity Metrics**

Card grid showing:
1. **Active Listings**: Count of unmatched requests
2. **Listings Created**: Count this month
3. **Inquiries Received**: Count of sellers accepting their requests
4. **Responses Sent**: Count of messages sent this month
5. **Items Sold**: Count of items marked sold this month
6. **Conversion Rate**: (Items sold) / (Items assigned) %
7. **Avg Response Time**: Average time from inquiry to response (hours)
8. **Satisfaction Rating**: Average 1-5 rating from sellers

**Trends:**
- Arrows showing month-over-month change (up/down)
- Color-coded: Green (improvement), Red (decline), Gray (neutral)

**Component 3: Statistics & Insights**

Table showing:
- **Categories by revenue**: Ranked list of categories (Dresses: €2,000, Shoes: €1,500)
- **Best performing requests**: Requests with most sales
- **Top sellers by repeat rate**: Sellers who keep coming back
- **Performance vs. peers**: "You're in top 20% of resellers by response time"

**Comparison:**
- Compare current month to last month
- Show trend over 6 months
- Benchmarks: "Average reseller earns €XXX/month" (anonymized)

### Technical Considerations

**Architecture Impacts:**
- New page: `/client/src/pages/reusse-dashboard.tsx`
- New API endpoints:
  - `GET /api/earnings-summary` - Monthly breakdown
  - `GET /api/stats/activity` - Activity counts
  - `GET /api/stats/conversion` - Conversion metrics
- Extend transactions table with `createdAt` if not present
- Calculate metrics on-demand (cache if expensive)

**Data Aggregation:**
- Earnings: SUM of reusse_earning from transactions table (by month)
- Conversion rate: COUNT(sold items) / COUNT(assigned items)
- Response time: AVG of (first response timestamp - assignment timestamp)
- Rating: AVG of review.rating where reviewee = reusse
- Activity: COUNT of requests, items, messages (by date range)

**Performance:**
- Use database aggregation (GROUP BY month), not JavaScript
- Cache metrics for 1 hour (updated at end of day sufficient)
- Pagination on tables (top 10 categories, sellers, etc.)

**Security:**
- Reseller can only see their own data
- Admin could see aggregated (anonymized) stats across resellers
- No access to other resellers' earnings/performance

### System-Wide Impact

**Interaction Graph:**
1. Reusse visits `/reusse-dashboard`
2. Loads 4 queries in parallel:
   - Earnings summary (monthly breakdown)
   - Activity stats (counts by date)
   - Performance metrics (conversion, response time, rating)
   - Category breakdown (earnings by category)
3. Charts render with data
4. Reusse filters by date range → queries re-run
5. On transaction completion, relevant metrics auto-update (via query invalidation)

**Real-Time Updates:**
- Not real-time; refresh on-demand is acceptable
- Use React Query with 1-hour cache
- Manual refresh button to force update
- Auto-refresh when new transaction completes (via mutation)

### Success Metrics

1. **Adoption**: 70% of resellers visit dashboard weekly
2. **Engagement**: Dashboard visit increases retention by 15%
3. **Optimization**: Resellers who use dashboard earn 20% more (self-selection bias, but positive)
4. **Accuracy**: Dashboard metrics match actual earnings (validate monthly)
5. **Performance**: Page loads in < 2 seconds
6. **Satisfaction**: Resellers rate dashboard 4.5/5 stars

### Dependencies & Risks

**Dependencies:**
- Transactions table with reusse_earning and timestamps
- Reviews table (for rating)
- Requests and items tables (for activity counts)
- Existing React dashboard patterns (admin-dashboard)

**Risks:**
- **Incomplete data**: Missing transactions or reviews break metrics
  - Mitigation: Data audit before launch; fallback to 0 if missing
- **Gaming metrics**: Reseller creates fake sales to boost stats
  - Mitigation: Admin oversight; flag unusual patterns
- **Stale data**: Cached metrics don't reflect recent changes
  - Mitigation: 1-hour cache is acceptable; manual refresh button
- **Comparison anxiety**: Benchmarks demoralize low performers
  - Mitigation: Frame as "opportunities to improve" not "you're bad"

---

## Feature 2.5: Reseller List for Sellers

### Problem Statement / Motivation

**Challenges:**
- Sellers don't know which resellers are trustworthy or effective
- No way to filter resellers by location or specialization
- Sellers make blind choices, leading to poor matches
- Resellers with great track records can't showcase themselves
- Testimonials lack transparency (unverified claims)

**Impact:**
- Sellers matched with unreliable resellers → bad experiences
- Good resellers hidden among average ones
- Sellers lack information to make decisions
- Fake reviews undermine trust

**Solution:**
Create a discoverable reseller directory showing:
1. **Reseller profiles**: Name, photo, bio, location
2. **Stats**: Number of listings, response rate, buyer ratings
3. **Testimonials**: Verified reviews from sellers they've worked with
4. **Regional rankings**: Top resellers by area
5. **Proximity filter**: "Show resellers near me"

### Proposed Solution

**Component 1: Reseller List View**

Searchable/filterable list of active resellers:
1. **Default**: All resellers, sorted by rating
2. **Filters**:
   - Location: Dropdown by city/department (from profile)
   - Rating: Min rating slider (2.0 - 5.0)
   - Response rate: Min % (50% - 100%)
   - Specialization: Checkboxes (dresses, shoes, luxury, etc. from category preferences)
3. **Sort options**: By rating, response rate, recent activity, near me
4. **Search**: By reseller name

**Reseller Card (in list):**
- Avatar + name
- Location (city, department)
- Star rating + count of reviews (e.g., "4.8 ⭐ (23 reviews)")
- Stats:
  - "127 listings" (total lifetime or active?)
  - "96% response rate"
  - "12 reviews this year"
- "View Profile" button → detail view

**Component 2: Reseller Detail Page**

Full profile for a reseller:
- **Header**: Avatar, name, location, bio
- **Stats Summary**:
  - Overall rating (stars + count)
  - Total listings (lifetime)
  - Active listings (count)
  - Response rate (%)
  - Average response time (hours)
  - Join date
- **Specializations**: Badges showing expertise (Dresses, Luxury, Vintage, etc.)
- **Testimonials**: Carousel/list of reviews from sellers
  - Show: Seller name (first name only or anonymous), rating, quote, date
  - Filter: "Most recent", "Most helpful"
- **Rankings**: Regional position (e.g., "Ranked #5 in Paris")
- "Request Service" button → Start a request

**Component 3: Testimonial System**

Sellers can leave reviews after transaction completion:
1. **When**: After request marked complete
2. **What**: Popup asking for 1-5 star rating + comment
3. **Categories**:
   - Overall experience (1-5)
   - Communication (1-5)
   - Reliability (1-5)
   - Item handling (1-5)
4. **Moderation**: Admin reviews before publishing
   - Flag: Require seller name verification
   - Prevent: Self-review (seller cannot review their own profile)
   - Remove: Fake/spam reviews

**Component 4: Regional Rankings**

Curated view showing top resellers by region:
- List of regions (Paris, Lyon, Marseille, etc.)
- Top 5-10 resellers per region
- Filter: By category (dresses, luxury, etc.)
- Update: Weekly

### Technical Considerations

**Architecture Impacts:**
- New page: `/client/src/pages/resellers-list.tsx`
- New page: `/client/src/pages/reusse-profile.tsx`
- New table: `reviews` (seller → reseller rating)
- New API endpoints:
  - `GET /api/resellers` - List with filtering/sorting
  - `GET /api/resellers/:id` - Detail page
  - `GET /api/resellers/:id/reviews` - Reviews for reseller
  - `POST /api/requests/:id/review` - Submit review after completion
  - `GET /api/resellers/regional-rankings` - Top resellers by region
- New field on profiles: `categoryPreferences` (array), `bio` (if not present)

**Data Aggregation:**
- **Response rate**: (Responses sent) / (Requests accepted) %
- **Response time**: Average of (first response - assignment) for recent requests
- **Rating**: Average of review.rating for completed requests
- **Active listings**: COUNT of requests where status != cancelled
- **Specialization**: Inferred from most common categories in listings

**Performance:**
- Reseller list: Paginated (20 per page)
- Regional rankings: Pre-computed daily (not real-time)
- Reviews list: Cached, updated hourly
- Filtering: Database query (not client-side) for performance

**Security:**
- Only sellers can see reseller profiles (not public)
- Seller cannot leave review twice (enforce in backend)
- Admin must approve reviews before display
- Reseller data exposure: No sensitive info (not earnings, not messages)

### System-Wide Impact

**Interaction Graph:**
1. Seller visits `/resellers-list`
2. Loads: Reseller list + aggregated stats (queries parallel)
3. Seller filters/sorts → Re-queries
4. Seller clicks profile → Navigate to `/reusse-profile/:id`
5. Loads: Reseller details + reviews
6. After transaction completion, seller prompted to review
7. Review submission → `POST /api/requests/:id/review`
8. Admin reviews before publication
9. Review published → Reseller's rating updates

**Notification:**
- Reseller notified when review published
- Reseller notified of public rankings update

**State Lifecycle:**
- Review status: `pending_approval` → `published` (or `rejected`)
- Reseller rating: Auto-calculated on review publish/delete
- Rankings: Updated daily at midnight

### Success Metrics

1. **Adoption**: 60% of sellers visit reseller list before accepting request
2. **Informed decisions**: Sellers report more confidence in reseller selection
3. **Match quality**: Requests with reseller pre-selected have 10% higher completion rate
4. **Trust**: Resellers report increased inquiry volume
5. **Transparency**: 90% of resellers have at least 3 reviews within 6 months
6. **Accuracy**: Reseller rankings stable week-to-week (< 2 position change)

### Dependencies & Risks

**Dependencies:**
- Profile table (id, name, bio, location, categoryPreferences)
- Reviews table (reseller_id, seller_id, rating, comment, verified_at)
- Requests/transactions (to calculate stats and determine review eligibility)
- Admin review queue (to moderate reviews)

**Risks:**
- **Fake reviews**: Reseller creates bot accounts to review themselves
  - Mitigation: Admin approval required; flag accounts with no transactions; email verification
- **Negative reviews hurt good resellers**: One bad review kills reputation
  - Mitigation: Context (show reason); only recent reviews weighted higher; clear review criteria
- **Gaming rankings**: Reseller artificially boosts stats
  - Mitigation: Audit transaction data; flag suspicious patterns; transparent methodology
- **Seller overwhelm**: Too many resellers to choose from
  - Mitigation: Default sort by rating; regional view helps; pre-filter recommendations
- **Cold start problem**: New reseller has 0 reviews, appears last
  - Mitigation: Boost new resellers slightly; time-decay older reviews; show "new" badge

---

## Cross-Feature Integration

### Dependencies Between Features

**2.2 → 2.4**: Flagged listings lower reseller trust score (indirectly)
- If reseller's listings are flagged often, their rating/visibility drops

**2.3 → 2.2**: Photo quality factors into trust score
- Listings without sufficient photos get lower trust score

**2.3 → 2.5**: Photos visible in reseller discovery
- Reseller's recent listings (with photos) shown on profile

**2.4 ← 2.2, 2.3, 2.5**: Dashboard aggregates all metrics
- Revenue (transactions)
- Activity (requests, messages, flags)
- Performance (conversion, response rate, reviews)

**2.5 ← 2.3**: Reseller profile shows sample items
- Display 3-5 of reseller's best listings (with photos)

### Data Model Summary

**New Tables:**
1. `moderationFlags` - Reseller flagging history
   - Fields: id, requestId, reusserId, category, comment, createdAt

2. `moderationActions` - Admin moderation log
   - Fields: id, requestId, adminId, action (flag, message, reject), reason, reseller_comment, createdAt

3. `reviews` - Seller reviews of resellers
   - Fields: id, requestId, sellerId, reusserId, rating, comment, approved_at, createdAt

**Schema Extensions:**
- `requests`: Add `inactiveReason`, `trustScore`, `rejectionReason`, `statusReason`
- `items`: Add `certificatePhotos` (array), `wardrobePhotos` (array), or extend `photos` to include metadata
- `profiles`: Add `bio`, `categoryPreferences` (array), `specializations` (array)

### API Endpoint Summary

| Feature | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| 2.2 | POST | `/api/requests/:id/flag` | Reseller flags request |
| 2.2 | GET | `/api/admin/requests/flagged` | Admin views flagged requests |
| 2.2 | POST | `/api/requests/:id/deactivate` | Manual deactivation |
| 2.2 | POST | `/api/requests/:id/reactivate` | Re-enable request |
| 2.3 | POST | `/api/uploads/request-url` | Get presigned URL (existing) |
| 2.3 | POST | `/api/items/:id/upload-photo` | Submit photo metadata |
| 2.4 | GET | `/api/earnings-summary` | Monthly earnings |
| 2.4 | GET | `/api/stats/activity` | Activity metrics |
| 2.4 | GET | `/api/stats/conversion` | Conversion metrics |
| 2.5 | GET | `/api/resellers` | List resellers (filtered/sorted) |
| 2.5 | GET | `/api/resellers/:id` | Reseller detail |
| 2.5 | GET | `/api/resellers/:id/reviews` | Reseller reviews |
| 2.5 | POST | `/api/requests/:id/review` | Submit review |
| 2.5 | GET | `/api/resellers/regional-rankings` | Top resellers by region |

---

## Implementation Priorities

### Recommended Order

1. **Phase 1** (Week 1-2): Photo uploads (2.3)
   - Lowest complexity, reuses existing presigned URL infrastructure
   - Unblocks visual improvements across marketplace

2. **Phase 2** (Week 3-4): Reseller dashboard (2.4)
   - Builds on existing metrics/stats pattern
   - High value for reseller retention
   - Database queries well-defined

3. **Phase 3** (Week 5-6): Reseller discovery (2.5)
   - Depends on reviews table (new)
   - Medium complexity
   - High impact on seller trust

4. **Phase 4** (Week 7-8): Listing moderation (2.2)
   - Most complex (inactivity job, trust score algorithm)
   - Depends on all previous features for complete picture
   - Admin-facing (lower immediate impact on sellers/resellers)

### Per-Feature Task Breakdown

**2.2 - Listing Moderation (8-10 tasks)**
- T-001: Create moderationFlags and moderationActions tables
- T-002: Implement trust score calculation algorithm
- T-003: Build "Report Listing" modal (frontend)
- T-004: Implement `/api/requests/:id/flag` endpoint
- T-005: Build inactivity detection cron job
- T-006: Create admin moderation queue UI
- T-007: Implement moderation actions endpoints (deactivate, reactivate, message)
- T-008: Wire notifications for all moderation actions
- T-009: Testing (integration tests for moderation flows)
- T-010: Documentation and deployment

**2.3 - Photo Uploads (6-8 tasks)**
- T-001: Extend items schema (certificatePhotos, wardrobePhotos, metadata)
- T-002: Build photo upload UI (drag-drop, preview, reorder)
- T-003: Implement photo metadata submission endpoint
- T-004: Create photo guidance/tips modal
- T-005: Build photo display in item detail (galleries, carousels)
- T-006: Add certificate/wardrobe sections to listing UI
- T-007: Testing (file upload edge cases)
- T-008: Documentation

**2.4 - Reseller Dashboard (7-9 tasks)**
- T-001: Build earnings summary query/aggregation
- T-002: Build activity metrics query
- T-003: Build performance metrics query (conversion, response time, rating)
- T-004: Create dashboard page layout (cards, charts)
- T-005: Implement charts library integration (charts.js or similar)
- T-006: Build filtering/date range selector
- T-007: Add category breakdown and comparisons
- T-008: Testing (metric accuracy validation)
- T-009: Documentation

**2.5 - Reseller Discovery (8-10 tasks)**
- T-001: Create reviews table and schema
- T-002: Build reseller list page with filtering/sorting
- T-003: Build reseller detail page
- T-004: Implement `/api/resellers` endpoint with aggregation
- T-005: Implement `/api/resellers/:id` endpoint
- T-006: Build review submission modal
- T-007: Build admin review approval queue
- T-008: Create regional rankings endpoint and UI
- T-009: Testing (review moderation, regional accuracy)
- T-010: Documentation

---

## Success Criteria (Complete)

### Feature 2.2: Listing Moderation
- [ ] Resellers can flag non-compliant listings with category and comment
- [ ] Admins receive notifications of flagged listings
- [ ] Sellers receive notification when listing flagged
- [ ] Inactivity detection runs daily and deactivates listings with no activity 14+ days
- [ ] Sellers notified when listing deactivated
- [ ] Trust score calculated on-demand, ranges 1-5 stars
- [ ] Admin can view flagged listings with reseller comments
- [ ] Admin can deactivate/reactivate listings manually
- [ ] Moderation action history logged in database
- [ ] All moderation data testable via `npm run check` and unit tests

### Feature 2.3: Photo Uploads
- [ ] Sellers can upload 1-5 photos per item via drag-drop UI
- [ ] Photos display in order selected
- [ ] Presigned URL flow works (request URL, upload directly, submit path)
- [ ] Photo metadata stored (type, label, uploadedAt)
- [ ] Luxury item sellers prompted for authenticity certificates
- [ ] Certificate photos stored separately and displayed in certificate section
- [ ] Wardrobe photos optional, up to 3 per item
- [ ] Photos displayed in item detail with lazy-loading
- [ ] Seller guidance tips provided throughout upload flow
- [ ] Max file sizes enforced (10MB individual, 50MB total)
- [ ] Only JPG/PNG accepted (MIME type validation)

### Feature 2.4: Reseller Dashboard
- [ ] Resellers can access dashboard via dedicated page/tab
- [ ] Monthly revenue chart shows last 12 months, sortable by date range
- [ ] Activity metrics displayed: listings created, inquiries, responses, items sold
- [ ] Performance metrics shown: conversion rate, response time, rating
- [ ] Stats updateable via filter (last 30 days, 90 days, 12 months, custom)
- [ ] Category breakdown available (earnings by category)
- [ ] Trends shown with up/down indicators
- [ ] Benchmarks displayed ("Top 20% by response time")
- [ ] Real-time data updates on new transactions (via React Query invalidation)
- [ ] Dashboard loads in < 2 seconds

### Feature 2.5: Reseller Discovery
- [ ] Sellers can view list of active resellers
- [ ] Reseller list filterable by: location, rating, response rate, specialization
- [ ] Reseller list sortable by: rating, response rate, recent activity, proximity
- [ ] Reseller card shows: name, location, rating, stats (listings, response rate, reviews)
- [ ] Reseller detail page shows: profile, stats, specializations, sample listings
- [ ] Testimonials displayed on profile (reviews from sellers)
- [ ] Only verified reviews shown (admin-approved)
- [ ] Regional rankings available, updated weekly
- [ ] After request completion, sellers prompted to review reseller
- [ ] Reseller notified when review published
- [ ] Fake reviews preventable (self-review checks, email verification)

---

## Appendices

### A. Database Schema Changes

```sql
-- Feature 2.2: Moderation
CREATE TABLE moderation_flags (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  reusse_id VARCHAR NOT NULL REFERENCES users(id),
  category VARCHAR(50) NOT NULL, -- prohibited_items, misleading, low_quality, other
  comment TEXT NOT NULL,
  reseller_notes TEXT, -- Admin-only comments
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE moderation_actions (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  admin_id VARCHAR NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL, -- flag, message, reject, deactivate, reactivate
  reason TEXT,
  metadata JSONB, -- Additional data
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE requests ADD COLUMN trust_score NUMERIC(3,2),
                       ADD COLUMN inactive_reason TEXT,
                       ADD COLUMN rejection_reason TEXT,
                       ADD COLUMN status_reason TEXT;

-- Feature 2.3: Photo Uploads
ALTER TABLE items ADD COLUMN certificate_photos TEXT[],
                   ADD COLUMN wardrobe_photos TEXT[];
-- OR extend items.photos to include: { path, type, label, uploadedAt }

-- Feature 2.5: Reviews
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES requests(id),
  seller_id VARCHAR NOT NULL REFERENCES users(id),
  reusse_id VARCHAR NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  item_condition_rating INTEGER CHECK (item_condition_rating >= 1 AND item_condition_rating <= 5),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN bio TEXT,
                       ADD COLUMN category_preferences TEXT[],
                       ADD COLUMN specializations TEXT[];
```

### B. Environment Variables

No new env variables needed (all use existing infrastructure).

### C. Testing Strategy

**Unit Tests:**
- Trust score calculation with various seller histories
- Activity detection (14-day threshold)
- Metric aggregations (earnings, conversion rate, response time)
- Regional ranking ordering

**Integration Tests:**
- Full moderation workflow: flag → admin review → deactivation → seller notification
- Photo upload flow: presigned URL → upload → metadata submit
- Dashboard data consistency: metrics match underlying transactions
- Review system: submission → admin approval → publication → rating update

**End-to-End Tests:**
- Seller discovers reseller via list → views profile → accepts request → completes → reviews
- Reseller accepts request → completes → sees earnings in dashboard → views on profile
- Admin flags listing → seller sees notification → reactivates → trust score improves

---

## Conclusion

These four features work together to build a more trustworthy, transparent, and valuable marketplace:

- **Moderation (2.2)** ensures content quality and safety
- **Photos (2.3)** provide visual proof and build buyer confidence
- **Dashboard (2.4)** empowers resellers with data and business tools
- **Discovery (2.5)** helps sellers find great resellers and resellers build reputation

Implement in order (2.3 → 2.4 → 2.5 → 2.2) for smooth integration and continuous value delivery.
