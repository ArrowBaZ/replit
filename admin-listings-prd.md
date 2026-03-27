---
tags: [copilot, prd]
feature: admin-listings-view
status: active
date: 2026-03-25
type: feat
---

# 2.6 Admin Listing View

Create a dedicated dashboard for admin members to list all seller requests/listings with data necessary for content moderation and platform governance.

---

## Overview

Currently, the admin dashboard displays high-level statistics about requests but lacks granular visibility into individual seller listings for moderation purposes. Admins need a dedicated view to monitor all seller requests, identify suspicious activity, flag content for review, communicate with sellers, and enforce platform policies by rejecting inappropriate requests.

This feature adds a new **Admin Requests** page that displays all seller requests in a filterable list with actions for moderation (flag for review, request modifications, reject request).

---

## Problem Statement / Motivation

**Why this matters:**
1. **Content Quality**: Platform reputation depends on quality of listings. Admins need visibility to identify and address low-quality or inappropriate requests
2. **Policy Enforcement**: Sellers may violate guidelines (prohibited items, unrealistic pricing, unclear descriptions). Admins need tools to enforce rules
3. **Fraud Prevention**: Monitor for suspicious patterns (multiple requests from same seller, unusual valuation, suspicious timing)
4. **Seller Communication**: Flag requests that need modifications rather than immediate rejection, supporting seller education
5. **Regulatory Compliance**: Maintain audit trail of moderation actions for legal/compliance purposes

**Current gaps:**
- `/api/admin/stats` shows count of "active requests" but no detail view
- No way to list all requests from all sellers
- No moderation capabilities (flag, request modifications, reject)
- Admins cannot communicate issues to sellers without external tools

---

## Proposed Solution

Create a new admin-only page `/admin-requests` that:

1. **Lists all seller requests** with key metadata:
   - Seller name, profile image, location
   - Request status (pending, matched, scheduled, in_progress, completed, cancelled)
   - Item count and estimated value
   - Service type and categories
   - Request age (created date)
   - Assigned reusse (if matched)

2. **Filters by status** to focus on specific request types:
   - Pending: New requests awaiting first engagement
   - Matched/Active: Ongoing requests with assigned reusses
   - Completed: Successfully completed requests
   - Cancelled: Abandoned requests
   - Flagged: Requests marked for review

3. **Moderation actions** available from the list:
   - **Flag for Review**: Mark request as requiring manual investigation (adds "flagged" status)
   - **Request Modifications**: Send message to seller asking them to update specific aspects (opens modal with message template)
   - **Reject Request**: Cancel the entire request, notify seller, and archive (changes status to "rejected")

4. **Search & Sort**:
   - Filter by status dropdown
   - Optional: Search by seller name (client-side)
   - Sort by created date (newest/oldest)

---

## Technical Considerations

### Architecture Impacts
- **New page**: `/client/src/pages/admin-requests.tsx` (follows existing pattern)
- **New API endpoint**: `GET /api/admin/requests` to fetch paginated/filtered requests
- **New endpoints for actions**:
  - `POST /api/admin/requests/:id/flag` - Mark request as flagged
  - `POST /api/admin/requests/:id/message` - Send modification request to seller
  - `PATCH /api/admin/requests/:id` - Update request status (reject, etc.)
- **Database consideration**: May need to add `flagged` status to requests table or create separate `moderation_flags` table
- **Notification system**: Reuse existing notification pattern to inform sellers of moderation actions

### Performance Implications
- **Data volume**: Expected 100-1000s of requests. Client-side filtering acceptable, but API should support pagination if volume grows
- **Query optimization**: Need indexes on `status`, `sellerId`, `createdAt` (likely already exist for requests-list.tsx)
- **Real-time updates**: Not required; polling is acceptable for admin use case

### Security Considerations
- **Role check**: Must enforce `requireAdmin` middleware on all new endpoints
- **Data exposure**: Only admins should see detailed request data including seller contact info
- **Audit trail**: Log all moderation actions (flag, reject, message) with admin ID and timestamp
- **Notification content**: When rejecting, include reason to help sellers understand policy violations

---

## System-Wide Impact

### Interaction Graph
When admin takes moderation action:
1. API handler validates admin role and request ownership
2. Updates `requests` table with new status/flag
3. Creates **Notification** record for seller with action reason
4. (Optional) Creates **ModeratinonLog** record for audit trail
5. Frontend invalidates React Query cache, refreshing the list

### Error Propagation
- Invalid request ID → 404 response
- Non-admin user → 403 Forbidden
- Database errors → 500 Server Error (log & notify ops)
- Seller should be notified via notification system on success

### State Lifecycle Risks
- **Partial failure**: If notification creation fails but request is updated, seller won't know about moderation
  - Mitigation: Wrap both operations in transaction or retry notification
- **Race condition**: Multiple admins rejecting same request simultaneously
  - Mitigation: Use optimistic locking or check request status before updating

### API Surface Parity
- Admin users should also see same requests through `GET /api/requests` endpoint (if they query it)
- Consider whether sellers should see moderation flags on their own requests

---

## Success Metrics

How we measure this feature's success:

1. **Adoption**: Admins actively using the request list view (track page visits in analytics)
2. **Moderation velocity**: Average time from request creation to moderation action (target: < 24 hours for flagged items)
3. **Quality**: Reduction in abuse/inappropriate requests through proactive flagging
4. **Seller satisfaction**: Sellers understand rejection reasons when provided feedback message
5. **Audit completeness**: All moderation actions logged and retrievable for compliance review

---

## Dependencies & Risks

### External Dependencies
- React Query (already present)
- shadcn/ui components (Card, Badge, Button, Dropdown)
- Icons from lucide-react
- i18n library for translations (t() helper)

### Internal Dependencies
- `storage.getAdminRequests()` or `getRequests()` methods in storage.ts
- Existing notification system (`storage.createNotification()`)
- User profile fetching to display seller info
- Possibly new database table for `moderation_actions` audit log

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| High volume of requests causes performance degradation | Slow page load, admin can't work efficiently | Implement server-side pagination (limit 20-50 per page) |
| Admin accidentally rejects active request with matched reusse | Disrupts transaction, seller upset | Add confirmation dialog: "This request has 1 matched reusse. Continue?" |
| Multiple admins flag same request repeatedly | Confusion about who's investigating | Add admin ID to flag, show "flagged by [admin name] on [date]" |
| Sellers not receiving notification of rejection | Sellers confused, support tickets | Verify notification creation in integration tests, add retry logic |
| Audit trail incomplete due to missing logs | Non-compliant for legal review | Automatically log all moderation actions in `moderation_actions` table |
| Seller receives empty/unclear rejection message | Seller can't improve, repeats offense | Template message with checkboxes for common issues |

---

## Technical Approach

### Architecture

**Frontend Page Structure:**
```
AdminRequestsPage
├── Header (title + subtitle)
├── Stats Card (optional: pending requests, flagged count, avg resolution time)
├── Filter Section
│   ├── Status dropdown (pending, matched, scheduled, in_progress, completed, cancelled, flagged)
│   └── (Optional) Seller search input
├── Request List
│   ├── Card per request
│   │   ├── Seller info (avatar, name, location)
│   │   ├── Request metadata (item count, value, categories)
│   │   ├── Status badge
│   │   ├── Age (created date)
│   │   └── Action buttons: Flag, Message, Reject, View Detail
│   └── Empty state (no requests match filter)
└── Modals
    ├── Message modal (pre-populated template, text area for custom message)
    └── Reject modal (confirmation + reason dropdown)
```

**Backend API Structure:**
```
GET /api/admin/requests
  ├─ Query params: status (optional), page (optional), limit (optional)
  ├─ Response: { requests: [], total: number, page: number }
  └─ Requires: requireAdmin middleware

POST /api/admin/requests/:id/flag
  ├─ Body: { reason: string (optional) }
  ├─ Response: { request: Request, notification: Notification }
  └─ Action: Update requests.status = 'flagged', create seller notification

POST /api/admin/requests/:id/message
  ├─ Body: { message: string, template_key: string (optional) }
  ├─ Response: { notification: Notification }
  └─ Action: Create notification with message, don't change request status

PATCH /api/admin/requests/:id
  ├─ Body: { status: string, reason: string (optional) }
  ├─ Response: { request: Request, notification: Notification }
  └─ Action: Update status to 'rejected'/'cancelled', create notification, log moderation action
```

**Data Models:**
```typescript
// Request (existing, may need new field)
interface Request {
  id: number;
  sellerId: string;
  status: 'pending' | 'matched' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'flagged';  // Add 'flagged'
  serviceType: string;
  itemCount: number;
  estimatedValue: number;
  categories: string[];
  meetingLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

// New table for audit trail (optional but recommended)
interface ModerationAction {
  id: number;
  requestId: number;
  adminId: string;
  action: 'flag' | 'message' | 'reject' | 'approve';
  reason: string;
  metadata: { message?: string; rejectReason?: string };
  createdAt: Date;
}
```

---

### Implementation Phases

#### Phase 1: Foundation (API & Data)
**Tasks:**
1. Add 'flagged' to request status enum in schema.ts
2. Create `GET /api/admin/requests` endpoint in routes.ts (returns all requests, no actions yet)
3. Implement `storage.getAdminRequests()` method in storage.ts
4. Create `moderation_actions` table schema (for audit trail)
5. Add `storage.logModerationAction()` method

**Acceptance Criteria:**
- [ ] API returns list of all requests with seller info (name, image, location)
- [ ] Endpoint enforces `requireAdmin` middleware
- [ ] Data includes: id, sellerId, status, itemCount, estimatedValue, categories, createdAt, seller profile
- [ ] Pagination works (limit, offset parameters)
- [ ] Unit tests pass for storage methods
- [ ] No database errors on large datasets (test with 1000+ requests)

**Database Commands:**
```bash
npm run db:push  # Push moderation_actions table
```

#### Phase 2: Core UI & Read Operations
**Tasks:**
1. Create `/client/src/pages/admin-requests.tsx` page
2. Implement request list component with Card-based UI
3. Add status filter dropdown
4. Add seller info display (avatar, name, location)
5. Implement loading states and empty states
6. Wire up React Query to `GET /api/admin/requests`
7. Add i18n translations for labels

**Acceptance Criteria:**
- [ ] Page loads and displays all requests in card list
- [ ] Status filter dropdown works (shows only filtered requests)
- [ ] Seller info displays correctly with fallback avatar
- [ ] Loading skeleton shows while fetching
- [ ] Empty state displays when no requests match filter
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] All labels translated via i18n
- [ ] `npm run check` passes (TypeScript)
- [ ] Component has test file (stubs OK, basic coverage)

**Visual Requirements:**
- Follow existing admin-dashboard.tsx card styling
- Use statusColors from requests-list.tsx for consistency
- Icons: Package (request), Shirt (items), MapPin (location)
- Buttons: Flag (amber), Message (blue), Reject (red/destructive)

#### Phase 3: Moderation Actions
**Tasks:**
1. Implement `POST /api/admin/requests/:id/flag` endpoint
2. Implement `POST /api/admin/requests/:id/message` endpoint
3. Implement `PATCH /api/admin/requests/:id` endpoint (reject)
4. Create Flag modal in UI
5. Create Message modal in UI with template suggestions
6. Create Reject confirmation modal with reason dropdown
7. Wire mutations to React Query for automatic cache invalidation
8. Add toast notifications for feedback

**Acceptance Criteria:**
- [ ] Flag action: Request status updated to 'flagged', seller notified
- [ ] Message action: Notification created with custom message, status unchanged
- [ ] Reject action: Request status changed to 'cancelled', seller notified with reason
- [ ] All moderation actions logged in moderation_actions table
- [ ] Modals confirm before executing destructive actions
- [ ] Toast notifications appear for success/error feedback
- [ ] Reject action prevents moderation if request is 'matched' (shows warning)
- [ ] Cache invalidation works (list updates after action)
- [ ] `npm run check` passes
- [ ] Integration tests for each action pass

**Database Commands:**
- No schema changes needed

#### Phase 4: Polish & Optimization
**Tasks:**
1. Add server-side pagination if needed (benchmark first)
2. Add audit trail view (optional: let admins see who flagged what, when)
3. Add success/failure metrics logging
4. Optimize queries (add database indexes if needed)
5. Add accessibility (ARIA labels, keyboard navigation)
6. Performance testing with large datasets
7. Security review (role checks, data exposure)
8. Documentation update (README, API docs)

**Acceptance Criteria:**
- [ ] Page loads < 2s with 1000 requests
- [ ] All moderation actions logged and auditable
- [ ] Admin can view moderation action history per request
- [ ] Page accessible (a11y scan passes)
- [ ] No console errors or warnings
- [ ] Security audit passes (no unauthorized data exposure)
- [ ] Documentation updated with new endpoints
- [ ] Deployment notes added to README if needed

---

## Alternative Approaches Considered

### Option A: Add Tab to Existing admin-dashboard.tsx
**Pros:**
- Reuse existing page structure
- Unified admin experience
- Fewer files to maintain

**Cons:**
- Tab could become cluttered (already has Applications + Users tabs)
- Request list is large and might need its own page space
- Harder to extend in future if requests need sub-pages/drilldown

**Rejected because:** Separate page keeps concerns clean and allows growth.

### Option B: Bulk Actions on Requests
**Idea**: Allow selecting multiple requests and applying action to all (batch flag, batch reject)

**Pros:**
- Faster moderation at scale
- Useful for coordinated abuse response

**Cons:**
- Higher risk of accidental bulk rejection
- Requires checkbox UI
- More complex error handling

**Decision**: Defer to Phase 2+ if admins request batch operations. Start with single-action moderation.

### Option C: Integrate Item-Level Moderation
**Idea**: Show individual items instead of requests, allow approving/rejecting items

**Pros:**
- More granular control
- Admins can approve "good" items while rejecting "bad" ones in same request

**Cons:**
- More complex UI (items nested under requests)
- Overlaps with existing seller pricing approval workflow
- Scope creep

**Decision**: Keep scope focused on **request-level** moderation only (reject entire request, not individual items). Item approval is already handled by reusse pricing workflow.

---

## Integration Test Scenarios

These are cross-layer scenarios that unit tests won't catch:

### Scenario 1: Admin Flags Suspicious Request
**Flow:**
1. Admin views requests list, sees new request from seller with suspicious estimated value
2. Clicks "Flag for Review" on request
3. Modal appears asking for reason
4. Admin selects "High valuation without supporting details"
5. Modal shows "Flagged" confirmation
6. Request card updates to show "flagged" status in gold/amber color
7. Seller receives notification: "Your request [ID] has been flagged for review. Reason: High valuation..."

**Assertions:**
- Request status in DB = 'flagged'
- Notification created for seller with reason
- ModerationAction logged with admin ID
- React Query cache invalidated, UI updated
- Toast shows "Request flagged successfully"

### Scenario 2: Admin Rejects Request with Matched Reusse
**Flow:**
1. Admin views request that is 'matched' (has reusse assigned)
2. Clicks "Reject Request"
3. Confirmation modal appears with warning: "This request has 1 matched reusse. Rejecting will cancel their assignment."
4. Admin enters reason "Prohibited items detected in photos"
5. Clicks confirm
6. Request status changes to 'cancelled' (or 'rejected')
7. Both seller AND reusse notified about cancellation with reason

**Assertions:**
- Request status = 'cancelled'/'rejected'
- ReusseId cleared or preserved (PM decision)
- Both seller & reusse notifications created
- Moderation action logged
- Request removed from "matched" filter view

### Scenario 3: Admin Sends Modification Request Message
**Flow:**
1. Admin sees request with vague item descriptions
2. Clicks "Request Modifications"
3. Modal shows template with checkboxes:
   - [ ] Add more photos (min 3 per item)
   - [ ] Clarify item condition
   - [ ] Add brand information
   - [ ] Add more details to description
4. Admin can add custom message: "Please provide better photos, items look worn"
5. Clicks "Send"
6. Seller receives notification with combined message
7. Request status unchanged (still 'pending', 'matched', etc.)

**Assertions:**
- Notification created with templated + custom message
- Request status NOT changed
- Seller can view notification and modify request
- Admin can send multiple messages to same request

### Scenario 4: List Filters by Status Correctly
**Flow:**
1. Admin lands on admin-requests page, sees 50 total requests
2. Filters by status='flagged', sees 3 requests
3. Filters by status='pending', sees 15 requests
4. Filters by status='matched', sees 20 requests
5. Clears filter (shows all again), sees 50 requests

**Assertions:**
- Filter query param updated in URL
- Only matching requests displayed
- Count accurate
- Filter persists on page reload
- No missing/extra requests

### Scenario 5: Authorization: Non-Admin Cannot Access
**Flow:**
1. Logged-in seller visits `/admin-requests`
2. Gets redirected to forbidden page OR 403 error
3. Cannot access data via `/api/admin/requests`

**Assertions:**
- requireAdmin middleware blocks access
- No request data leaked
- User redirected or sees error message

---

## Risk Analysis & Mitigation

### Risk 1: Accidental Rejection of Valid Requests
**Likelihood**: Medium
**Impact**: High (seller loses opportunity, reputational damage, support tickets)
**Mitigation**:
- [ ] Confirmation dialog before rejection with request details shown
- [ ] Warning if request is 'matched' with active reusse
- [ ] Allow "reason" field in rejection (shown to seller)
- [ ] Admins trained on policy before deployment
- [ ] Rollback plan: Ability to un-reject requests within 24 hours (soft delete)

### Risk 2: Notification System Fails Silently
**Likelihood**: Low
**Impact**: High (sellers unaware of moderation, confused)
**Mitigation**:
- [ ] Wrap moderation action + notification in DB transaction
- [ ] Retry notification creation if fails
- [ ] Admin alerted if notification fails (error in logs)
- [ ] Integration test confirms notification always created

### Risk 3: Performance Degrades with Many Requests
**Likelihood**: Medium (100+ active admins, 10,000+ requests)
**Impact**: Medium (slow page load, admin inefficiency)
**Mitigation**:
- [ ] Implement server-side pagination (20-50 per page) from day 1
- [ ] Add database indexes on status, createdAt, sellerId
- [ ] Monitor query performance in staging
- [ ] Benchmark with realistic data volumes before release

### Risk 4: Admin Sees Seller PII Beyond Necessary
**Likelihood**: Low
**Impact**: Medium (privacy concern, compliance risk)
**Mitigation**:
- [ ] Only expose name, location, profile image (no email, phone without reason)
- [ ] Separate "Seller Contact" view if admin needs to reach them
- [ ] Audit what data API returns vs. what's displayed
- [ ] Security review before deployment

### Risk 5: Duplicate Moderation Actions (Race Condition)
**Likelihood**: Low (multiple admins flagging same request)
**Impact**: Low (confusion, not data corruption)
**Mitigation**:
- [ ] Idempotent flag action (flag already-flagged request = no-op)
- [ ] Show who flagged + when in request card
- [ ] Moderation log shows all actions taken

---

## Acceptance Criteria (Complete)

### Backend

- [ ] `GET /api/admin/requests` endpoint returns paginated list of all seller requests with seller profile info
- [ ] Endpoint enforces `requireAdmin` middleware
- [ ] Response includes: id, sellerId, seller name, seller avatar, status, itemCount, estimatedValue, categories, meetingLocation, createdAt, reusseId (if matched)
- [ ] Supports query params: `status` (filter), `page` (default 1), `limit` (default 20, max 100)
- [ ] Database has moderation_actions table for audit trail
- [ ] `POST /api/admin/requests/:id/flag` endpoint:
  - [ ] Updates request status to 'flagged'
  - [ ] Creates notification for seller with optional reason
  - [ ] Logs action in moderation_actions table
  - [ ] Returns updated request object
- [ ] `POST /api/admin/requests/:id/message` endpoint:
  - [ ] Does NOT change request status
  - [ ] Creates notification with custom message
  - [ ] Logs action with message content
  - [ ] Returns notification object
- [ ] `PATCH /api/admin/requests/:id` endpoint (reject):
  - [ ] Updates status to 'cancelled' or 'rejected' (PM decision)
  - [ ] Creates notification with reason
  - [ ] Validates request is not 'matched' (or warns admin)
  - [ ] Logs moderation action
  - [ ] Returns updated request object
- [ ] All endpoints validate admin role (requireAdmin middleware)
- [ ] All endpoints handle error cases gracefully (404, 500, etc.)
- [ ] Database migration creates moderation_actions table
- [ ] `npm run check` passes
- [ ] Unit tests cover storage methods: `getAdminRequests`, `flagRequest`, `messageRequest`, `rejectRequest`
- [ ] No security vulnerabilities exposed (role checks, data exposure audit)

### Frontend

- [ ] New page `/admin-requests` created at `/client/src/pages/admin-requests.tsx`
- [ ] Page displays list of seller requests in Card-based layout
- [ ] Each request card shows:
  - [ ] Seller avatar + name + location
  - [ ] Item count + estimated value
  - [ ] Categories
  - [ ] Status badge with color-coded styling
  - [ ] Request age (e.g., "Created 2 days ago")
  - [ ] Assigned reusse name (if matched)
- [ ] Status filter dropdown works (pending, matched, scheduled, in_progress, completed, cancelled, flagged)
- [ ] Filtered results update immediately
- [ ] Loading state shows skeleton cards while fetching
- [ ] Empty state displays when no requests match filter
- [ ] Modals for actions:
  - [ ] Flag modal: Reason dropdown + optional notes, confirmation
  - [ ] Message modal: Template suggestions + custom message text area, send button
  - [ ] Reject modal: Confirmation with request summary + reason dropdown
- [ ] All buttons have loading state while mutation is pending
- [ ] Toast notifications appear on success/error
- [ ] Cache invalidation works (React Query refetches list after action)
- [ ] All text is translatable via i18n
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] `npm run check` passes (TypeScript)
- [ ] Component tests cover:
  - [ ] List rendering with mock data
  - [ ] Filter dropdown functionality
  - [ ] Modal appearances
  - [ ] Action button clicks
  - [ ] Empty/loading states
- [ ] `npm run dev` starts without errors
- [ ] Page works on Chrome, Firefox, Safari, Edge

### Integration

- [ ] Admin can flag request and seller receives notification
- [ ] Admin can reject request and seller receives notification with reason
- [ ] Admin can message seller and seller receives notification
- [ ] Moderation action history is logged and auditable
- [ ] Performance acceptable with 1000+ requests (< 2s page load)
- [ ] No console errors or warnings
- [ ] Admin cannot access page if not logged in (redirected or 403)
- [ ] Admin cannot access page if role is not 'admin' (401/403)
- [ ] Non-admin cannot call moderation endpoints directly (401/403)
- [ ] Seller data exposure audit passes (no unintended PII leakage)

---

## Dependencies

### Database
- Existing: requests, profiles, users tables
- New: moderation_actions table (for audit trail)

### APIs
- Existing: isAuthenticated, requireAdmin middleware
- Existing: storage.getProfile, storage.updateRequest, storage.createNotification
- New: storage.getAdminRequests, storage.logModerationAction, storage.flagRequest

### UI Components
- Existing: Card, CardContent (shadcn/ui)
- Existing: Badge, Button, Skeleton, Select/Dropdown
- Existing: Avatar, AvatarImage, AvatarFallback
- Existing: Icons from lucide-react

### External
- React Query (useQuery, useMutation, queryClient.invalidateQueries)
- i18n library (useI18n, t())
- Tailwind CSS (styling)

---

## Next Steps

1. **Approval**: Review PRD with team, confirm scope and timeline
2. **Database**: Create moderation_actions table migration
3. **Backend Phase**: Build API endpoints (Phase 1)
4. **Frontend Phase**: Build request list UI and modals (Phase 2-3)
5. **Testing**: Integration tests for end-to-end moderation workflows
6. **Deployment**: Feature flag if needed, monitor adoption and errors
7. **Feedback**: Gather admin feedback, iterate on filtering/actions if needed
