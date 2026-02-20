# SELLZY MVP COMPLETION PROMPTS FOR REPLIT

## Overview

This document contains **50 sequential prompts** to complete the Sellzy MVP, prioritized by criticality and dependencies. These prompts build upon the existing landing page and will create a fully functional marketplace platform.

**Current Status:** Landing page complete (~7% done)  
**Target:** Full MVP with core marketplace functionality  
**Estimated Timeline:** 20-24 weeks following these prompts

---

## 📋 How to Use These Prompts

1. **Execute in order** - Each prompt builds on previous work
2. **Complete one fully** before moving to the next
3. **Test after each prompt** - Verify functionality works
4. **Commit to git** after each major feature
5. **Adjust as needed** based on Replit's implementation

---

## 🔴 PHASE 1: BACKEND FOUNDATION (Week 1-2)

### Prompt 1: Verify and Complete Database Schema

```
Review the current database schema and ensure all required Prisma models are properly defined and migrated:

1. Verify these models exist with all required fields:
   - User (id, email, password, role, isEmailVerified, createdAt, updatedAt)
   - Profile (userId, firstName, lastName, phone, address, city, postalCode, department, latitude, longitude)
   - Request (sellerId, reusseId, serviceType, status, itemCount, estimatedValue)
   - Meeting (requestId, scheduledDate, location, status)
   - Item (requestId, sellerId, reusseId, title, description, brand, size, category, condition, photos, minPrice, maxPrice, status)
   - Transaction (type, userId, itemId, amount, status, stripePaymentId)
   - Commission (itemId, sellerId, reusseId, salePrice, sellerAmount, reusseAmount, platformAmount)
   - Message (senderId, receiverId, requestId, content, isRead)
   - Notification (userId, type, title, message, isRead)

2. Add any missing models or fields from the list above

3. Create proper relations between models:
   - User → Profile (one-to-one)
   - User → Requests (one-to-many for sellers and Reusses)
   - Request → Meeting (one-to-one)
   - Request → Items (one-to-many)
   - Item → Transactions (one-to-many)
   - User → Messages (one-to-many for sender and receiver)

4. Add indexes for performance:
   - User.email (unique)
   - Profile.userId (unique)
   - Request.sellerId, Request.reusseId
   - Item.sellerId, Item.reusseId
   - Message.senderId, Message.receiverId

5. Run migrations and generate Prisma Client

6. Create seed data with:
   - 2 test sellers
   - 2 test Reusses (approved)
   - 1 admin user
   - Sample requests and items

Provide the complete schema.prisma file and confirm all migrations are successful.
```

### Prompt 2: API Routes Structure and Middleware

```
Set up the backend API structure with proper routing and middleware:

1. Create the following route files in server/src/routes/:
   - auth.routes.ts (authentication endpoints)
   - profile.routes.ts (profile management)
   - request.routes.ts (request CRUD)
   - item.routes.ts (item management)
   - message.routes.ts (messaging)
   - payment.routes.ts (Stripe integration)
   - admin.routes.ts (admin operations)

2. Create middleware in server/src/middleware/:
   - auth.middleware.ts:
     - authenticate: Verify JWT or Replit session
     - requireRole: Check user role (SELLER, REUSSE, ADMIN)
     - attachUser: Add user object to request
   
   - validation.middleware.ts:
     - validateRequest: Validate request body with Zod schemas
     - validateParams: Validate URL parameters
   
   - error.middleware.ts:
     - errorHandler: Centralized error handling
     - notFound: 404 handler

3. Set up main server file (server/src/index.ts):
   - Express app configuration
   - CORS setup (allow frontend URL)
   - JSON body parser
   - Route mounting
   - Error handling middleware
   - Start server on port 3000

4. Create response utilities (server/src/utils/response.ts):
   - success(data, message, statusCode)
   - error(message, statusCode, errors)
   - paginated(data, page, limit, total)

5. Test that server starts without errors and all routes are registered

Confirm the API structure is ready and provide a list of all available endpoints.
```

### Prompt 3: Authentication System - Custom JWT

```
Implement a complete authentication system that works alongside or replaces Replit OAuth:

1. Create authentication utilities (server/src/utils/auth.ts):
   - hashPassword(password): Hash with bcrypt (10 rounds)
   - comparePassword(password, hash): Verify password
   - generateToken(userId, email, role): Create JWT (7 days expiry)
   - verifyToken(token): Decode and validate JWT
   - Use JWT_SECRET from environment variables

2. Create auth controller (server/src/controllers/auth.controller.ts):
   
   - registerSeller(req, res):
     - Validate: email, password, firstName, lastName, phone, address, city, postalCode, department
     - Check if email exists
     - Hash password
     - Create User with role SELLER
     - Create Profile with address details
     - Generate JWT token
     - Return user data (without password) and token
   
   - registerReusse(req, res):
     - Same as seller PLUS bio, experience fields
     - Set role to REUSSE
     - Set Profile status to PENDING (requires approval)
     - Send notification to admins
     - Return success message about pending approval
   
   - login(req, res):
     - Validate email and password
     - Find user by email
     - Compare password
     - For REUSSE: check if status is APPROVED
     - Generate token
     - Return user data and token
   
   - logout(req, res):
     - Clear any session data
     - Return success message
   
   - getCurrentUser(req, res):
     - Return authenticated user with profile

3. Create auth routes (server/src/routes/auth.routes.ts):
   - POST /api/auth/register/seller
   - POST /api/auth/register/reusse
   - POST /api/auth/login
   - POST /api/auth/logout
   - GET /api/auth/me (protected route)

4. Add validation schemas using Zod for all endpoints

5. Test all endpoints with sample data

Provide examples of request/response for each endpoint.
```

---

## 🔴 PHASE 2: SELLER DASHBOARD (Week 3-5)

### Prompt 4: Seller Dashboard - Main Layout

```
Create the seller dashboard with main layout and navigation:

1. Create dashboard layout component (client/src/layouts/SellerDashboardLayout.tsx):
   - Top navigation bar with:
     - Sellzy logo
     - User profile dropdown (profile, settings, logout)
     - Notifications bell icon
   - Sidebar navigation:
     - Dashboard (overview)
     - My Requests
     - My Items
     - Messages
     - Earnings
     - Settings
   - Main content area
   - Responsive design (collapsible sidebar on mobile)

2. Create dashboard home page (client/src/pages/seller/Dashboard.tsx):
   - Welcome message with user's first name
   - Statistics cards:
     - Total Requests (count and status breakdown)
     - Items Listed (count)
     - Items Sold (count)
     - Total Earnings (€ amount)
   - Recent activity feed (last 5 requests/items)
   - Quick action buttons:
     - "Create New Request"
     - "View All Items"
     - "Contact Support"

3. Create protected route wrapper:
   - Redirect to login if not authenticated
   - Check if user role is SELLER
   - Redirect to appropriate dashboard based on role

4. Style with Tailwind CSS using the green color scheme from the logo
5. Add loading states and skeleton screens
6. Implement responsive design for mobile/tablet/desktop

Test the dashboard layout and navigation flow.
```

### Prompt 5: Request Creation - Service Selection

```
Create the request creation flow starting with service selection:

1. Create service selection page (client/src/pages/seller/CreateRequest.tsx):
   
   Step 1 - Service Type Selection:
   - Display 3 service options as cards:
     
     **CLASSIC** (Most Popular):
     - Description: "Standard resale service with flexible timeline"
     - Timeline: 2-4 weeks
     - Commission: 30% of sale price
     - Best for: Regular wardrobe clearout
     
     **EXPRESS**:
     - Description: "Fast-track service for quick sales"
     - Timeline: 1 week
     - Commission: 35% of sale price
     - Best for: Urgent sales, seasonal items
     
     **SOS DRESSING**:
     - Description: "Complete wardrobe consultation and resale"
     - Timeline: 1-2 days for pickup, 3-4 weeks for sales
     - Commission: 40% of sale price
     - Best for: Major wardrobe overhaul

   - Each card should have:
     - Icon/illustration
     - Service name
     - Description
     - Timeline
     - Commission rate
     - "Select" button
   
   - Highlight recommended service based on item count (if provided)

2. Add service comparison tooltip/modal
3. Store selected service in form state
4. Add "Next" button to proceed to item details
5. Style with Tailwind CSS, make cards interactive with hover effects

Test service selection and state management.
```

### Prompt 6: Request Creation - Item Details Form

```
Continue the request creation flow with item details:

1. Create item details form (Step 2 of CreateRequest.tsx):
   
   Form fields:
   - Item count (number input, required, min: 1)
   - Estimated total value (€, optional, with helper text: "Approximate original purchase value")
   - Item categories (multi-select checkboxes):
     - Clothing
     - Shoes
     - Accessories
     - Bags
     - Other
   - Condition (select dropdown):
     - New with tags
     - Excellent (like new)
     - Good (minor wear)
     - Fair (visible wear)
   - Brands (text input, optional, placeholder: "e.g., Zara, H&M, Nike")
   - Additional notes (textarea, optional, placeholder: "Any special instructions or details about your items")

2. Add form validation:
   - Item count must be at least 1
   - At least one category must be selected
   - Condition is required

3. Add helpful tooltips/info icons:
   - Item count: "Approximate number of items you want to sell"
   - Estimated value: "Helps us match you with the right Reusse"
   - Condition: "Be honest - it helps set realistic prices"

4. Progress indicator showing Step 2 of 4
5. "Back" and "Next" buttons
6. Save form data to state

Test form validation and navigation between steps.
```

### Prompt 7: Request Creation - Meeting Preferences

```
Add meeting preferences step to request creation:

1. Create meeting preferences form (Step 3 of CreateRequest.tsx):
   
   Form fields:
   - Preferred meeting location (radio buttons):
     - My home address (show saved address from profile)
     - Reusse's location (will be determined after matching)
     - Public place (coffee shop, etc.)
     - Other (text input for custom location)
   
   - Preferred date range (date picker):
     - Start date (earliest availability)
     - End date (latest availability)
     - Helper text: "We'll coordinate the exact time with your matched Reusse"
   
   - Preferred time slots (checkboxes):
     - Morning (9am - 12pm)
     - Afternoon (12pm - 5pm)
     - Evening (5pm - 8pm)
     - Flexible
   
   - Special requirements (textarea, optional):
     - Parking availability
     - Accessibility needs
     - Other notes

2. If "My home address" is selected, display the address from profile
3. If address is not in profile, show form to add it
4. Validate that at least one time slot is selected
5. Progress indicator showing Step 3 of 4
6. "Back" and "Next" buttons

Test meeting preferences form and validation.
```

### Prompt 8: Request Creation - Review and Submit

```
Complete the request creation flow with review and submission:

1. Create review step (Step 4 of CreateRequest.tsx):
   
   Display summary of all entered information:
   - Service Type (with icon and name)
   - Item Details:
     - Count
     - Estimated value
     - Categories
     - Condition
     - Brands
   - Meeting Preferences:
     - Location
     - Date range
     - Time slots
     - Special requirements
   - Expected commission rate
   - Estimated timeline
   
   Add "Edit" buttons next to each section to go back and modify

2. Terms and conditions:
   - Checkbox: "I agree to the Terms of Service and commission structure"
   - Link to terms (opens in modal or new tab)

3. Submit button:
   - "Submit Request" (primary button, disabled until T&C accepted)
   - Loading state during submission
   - Success message after submission
   - Redirect to request details page

4. Create API endpoint (server/src/routes/request.routes.ts):
   - POST /api/requests
   - Validate all required fields
   - Create Request record with status PENDING
   - Create initial Notification for seller
   - Return created request with ID

5. Handle errors:
   - Network errors
   - Validation errors
   - Display error messages to user

6. After successful submission:
   - Show success modal: "Request submitted! We're finding the perfect Reusse for you."
   - Redirect to "My Requests" page after 3 seconds

Test the complete request creation flow from start to finish.
```

### Prompt 9: My Requests Page - List View

```
Create the "My Requests" page for sellers to view all their requests:

1. Create requests list page (client/src/pages/seller/MyRequests.tsx):
   
   Page layout:
   - Page title: "My Requests"
   - Filter tabs:
     - All
     - Pending (waiting for Reusse match)
     - Matched (Reusse assigned)
     - Scheduled (meeting scheduled)
     - In Progress (items being sold)
     - Completed
     - Cancelled
   
   - Request cards showing:
     - Request ID (e.g., #REQ-001)
     - Service type badge
     - Status badge (color-coded)
     - Item count
     - Created date
     - Matched Reusse name and photo (if matched)
     - Meeting date (if scheduled)
     - Progress indicator (e.g., "3 of 10 items sold")
     - "View Details" button

2. Empty states:
   - If no requests: "You haven't created any requests yet" with "Create Request" button
   - If no requests in filter: "No [status] requests"

3. Create API endpoint:
   - GET /api/requests/seller/me
   - Query params: status (optional filter)
   - Return paginated list of seller's requests with related data
   - Include Reusse profile data if matched

4. Add loading skeleton while fetching
5. Add error handling
6. Make cards clickable to navigate to request details

Test the requests list with different statuses and filters.
```

### Prompt 10: Request Details Page

```
Create detailed view for individual requests:

1. Create request details page (client/src/pages/seller/RequestDetails.tsx):
   
   Page sections:
   
   **Header:**
   - Request ID and status badge
   - Service type
   - Created date
   - Action buttons (based on status):
     - "Cancel Request" (if PENDING)
     - "Message Reusse" (if MATCHED or later)
     - "Schedule Meeting" (if MATCHED)
     - "View Items" (if IN_PROGRESS or later)
   
   **Request Information:**
   - Service type details
   - Item count and estimated value
   - Categories and condition
   - Brands
   - Meeting preferences
   
   **Matched Reusse (if applicable):**
   - Profile photo
   - Name
     - Rating and review count
   - Experience level
   - Bio
   - "Message" button
   
   **Meeting Details (if scheduled):**
   - Date and time
   - Location
   - Status (Scheduled, Completed, Cancelled)
   - "Reschedule" button
   - "Get Directions" link (if address available)
   
   **Items (if in progress):**
   - List of items with:
     - Photo
     - Title
     - Status (Pending Approval, Approved, Listed, Sold)
     - Price (if approved)
     - Platform listed on
     - Sale date (if sold)
   - Link to "View All Items"
   
   **Timeline:**
   - Activity log showing:
     - Request created
     - Matched with Reusse
     - Meeting scheduled
     - Items approved
     - Items listed
     - Items sold
     - Payment received

2. Create API endpoint:
   - GET /api/requests/:requestId
   - Verify seller owns the request
   - Include all related data (Reusse, Meeting, Items, Timeline)
   - Return 404 if not found, 403 if not authorized

3. Add real-time status updates (polling or WebSocket)
4. Add breadcrumb navigation: Dashboard > My Requests > Request #123

Test request details page with different statuses and scenarios.
```

---

## 🔴 PHASE 3: REUSSE DASHBOARD (Week 6-8)

### Prompt 11: Reusse Dashboard - Main Layout

```
Create the Reusse dashboard with specialized navigation:

1. Create Reusse dashboard layout (client/src/layouts/ReusseDashboardLayout.tsx):
   
   Sidebar navigation:
   - Dashboard (overview)
   - Available Requests (new matches)
   - My Clients (accepted requests)
   - Inventory (all items)
   - Calendar (meetings)
   - Messages
   - Earnings
   - Settings
   
   Top bar:
   - Active requests counter badge
   - Notifications
   - Profile dropdown

2. Create dashboard home page (client/src/pages/reusse/Dashboard.tsx):
   
   Statistics cards:
   - Active Clients (count)
   - Items in Inventory (count)
   - Items Listed This Month (count)
   - Items Sold This Month (count)
   - Total Earnings This Month (€)
   - Average Sale Price (€)
   
   Quick actions:
   - "View Available Requests" (with count badge)
   - "Add New Item"
   - "Schedule Meeting"
   
   Upcoming meetings widget:
   - Next 3 meetings with date, time, client name
   - "View Calendar" link
   
   Recent activity feed:
   - New requests matched
   - Items sold
   - Payments received
   - Messages received

3. Add Reusse-specific color scheme (can use different accent color)
4. Implement responsive design
5. Add loading states

Test Reusse dashboard layout and navigation.
```

### Prompt 12: Available Requests - Matching System

```
Create the request matching and acceptance system for Reusses:

1. Create available requests page (client/src/pages/reusse/AvailableRequests.tsx):
   
   Display matched requests as cards:
   - Request ID
   - Seller name (first name only for privacy)
   - Seller location (city only)
   - Distance from Reusse (calculated)
   - Service type
   - Item count and estimated value
   - Categories
   - Preferred meeting dates
   - Match score indicator (based on distance, experience, etc.)
   - "View Details" and "Accept Request" buttons
   
   Filters:
   - Service type
   - Distance range (5km, 10km, 20km, 50km+)
   - Item count range
   - Sort by: Distance, Date, Item Count

2. Create request detail modal:
   - Full request information
   - Seller profile (limited info)
   - Map showing approximate location
   - Estimated commission earnings
   - "Accept Request" and "Decline" buttons

3. Create API endpoints:
   
   GET /api/requests/available:
   - Find requests with status PENDING
   - Calculate distance from Reusse location
   - Filter by Reusse's service area (if defined)
   - Return sorted by distance
   
   POST /api/requests/:requestId/accept:
   - Verify Reusse is authenticated
   - Check request is still PENDING
   - Update request status to MATCHED
   - Set reusseId to current user
   - Create notifications for both seller and Reusse
   - Send email notifications
   - Return updated request

4. Implement geographic matching algorithm:
   - Calculate distance using Haversine formula
   - Use latitude/longitude from profiles
   - Filter requests within Reusse's preferred radius

5. Add empty state: "No available requests in your area right now"

Test matching system with different locations and filters.
```

### Prompt 13: My Clients Page

```
Create the client management page for Reusses:

1. Create my clients page (client/src/pages/reusse/MyClients.tsx):
   
   Display accepted requests grouped by status:
   - Matched (awaiting meeting)
   - Scheduled (meeting scheduled)
   - In Progress (items being processed)
   - Completed
   
   Client cards showing:
   - Client name and photo
   - Request ID
   - Service type
   - Item count
   - Status
   - Next action required (e.g., "Schedule meeting", "Approve prices", "List items")
   - Meeting date (if scheduled)
   - Items progress (e.g., "5 of 12 items listed")
   - "View Details" button

2. Quick actions on each card:
   - "Message Client"
   - "Schedule Meeting" (if not scheduled)
   - "View Items" (if in progress)
   - "Mark as Complete" (if all items processed)

3. Create API endpoint:
   - GET /api/requests/reusse/me
   - Return all requests where reusseId = current user
   - Include seller profile data
   - Include meeting and items data
   - Filter by status if provided

4. Add search functionality to find clients by name or request ID

5. Add statistics summary at top:
   - Total clients
   - Active clients
   - Completed this month

Test client management page with various request statuses.
```

### Prompt 14: Item Cataloging System

```
Create the item cataloging interface for Reusses to add items:

1. Create add item page (client/src/pages/reusse/AddItem.tsx):
   
   Form sections:
   
   **Basic Information:**
   - Select client/request (dropdown of active requests)
   - Item title (text input, required)
   - Description (textarea, rich text editor)
   - Brand (text input with autocomplete for common brands)
   - Category (select: Clothing, Shoes, Accessories, Bags, Other)
   - Subcategory (dynamic based on category)
   - Size (text input, varies by category)
   - Color (text input or color picker)
   - Condition (select: New with Tags, Excellent, Good, Fair)
   
   **Photos:**
   - Photo upload (drag & drop or click to upload)
   - Support multiple photos (up to 8)
   - Photo preview with reorder capability
   - Crop/rotate tools
   - "Take Photo" button (camera access on mobile)
   
   **Pricing:**
   - Original price (€, optional, for reference)
   - Minimum price (€, required, "Lowest price you'll accept")
   - Maximum price (€, required, "Ideal selling price")
   - Suggested price (auto-calculated based on brand, condition, category)
   - Price approval toggle: "Requires seller approval"
   
   **Listing Details:**
   - Platform to list on (checkboxes: Vinted, Leboncoin, Vestiaire Collective, Other)
   - Keywords/tags (for better searchability)
   - Measurements (optional: length, width, etc.)

2. Create API endpoint:
   - POST /api/items
   - Validate all required fields
   - Upload photos to Cloudinary or similar
   - Create Item record with status PENDING_APPROVAL
   - Create notification for seller to approve pricing
   - Return created item

3. Add photo upload handling:
   - Client-side image compression
   - Progress indicator during upload
   - Error handling for failed uploads
   - Image format validation (JPEG, PNG, WebP)

4. Add "Save as Draft" functionality
5. Add "Quick Add" mode for bulk item entry (simplified form)

Test item creation with photo uploads and validation.
```

### Prompt 15: Inventory Management Page

```
Create comprehensive inventory management for Reusses:

1. Create inventory page (client/src/pages/reusse/Inventory.tsx):
   
   View modes:
   - Grid view (photo cards)
   - List view (table format)
   - Toggle between views
   
   Item cards/rows showing:
   - Photo thumbnail
   - Title
   - Brand
   - Category
   - Status badge (Pending Approval, Approved, Listed, Sold, Unsold)
   - Price range or final price
   - Client name
   - Platform listed on
   - Days since listed
   - Quick actions menu (Edit, Duplicate, Delete)
   
   Filters:
   - Status
   - Client/Request
   - Category
   - Platform
   - Price range
   - Date added range
   
   Sort options:
   - Date added (newest/oldest)
   - Price (high/low)
   - Status
   - Client name
   
   Bulk actions:
   - Select multiple items
   - Mark as Listed
   - Mark as Sold
   - Delete selected
   - Export to CSV

2. Item detail modal (click on item):
   - All item information
   - Photo gallery
   - Edit button
   - Status history
   - "Mark as Sold" button (if listed)
   - Sale details form (if marking as sold):
     - Sale price
     - Sale date
     - Platform sold on
     - Buyer information (optional)

3. Create API endpoints:
   
   GET /api/items/reusse/me:
   - Return all items where reusseId = current user
   - Support filtering and sorting
   - Paginated results
   
   PATCH /api/items/:itemId:
   - Update item details
   - Verify Reusse owns the item
   
   PATCH /api/items/:itemId/status:
   - Update item status (LISTED, SOLD, etc.)
   - Create transaction record if sold
   - Calculate commissions
   - Notify seller
   
   DELETE /api/items/:itemId:
   - Soft delete (mark as deleted, don't remove from DB)

4. Add statistics at top:
   - Total items
   - Pending approval
   - Listed
   - Sold this month
   - Average sale time

Test inventory management with filtering, sorting, and bulk actions.
```

---

## 🔴 PHASE 4: COMMUNICATION SYSTEM (Week 9-10)

### Prompt 16: In-App Messaging - Backend

```
Create the backend messaging system:

1. Create message model (verify in Prisma schema):
   - id, senderId, receiverId, requestId (optional)
   - content, attachments, isRead, readAt, createdAt

2. Create message controller (server/src/controllers/message.controller.ts):
   
   sendMessage(req, res):
   - Validate senderId, receiverId, content
   - Create Message record
   - Create notification for receiver
   - Emit real-time event (Socket.io)
   - Return created message
   
   getConversation(req, res):
   - Get all messages between two users
   - Optionally filter by requestId
   - Mark messages as read
   - Return paginated messages (newest first)
   
   getConversations(req, res):
   - Get list of all conversations for current user
   - Show last message, unread count, other user info
   - Sort by most recent message
   
   markAsRead(req, res):
   - Mark specific message or all messages in conversation as read
   - Update readAt timestamp

3. Create message routes:
   - POST /api/messages (send message)
   - GET /api/messages/conversations (list all conversations)
   - GET /api/messages/conversation/:userId (get messages with specific user)
   - GET /api/messages/conversation/:userId/request/:requestId (messages for specific request)
   - PATCH /api/messages/:messageId/read (mark as read)
   - PATCH /api/messages/conversation/:userId/read-all (mark all as read)

4. Add Socket.io for real-time messaging:
   - Set up Socket.io server
   - Handle user connections
   - Emit 'new_message' event
   - Emit 'message_read' event
   - Handle disconnections

5. Add message validation:
   - Content length (max 2000 characters)
   - Attachment size limits
   - Rate limiting (prevent spam)

Test messaging API endpoints with Postman or similar.
```

### Prompt 17: In-App Messaging - Frontend

```
Create the messaging interface:

1. Create messages page (client/src/pages/Messages.tsx):
   
   Layout (similar to WhatsApp/Messenger):
   
   **Left sidebar (30% width):**
   - Search conversations
   - List of conversations showing:
     - Other user's photo and name
     - Last message preview (truncated)
     - Timestamp
     - Unread count badge
     - Online status indicator (if real-time)
   - Sort by most recent
   
   **Main chat area (70% width):**
   - Conversation header:
     - Other user's photo and name
     - User role badge (Seller/Reusse)
     - Related request ID (if applicable)
     - "View Profile" link
   
   - Message history:
     - Messages grouped by date
     - Sender's messages on right (green background)
     - Receiver's messages on left (gray background)
     - Show timestamp
     - Show read status (checkmarks)
     - Auto-scroll to bottom
     - "Load more" for older messages
   
   - Message input:
     - Text area (auto-expanding)
     - Emoji picker button
     - Attachment button (photos)
     - Send button
     - "Press Enter to send" hint

2. Implement real-time messaging with Socket.io:
   - Connect to Socket.io server on component mount
   - Listen for 'new_message' events
   - Update conversation list when new message arrives
   - Show typing indicator (optional)
   - Play notification sound for new messages

3. Create message service (client/src/services/messageService.ts):
   - sendMessage(receiverId, content, requestId?)
   - getConversations()
   - getConversation(userId, requestId?)
   - markAsRead(messageId or userId)

4. Add features:
   - Unread message counter in sidebar navigation
   - Desktop notifications for new messages (with permission)
   - Message search within conversation
   - Copy message text
   - Delete message (sender only)

5. Empty states:
   - No conversations: "No messages yet. Start a conversation with your Reusse or seller!"
   - No conversation selected: "Select a conversation to start messaging"

Test messaging with real-time updates and multiple users.
```

### Prompt 18: Notification System

```
Create a comprehensive notification system:

1. Create notification center component (client/src/components/NotificationCenter.tsx):
   
   Dropdown panel (triggered by bell icon):
   - Header: "Notifications" with "Mark all as read" button
   - List of notifications showing:
     - Icon (based on type)
     - Title and message
     - Timestamp (relative: "2 hours ago")
     - Link to related page
     - Unread indicator (blue dot)
   - "View All" link at bottom
   - Empty state: "No new notifications"
   
   Notification types with icons:
   - REQUEST_RECEIVED: "New request matched!"
   - REQUEST_ACCEPTED: "Your request was accepted by [Reusse name]"
   - MEETING_SCHEDULED: "Meeting scheduled for [date]"
   - ITEM_SOLD: "[Item name] has been sold!"
   - PAYMENT_RECEIVED: "Payment received: €[amount]"
   - MESSAGE_RECEIVED: "New message from [user]"
   - PRICE_APPROVAL_NEEDED: "Approve pricing for [item]"

2. Create full notifications page (client/src/pages/Notifications.tsx):
   - All notifications with pagination
   - Filter by type
   - Filter by read/unread
   - Bulk actions (mark as read, delete)

3. Create API endpoints:
   
   GET /api/notifications:
   - Get all notifications for current user
   - Support pagination
   - Filter by isRead
   
   PATCH /api/notifications/:notificationId/read:
   - Mark specific notification as read
   
   PATCH /api/notifications/read-all:
   - Mark all notifications as read
   
   DELETE /api/notifications/:notificationId:
   - Delete notification

4. Implement real-time notifications:
   - Use Socket.io to push notifications
   - Show toast/popup for important notifications
   - Update notification count in real-time
   - Play sound for high-priority notifications

5. Add notification preferences in settings:
   - Email notifications on/off
   - Push notifications on/off
   - Notification types to receive

Test notification system with various notification types.
```

---

## 🔴 PHASE 5: PAYMENT INTEGRATION (Week 11-13)

### Prompt 19: Stripe Setup and Configuration

```
Set up Stripe integration for payments:

1. Install Stripe dependencies:
   - npm install stripe @stripe/stripe-js
   - Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to environment variables

2. Create Stripe service (server/src/services/stripe.service.ts):
   
   Initialize Stripe:
   - const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
   
   createConnectedAccount(userId, email):
   - Create Stripe Connect Express account for Reusses
   - Store Stripe account ID in Profile
   - Return account onboarding link
   
   createAccountLink(stripeAccountId):
   - Generate onboarding/dashboard link for Reusses
   
   createPaymentIntent(amount, sellerId, reusseId, itemId):
   - Create payment intent for item sale
   - Set application fee (platform commission)
   - Set transfer destination (Reusse's connected account)
   - Return client secret
   
   createPayout(reusseId, amount):
   - Create payout to Reusse's connected account
   - Record transaction
   
   handleWebhook(event):
   - Handle Stripe webhook events
   - payment_intent.succeeded: Update transaction status
   - account.updated: Update Reusse account status
   - payout.paid: Update payout status

3. Create payment routes:
   - POST /api/payments/connect-account (create Stripe account for Reusse)
   - GET /api/payments/account-link (get onboarding link)
   - POST /api/payments/create-payment-intent (for item sale)
   - POST /api/webhooks/stripe (webhook endpoint)
   - GET /api/payments/balance (get Reusse's balance)

4. Set up Stripe webhook:
   - Configure webhook endpoint in Stripe dashboard
   - Verify webhook signature
   - Handle events asynchronously

5. Add Stripe account status to Reusse profile:
   - pending: Account created, onboarding not complete
   - active: Account verified, can receive payouts
   - restricted: Account has issues

Test Stripe integration with test mode keys.
```

### Prompt 20: Commission Calculation System

```
Implement the commission calculation and distribution system:

1. Create commission service (server/src/services/commission.service.ts):
   
   calculateCommission(salePrice, serviceType):
   - CLASSIC: 30% to Reusse, 70% to Seller, 0% platform fee (for MVP)
   - EXPRESS: 35% to Reusse, 65% to Seller
   - SOS_DRESSING: 40% to Reusse, 60% to Seller
   - Return breakdown object
   
   createCommissionRecord(itemId, salePrice):
   - Calculate commission split
   - Create Commission record
   - Update item status to SOLD
   - Create transactions for seller and Reusse
   - Return commission record
   
   processPayment(itemId, salePrice, paymentMethodId):
   - Create Stripe payment intent
   - Calculate commission
   - Transfer funds to Reusse (via Stripe Connect)
   - Hold seller's portion in platform account
   - Create commission and transaction records
   - Send notifications to both parties

2. Create commission controller:
   
   POST /api/commissions/calculate:
   - Calculate commission for given sale price and service type
   - Return breakdown
   
   POST /api/commissions/process:
   - Process payment and create commission records
   - Verify Reusse owns the item
   - Verify item is LISTED status
   - Create payment intent
   - Return payment details

3. Update item sold workflow:
   - When Reusse marks item as sold:
     - Prompt for sale price
     - Show commission breakdown
     - Confirm sale
     - Process payment
     - Update item status
     - Create commission record
     - Send notifications

4. Add commission history page for Reusses:
   - List all commissions earned
   - Filter by date range
   - Show total earnings
   - Export to CSV

Test commission calculation with different service types and prices.
```

### Prompt 21: Earnings Dashboard

```
Create earnings tracking for both sellers and Reusses:

1. Create seller earnings page (client/src/pages/seller/Earnings.tsx):
   
   Overview cards:
   - Total Earnings (all time)
   - Pending Earnings (items sold, payment pending)
   - This Month's Earnings
   - Items Sold (count)
   
   Earnings breakdown:
   - Chart showing earnings over time (last 6 months)
   - Breakdown by service type
   - Average sale price
   
   Transaction history table:
   - Item name and photo
   - Sale date
   - Sale price
   - Your earnings (after commission)
   - Status (Pending, Completed)
   - Reusse name
   - View details link
   
   Payout information:
   - "Payouts are processed monthly"
   - Next payout date
   - Bank account on file (last 4 digits)
   - "Update Payment Method" button

2. Create Reusse earnings page (client/src/pages/reusse/Earnings.tsx):
   
   Overview cards:
   - Total Commissions Earned
   - Available Balance (ready for payout)
   - Pending Balance (items sold, awaiting transfer)
   - This Month's Commissions
   - Total Items Sold
   
   Performance metrics:
   - Average commission per item
   - Average days to sell
   - Success rate (items sold / items listed)
   - Top performing categories
   
   Commission history table:
   - Item details
   - Client name
   - Sale price
   - Your commission
   - Commission rate
   - Date sold
   - Status
   
   Payout section:
   - Available balance
   - "Request Payout" button (if balance > minimum)
   - Payout history
   - Stripe dashboard link

3. Create API endpoints:
   
   GET /api/earnings/seller:
   - Return seller's earnings summary
   - Include transaction history
   - Calculate totals
   
   GET /api/earnings/reusse:
   - Return Reusse's commission summary
   - Include available and pending balance
   - Include performance metrics
   
   POST /api/earnings/payout:
   - Request payout to Stripe connected account
   - Verify minimum balance
   - Create payout transaction
   - Update balance

4. Add export functionality:
   - Export earnings to CSV
   - Filter by date range
   - Include all transaction details

Test earnings pages with sample transaction data.
```

---

## 🟠 PHASE 6: ADMIN PANEL (Week 14-15)

### Prompt 22: Admin Dashboard

```
Create the admin dashboard for platform management:

1. Create admin layout (client/src/layouts/AdminDashboardLayout.tsx):
   
   Sidebar navigation:
   - Dashboard
   - Users Management
   - Reusse Applications
   - Requests
   - Items
   - Transactions
   - Reports
   - Settings
   
   Require ADMIN role to access

2. Create admin dashboard home (client/src/pages/admin/Dashboard.tsx):
   
   Platform statistics:
   - Total Users (Sellers + Reusses)
   - Active Requests
   - Total Items Listed
   - Total Items Sold
   - Total Transaction Volume (€)
   - Platform Revenue (€)
   
   Recent activity:
   - New user registrations
   - New Reusse applications (with "Review" button)
   - Recent transactions
   - Flagged items/users
   
   Charts:
   - User growth over time
   - Transaction volume over time
   - Items listed vs sold
   - Revenue by month
   
   Quick actions:
   - "Review Reusse Applications" (with count badge)
   - "View Flagged Content"
   - "Generate Report"

3. Create API endpoints:
   
   GET /api/admin/stats:
   - Require ADMIN role
   - Return platform statistics
   - Include growth metrics
   
   GET /api/admin/activity:
   - Return recent platform activity
   - Paginated results

Test admin dashboard with sample data.
```

### Prompt 23: User Management

```
Create user management interface for admins:

1. Create users management page (client/src/pages/admin/Users.tsx):
   
   User list table:
   - User ID
   - Name
   - Email
   - Role (Seller/Reusse/Admin)
   - Status (Active/Suspended/Banned)
   - Registration date
   - Last login
   - Total requests/items
   - Actions (View, Edit, Suspend, Delete)
   
   Filters:
   - Role
   - Status
   - Registration date range
   - Search by name/email
   
   Bulk actions:
   - Export selected users
   - Send email to selected users

2. User detail modal:
   - Full user profile
   - Activity history
   - Requests/items created
   - Transactions
   - Edit user details
   - Change role
   - Suspend/unsuspend account
   - Delete account (with confirmation)
   - Send email to user

3. Create API endpoints:
   
   GET /api/admin/users:
   - Return all users with filtering
   - Paginated results
   
   GET /api/admin/users/:userId:
   - Return detailed user information
   - Include activity history
   
   PATCH /api/admin/users/:userId:
   - Update user details
   - Change role or status
   
   DELETE /api/admin/users/:userId:
   - Soft delete user account
   - Anonymize personal data

4. Add audit logging:
   - Log all admin actions
   - Store in AdminLog model
   - Display in admin activity feed

Test user management with different user types.
```

### Prompt 24: Reusse Application Review

```
Create the Reusse application approval system:

1. Create Reusse applications page (client/src/pages/admin/ReusseApplications.tsx):
   
   Application cards showing:
   - Applicant name and photo
   - Email and phone
   - Location (city, department)
   - Experience level
   - Bio
   - SIRET number (if provided)
   - Application date
   - Status (Pending, Approved, Rejected)
   - Actions: "Approve", "Reject", "Request More Info"
   
   Filters:
   - Status
   - Application date
   - Location
   
   Application detail modal:
   - Full application information
   - Map showing location
   - Notes field for admin comments
   - Approval checklist:
     - Profile complete
     - Experience verified
     - Location confirmed
     - Background check (optional)
   - Approve/Reject buttons with reason field

2. Create API endpoints:
   
   GET /api/admin/reusse-applications:
   - Return all Reusse profiles with status PENDING
   - Include user and profile data
   
   POST /api/admin/reusse-applications/:userId/approve:
   - Update profile status to APPROVED
   - Send approval email to Reusse
   - Create notification
   - Grant access to Reusse dashboard
   
   POST /api/admin/reusse-applications/:userId/reject:
   - Update profile status to REJECTED
   - Require rejection reason
   - Send rejection email with reason
   - Create notification

3. Email templates:
   - Approval email: "Congratulations! Your application has been approved"
   - Rejection email: "Thank you for applying. Unfortunately..."
   - Request more info email: "We need additional information..."

4. Add statistics:
   - Total applications
   - Pending review
   - Approved this month
   - Rejection rate

Test application review workflow from submission to approval.
```

---

## 🟠 PHASE 7: ESSENTIAL PAGES (Week 16)

### Prompt 25: FAQ Page

```
Create a comprehensive FAQ page:

1. Create FAQ page (client/src/pages/FAQ.tsx):
   
   Page structure:
   - Hero section: "Frequently Asked Questions"
   - Search bar: "Search for answers..."
   - Category tabs:
     - For Sellers
     - For Reusses
     - Pricing & Payments
     - Account & Security
     - General
   
   FAQ items (accordion style):
   - Question (clickable to expand)
   - Answer (with formatting, links)
   - "Was this helpful?" feedback buttons
   
   Sidebar:
   - "Still have questions?"
   - Contact form link
   - Popular articles
   - Video tutorials (if available)

2. FAQ content (add to database or config file):
   
   **For Sellers:**
   - How does Sellzy work?
   - What items can I sell?
   - How much does it cost?
   - How long does it take to sell my items?
   - How do I get paid?
   - Can I set minimum prices?
   - What if my items don't sell?
   - How do I track my items?
   
   **For Reusses:**
   - How do I become a Reusse?
   - What are the requirements?
   - How do I get matched with sellers?
   - How much commission do I earn?
   - How do payouts work?
   - Can I decline requests?
   - What platforms can I list items on?
   
   **Pricing & Payments:**
   - What are the commission rates?
   - When do I get paid?
   - What payment methods are accepted?
   - Are there any hidden fees?
   - How is pricing determined?
   
   **Account & Security:**
   - How do I create an account?
   - How do I reset my password?
   - Is my data secure?
   - How do I delete my account?

3. Create API endpoints (if storing FAQs in database):
   
   GET /api/faqs:
   - Return all published FAQs
   - Filter by category
   - Support search query
   
   POST /api/admin/faqs (admin only):
   - Create new FAQ
   
   PATCH /api/admin/faqs/:faqId:
   - Update FAQ
   
   DELETE /api/admin/faqs/:faqId:
   - Delete FAQ

4. Add search functionality:
   - Search through questions and answers
   - Highlight matching text
   - Show "No results found" with contact link

5. Add helpful features:
   - Jump to category from URL (#for-sellers)
   - Print-friendly version
   - Share FAQ link
   - Feedback on helpfulness

Test FAQ page with search and navigation.
```

### Prompt 26: Contact Form

```
Create a contact/support form:

1. Create contact page (client/src/pages/Contact.tsx):
   
   Page layout:
   - Hero section: "Get in Touch"
   - Subtitle: "We're here to help"
   
   Contact form:
   - Name (required)
   - Email (required)
   - Subject (select dropdown):
     - General Inquiry
     - Technical Support
     - Billing Question
     - Reusse Application
     - Report a Problem
     - Partnership Opportunity
     - Other
   - Message (textarea, required, min 20 chars)
   - Attachment (optional, for screenshots)
   - "Send Message" button
   
   Contact information sidebar:
   - Email: support@sellzy.com
   - Response time: "Within 24 hours"
   - FAQ link: "Check our FAQ first"
   - Social media links
   
   Success message:
   - "Thank you! We've received your message"
   - "We'll get back to you within 24 hours"
   - Reference number: #CONTACT-12345

2. Create API endpoint:
   
   POST /api/contact:
   - Validate form data
   - Send email to support team
   - Send confirmation email to user
   - Store message in database (optional)
   - Return success with reference number

3. Email templates:
   - Support team notification: "New contact form submission"
   - User confirmation: "We received your message"

4. Add features:
   - Form validation with helpful error messages
   - Character counter for message
   - File upload for attachments (screenshots, documents)
   - Spam protection (reCAPTCHA or honeypot)

5. For logged-in users:
   - Pre-fill name and email
   - Include user ID in message
   - Link to user's account for context

Test contact form submission and email delivery.
```

### Prompt 27: Legal Pages (Terms & Privacy)

```
Create Terms of Service and Privacy Policy pages:

1. Create Terms of Service page (client/src/pages/legal/Terms.tsx):
   
   Page structure:
   - Title: "Terms of Service"
   - Last updated date
   - Table of contents (jump links)
   - Sections:
     1. Acceptance of Terms
     2. Description of Service
     3. User Accounts
     4. User Responsibilities
     5. Seller Terms
     6. Reusse Terms
     7. Fees and Payments
     8. Commission Structure
     9. Intellectual Property
     10. Prohibited Activities
     11. Termination
     12. Limitation of Liability
     13. Dispute Resolution
     14. Changes to Terms
     15. Contact Information
   
   Features:
   - Print-friendly layout
   - Download as PDF
   - "I Accept" button (for new users)

2. Create Privacy Policy page (client/src/pages/legal/Privacy.tsx):
   
   Sections:
   1. Information We Collect
   2. How We Use Your Information
   3. Information Sharing
   4. Data Security
   5. Cookies and Tracking
   6. Your Rights (GDPR compliance)
   7. Data Retention
   8. Children's Privacy
   9. International Data Transfers
   10. Changes to Privacy Policy
   11. Contact Us
   
   Features:
   - Cookie consent banner integration
   - Data deletion request form
   - Download personal data option

3. Create legal layout component:
   - Consistent styling for legal pages
   - Sidebar with navigation
   - Breadcrumb navigation
   - Last updated timestamp

4. Add to footer:
   - Links to Terms and Privacy
   - Copyright notice
   - Company information

5. Create acceptance tracking:
   - Store terms acceptance in User model
   - Prompt users to accept updated terms
   - Show terms version accepted

**Note:** Consult with a lawyer for actual legal content. This is just the structure.

Test legal pages navigation and layout.
```

---

## 🟡 PHASE 8: PROFILE & SETTINGS (Week 17)

### Prompt 28: Profile Management

```
Create comprehensive profile management:

1. Create profile page (client/src/pages/Profile.tsx):
   
   Profile sections (tabs):
   
   **Personal Information:**
   - Profile photo upload
   - First name, Last name
   - Email (read-only, show verified badge)
   - Phone number
   - Bio (for Reusses)
   - Edit button for each section
   
   **Address:**
   - Street address
   - City
   - Postal code
   - Department
   - Map preview showing location
   - "Update Location" button
   
   **For Reusses Only:**
   - Experience level
   - SIRET number
   - Service area radius (km)
   - Preferred categories
   - Platforms used (Vinted, Leboncoin, etc.)
   - Stripe account status
   - "Connect Stripe Account" button (if not connected)
   
   **Account Settings:**
   - Email preferences
   - Notification preferences
   - Language preference
   - Timezone
   
   **Security:**
   - Change password
   - Two-factor authentication (optional)
   - Active sessions
   - Login history

2. Create API endpoints:
   
   GET /api/profile:
   - Return current user's profile
   
   PATCH /api/profile:
   - Update profile fields
   - Validate changes
   - Return updated profile
   
   POST /api/profile/photo:
   - Upload profile photo
   - Resize and optimize
   - Update profile record
   
   PATCH /api/profile/password:
   - Require current password
   - Validate new password
   - Hash and update password
   - Send confirmation email

3. Add photo upload:
   - Drag & drop or click to upload
   - Crop tool for profile photo
   - Preview before saving
   - Remove photo option

4. Add validation:
   - Email format
   - Phone format (French)
   - Postal code format
   - Password strength
   - Required fields

5. Add success/error messages:
   - "Profile updated successfully"
   - "Photo uploaded"
   - "Password changed"
   - Error messages for validation failures

Test profile editing with various field updates.
```

### Prompt 29: Settings Page

```
Create a comprehensive settings page:

1. Create settings page (client/src/pages/Settings.tsx):
   
   Settings sections (tabs):
   
   **Notifications:**
   - Email notifications:
     - New request matched
     - Request accepted
     - Meeting scheduled
     - Item sold
     - Payment received
     - New message
     - Weekly summary
   - Push notifications (same categories)
   - SMS notifications (optional)
   - Notification frequency: Instant, Daily digest, Weekly digest
   
   **Privacy:**
   - Profile visibility (Public, Reusses only, Private)
   - Show location (Exact, City only, Hidden)
   - Show statistics publicly
   - Allow search engines to index profile
   
   **Communication:**
   - Who can message me (Everyone, Matched only, No one)
   - Email preferences (HTML, Plain text)
   - Language preference (French, English)
   
   **Payment:**
   - Default payment method
   - Saved payment methods
   - Billing address
   - Tax information (for Reusses)
   - Payout preferences (frequency, minimum amount)
   
   **Account:**
   - Account type (Seller, Reusse)
   - Account status
   - Member since date
   - Deactivate account
   - Delete account (with confirmation)
   
   **For Reusses:**
   - Stripe account management
   - Service area settings
   - Availability calendar
   - Auto-accept requests (on/off)
   - Maximum active clients

2. Create API endpoints:
   
   GET /api/settings:
   - Return all user settings
   
   PATCH /api/settings:
   - Update specific settings
   - Validate changes
   
   POST /api/settings/deactivate:
   - Deactivate account
   - Send confirmation email
   
   POST /api/settings/delete:
   - Require password confirmation
   - Soft delete account
   - Anonymize data
   - Send confirmation email

3. Add confirmation dialogs:
   - Deactivate account: "Are you sure? You can reactivate anytime"
   - Delete account: "This action cannot be undone. Type DELETE to confirm"

4. Add export data feature (GDPR compliance):
   - "Download My Data" button
   - Generate ZIP file with all user data
   - Send download link via email

Test settings with various preference combinations.
```

---

## 🟡 PHASE 9: MEETING MANAGEMENT (Week 18)

### Prompt 30: Meeting Scheduling

```
Create meeting scheduling system:

1. Create meeting scheduling modal (client/src/components/MeetingScheduler.tsx):
   
   Scheduling form:
   - Date picker (calendar view)
   - Time slots (30-minute intervals)
   - Duration (30 min, 1 hour, 2 hours)
   - Location options:
     - Seller's address (pre-filled)
     - Reusse's location
     - Public place (with address input)
     - Other (custom address)
   - Notes (optional)
   - "Schedule Meeting" button
   
   Features:
   - Show Reusse's availability (if set)
   - Highlight unavailable dates
   - Show timezone
   - Send calendar invite option

2. Create calendar view page (client/src/pages/Calendar.tsx):
   
   Calendar interface:
   - Month view (default)
   - Week view
   - Day view
   - List view
   
   Meeting cards on calendar:
   - Time
   - Client/Reusse name
   - Location
   - Request ID
   - Status badge
   - Click to view details
   
   Filters:
   - Upcoming
   - Past
   - Cancelled
   
   Actions:
   - Add new meeting
   - Reschedule
   - Cancel meeting
   - Get directions
   - Export to Google Calendar/iCal

3. Create API endpoints:
   
   POST /api/meetings:
   - Create meeting for a request
   - Validate date/time
   - Check for conflicts
   - Create Meeting record
   - Send notifications to both parties
   - Send calendar invites
   
   GET /api/meetings:
   - Return user's meetings
   - Filter by date range, status
   
   PATCH /api/meetings/:meetingId:
   - Update meeting details
   - Notify other party of changes
   
   PATCH /api/meetings/:meetingId/cancel:
   - Cancel meeting
   - Update status
   - Notify other party
   
   GET /api/meetings/availability/:reusseId:
   - Return Reusse's available time slots

4. Add notifications:
   - Meeting scheduled: Notify both parties
   - Meeting reminder: 24 hours before
   - Meeting reminder: 1 hour before
   - Meeting rescheduled: Notify both parties
   - Meeting cancelled: Notify both parties

5. Add calendar integration:
   - Generate .ics file for download
   - Google Calendar link
   - Outlook Calendar link

Test meeting scheduling and calendar views.
```

---

## 🟡 PHASE 10: ITEM APPROVAL WORKFLOW (Week 19)

### Prompt 31: Price Approval System

```
Create the item price approval workflow for sellers:

1. Create pending approvals page (client/src/pages/seller/PendingApprovals.tsx):
   
   Page showing items awaiting price approval:
   - Item photo gallery
   - Item details (title, brand, category, condition)
   - Reusse's suggested price range
   - Reusse's notes/reasoning
   - Original price (if provided)
   - Market comparison (similar items)
   
   Approval options:
   - Approve suggested price
   - Suggest different price (with input field)
   - Request more information
   - Decline to sell this item
   
   Bulk actions:
   - "Approve All" button
   - Select multiple items to approve

2. Create item approval modal:
   - Large photo viewer
   - All item details
   - Price comparison chart
   - Reusse's expertise note
   - Approval form:
     - Radio buttons: Approve, Counter-offer, Decline
     - If counter-offer: Min and max price inputs
     - Notes field
     - "Submit" button

3. Create API endpoints:
   
   GET /api/items/pending-approval:
   - Return items with status PENDING_APPROVAL
   - Filter by sellerId
   
   POST /api/items/:itemId/approve:
   - Update item status to APPROVED
   - Set approvedPrice
   - Notify Reusse
   - Allow Reusse to list item
   
   POST /api/items/:itemId/counter-offer:
   - Update price range
   - Set status to NEGOTIATING
   - Notify Reusse with new price
   
   POST /api/items/:itemId/decline:
   - Update status to DECLINED
   - Notify Reusse
   - Remove from inventory

4. Add notifications:
   - Seller: "New items ready for price approval"
   - Reusse: "Seller approved pricing for [item]"
   - Reusse: "Seller suggested different price for [item]"
   - Seller: "Reusse responded to your counter-offer"

5. Add features:
   - Price history (if item was previously listed)
   - Similar items sold (for reference)
   - Estimated time to sell at different prices
   - "Accept Reusse's expertise" quick button

Test price approval workflow from both seller and Reusse perspectives.
```

---

## 🟡 PHASE 11: SEARCH & FILTERS (Week 20)

### Prompt 32: Search Functionality

```
Add search functionality across the platform:

1. Create global search component (client/src/components/GlobalSearch.tsx):
   
   Search bar in header:
   - Search input with icon
   - Autocomplete suggestions
   - Recent searches
   - Search categories:
     - Items
     - Users
     - Requests
   - "View all results" link

2. Create search results page (client/src/pages/Search.tsx):
   
   Search results grouped by type:
   - Items (with photos, prices, status)
   - Users (Reusses with ratings)
   - Requests (for admins)
   
   Filters sidebar:
   - Category
   - Price range
   - Status
   - Location
   - Date range
   
   Sort options:
   - Relevance
   - Date (newest/oldest)
   - Price (low/high)
   - Distance

3. Create search API endpoints:
   
   GET /api/search:
   - Query parameter: q (search term)
   - Filter parameters: type, category, status, etc.
   - Return results grouped by type
   - Implement full-text search
   
   GET /api/search/suggestions:
   - Return autocomplete suggestions
   - Based on partial query

4. Implement search for specific pages:
   
   Inventory search (Reusse):
   - Search own items by title, brand, category
   - Advanced filters
   
   Client search (Reusse):
   - Search clients by name
   
   User search (Admin):
   - Search all users by name, email

5. Add search features:
   - Highlight matching text in results
   - Save recent searches
   - Search history (clearable)
   - "No results found" with suggestions
   - Typo tolerance

Test search with various queries and filters.
```

---

## 🟢 PHASE 12: POLISH & OPTIMIZATION (Week 21-22)

### Prompt 33: Loading States and Skeletons

```
Add comprehensive loading states throughout the app:

1. Create skeleton components (client/src/components/skeletons/):
   
   - CardSkeleton.tsx: For card layouts
   - TableSkeleton.tsx: For table rows
   - ProfileSkeleton.tsx: For profile pages
   - DashboardSkeleton.tsx: For dashboard stats
   - ListSkeleton.tsx: For list views
   
   Use shimmer animation effect

2. Add loading states to all pages:
   
   Dashboard pages:
   - Show skeleton cards while loading stats
   - Skeleton for charts
   
   List pages:
   - Skeleton rows/cards while fetching data
   
   Detail pages:
   - Skeleton for content sections
   
   Forms:
   - Disable and show spinner on submit
   - "Saving..." text on buttons

3. Add loading indicators:
   - Page transitions: Top loading bar
   - Infinite scroll: Spinner at bottom
   - Button actions: Spinner in button
   - File uploads: Progress bar
   - Image loading: Blur-up effect

4. Add optimistic UI updates:
   - Mark message as sent immediately
   - Update UI before API response
   - Revert if API fails

5. Add empty states:
   - No data: Friendly illustration + CTA
   - No search results: Suggestions
   - No notifications: "All caught up!"
   - Error states: Retry button

Test loading states by simulating slow network.
```

### Prompt 34: Error Handling and Validation

```
Implement comprehensive error handling:

1. Create error boundary component (client/src/components/ErrorBoundary.tsx):
   - Catch React errors
   - Show friendly error page
   - "Report this error" button
   - "Go back" or "Reload" buttons
   - Log errors to monitoring service

2. Create error handling utilities:
   
   client/src/utils/errorHandler.ts:
   - handleApiError(error): Parse API errors
   - showErrorToast(message): Display error toast
   - logError(error): Send to monitoring service
   
   Common error messages:
   - Network error: "Connection lost. Please check your internet."
   - 401: "Session expired. Please log in again."
   - 403: "You don't have permission to do that."
   - 404: "Not found."
   - 500: "Something went wrong. Please try again."

3. Add form validation:
   - Real-time validation (on blur)
   - Show error messages below fields
   - Highlight invalid fields
   - Disable submit until valid
   - Clear errors on input change

4. Add API error handling:
   - Axios interceptor for global error handling
   - Retry failed requests (3 times)
   - Show toast for errors
   - Log errors for debugging

5. Add user-friendly error pages:
   - 404 page: "Page not found" with search
   - 500 page: "Server error" with contact support
   - 403 page: "Access denied" with explanation
   - Offline page: "You're offline" with retry

6. Add validation for all forms:
   - Required fields
   - Email format
   - Phone format
   - Password strength
   - File size/type
   - Number ranges
   - Date validation

Test error handling by simulating various error scenarios.
```

### Prompt 35: Responsive Design Improvements

```
Ensure the entire app is fully responsive:

1. Review and fix responsive issues:
   
   Mobile (< 768px):
   - Collapsible sidebar navigation
   - Hamburger menu
   - Stack cards vertically
   - Full-width forms
   - Touch-friendly buttons (min 44px)
   - Swipeable carousels
   
   Tablet (768px - 1024px):
   - 2-column layouts
   - Sidebar can be toggled
   - Optimized table views
   
   Desktop (> 1024px):
   - Full sidebar visible
   - Multi-column layouts
   - Hover effects
   - Keyboard shortcuts

2. Test and fix specific components:
   
   Navigation:
   - Mobile: Bottom nav or hamburger
   - Tablet: Collapsible sidebar
   - Desktop: Full sidebar
   
   Tables:
   - Mobile: Card view instead of table
   - Tablet: Scrollable table
   - Desktop: Full table
   
   Forms:
   - Mobile: Single column
   - Tablet: 2 columns where appropriate
   - Desktop: Multi-column with proper spacing
   
   Modals:
   - Mobile: Full screen
   - Tablet/Desktop: Centered modal

3. Add mobile-specific features:
   - Pull to refresh
   - Swipe gestures
   - Native camera access for photos
   - Click-to-call phone numbers
   - Click-to-map addresses

4. Optimize for touch:
   - Larger tap targets
   - Swipeable cards
   - Touch-friendly dropdowns
   - Prevent zoom on input focus

5. Test on actual devices:
   - iPhone (various sizes)
   - Android phones
   - iPad
   - Android tablets
   - Various desktop sizes

Use Chrome DevTools device emulation for testing.
```

### Prompt 36: Performance Optimization

```
Optimize application performance:

1. Frontend optimizations:
   
   Code splitting:
   - Lazy load routes
   - Lazy load heavy components
   - Dynamic imports for modals
   
   Image optimization:
   - Use WebP format
   - Lazy load images
   - Responsive images (srcset)
   - Compress images
   - Use CDN for images
   
   Bundle optimization:
   - Tree shaking
   - Minimize bundle size
   - Remove unused dependencies
   - Code splitting by route
   
   React optimizations:
   - Use React.memo for expensive components
   - Use useMemo and useCallback
   - Avoid unnecessary re-renders
   - Virtualize long lists (react-window)

2. Backend optimizations:
   
   Database:
   - Add indexes on frequently queried fields
   - Optimize queries (avoid N+1)
   - Use database connection pooling
   - Implement caching (Redis)
   
   API:
   - Implement pagination
   - Add rate limiting
   - Compress responses (gzip)
   - Cache frequently accessed data
   
   File uploads:
   - Compress images on server
   - Use background jobs for processing
   - Stream large files

3. Add caching:
   - Browser caching headers
   - Service worker for offline support
   - Cache API responses (with invalidation)
   - Cache static assets

4. Add monitoring:
   - Track page load times
   - Monitor API response times
   - Track error rates
   - Set up alerts for issues

5. Run performance audits:
   - Lighthouse audit
   - Fix performance issues
   - Aim for score > 90

Test performance improvements with Lighthouse and real devices.
```

---

## 🟢 PHASE 13: FINAL TOUCHES (Week 23-24)

### Prompt 37: Email Templates

```
Create professional email templates:

1. Set up email service (if not already done):
   - Use SendGrid, Mailgun, or AWS SES
   - Configure SMTP settings
   - Set up email templates

2. Create email templates (server/src/templates/emails/):
   
   **Authentication:**
   - welcome-seller.html: Welcome email for new sellers
   - welcome-reusse.html: Welcome email for new Reusses
   - password-reset.html: Password reset link
   - password-changed.html: Confirmation of password change
   - email-verification.html: Verify email address
   
   **Requests:**
   - request-created.html: Confirmation for seller
   - request-matched.html: Notify seller of match
   - request-accepted.html: Notify seller that Reusse accepted
   
   **Meetings:**
   - meeting-scheduled.html: Meeting confirmation
   - meeting-reminder-24h.html: 24-hour reminder
   - meeting-reminder-1h.html: 1-hour reminder
   - meeting-cancelled.html: Meeting cancellation
   
   **Items:**
   - item-approval-needed.html: Notify seller to approve prices
   - item-approved.html: Notify Reusse of approval
   - item-listed.html: Notify seller that item is listed
   - item-sold.html: Notify seller of sale
   
   **Payments:**
   - payment-received.html: Payment confirmation
   - payout-processed.html: Payout notification
   - invoice.html: Monthly invoice
   
   **Admin:**
   - reusse-application-received.html: Confirmation to applicant
   - reusse-approved.html: Approval notification
   - reusse-rejected.html: Rejection notification

3. Email template structure:
   - Responsive HTML
   - Sellzy branding (logo, colors)
   - Clear call-to-action buttons
   - Footer with unsubscribe link
   - Social media links
   - Contact information

4. Add email preferences:
   - Allow users to opt out of certain emails
   - Always send transactional emails
   - Respect unsubscribe requests

5. Test emails:
   - Test in multiple email clients
   - Check spam score
   - Verify links work
   - Test on mobile

Use a service like Litmus or Email on Acid for testing.
```

### Prompt 38: Analytics Integration

```
Integrate analytics and tracking:

1. Set up Google Analytics 4:
   - Create GA4 property
   - Add tracking code to app
   - Set up custom events
   
   Track events:
   - Page views
   - User registration (Seller/Reusse)
   - Request created
   - Request accepted
   - Item listed
   - Item sold
   - Payment completed
   - Message sent

2. Set up conversion tracking:
   - Seller registration
   - Reusse registration
   - First request created
   - First item sold
   - Revenue (transaction value)

3. Create custom dashboards:
   - User acquisition
   - User engagement
   - Conversion funnels
   - Revenue tracking

4. Add internal analytics:
   
   Create analytics page for admins (client/src/pages/admin/Analytics.tsx):
   - User growth chart
   - Request volume chart
   - Item sales chart
   - Revenue chart
   - Conversion rates
   - User retention
   - Platform metrics
   
   Create API endpoints:
   - GET /api/admin/analytics/users
   - GET /api/admin/analytics/requests
   - GET /api/admin/analytics/sales
   - GET /api/admin/analytics/revenue

5. Add user-level analytics:
   - Sellers: View their performance
   - Reusses: View their performance
   - Charts and insights

Test analytics tracking in development mode.
```

### Prompt 39: Security Hardening

```
Implement security best practices:

1. Authentication security:
   - Implement rate limiting on login attempts
   - Add account lockout after failed attempts
   - Require strong passwords
   - Add optional 2FA (two-factor authentication)
   - Implement session timeout
   - Secure password reset flow

2. API security:
   - Validate all inputs
   - Sanitize user input
   - Implement CSRF protection
   - Add rate limiting to all endpoints
   - Use HTTPS only
   - Set security headers:
     - Content-Security-Policy
     - X-Frame-Options
     - X-Content-Type-Options
     - Strict-Transport-Security

3. Data protection:
   - Encrypt sensitive data at rest
   - Use HTTPS for data in transit
   - Hash passwords with bcrypt
   - Secure file uploads (validate type, size)
   - Implement proper access controls
   - Log security events

4. Frontend security:
   - Sanitize user-generated content (prevent XSS)
   - Validate all form inputs
   - Don't expose sensitive data in client code
   - Implement Content Security Policy
   - Use secure cookies

5. Compliance:
   - GDPR compliance (data privacy)
   - Cookie consent banner
   - Data deletion requests
   - Data export functionality
   - Privacy policy
   - Terms of service

6. Security audit:
   - Run security scanner (npm audit)
   - Fix vulnerabilities
   - Update dependencies
   - Review code for security issues

Test security measures with penetration testing tools.
```

### Prompt 40: Final Testing and Bug Fixes

```
Perform comprehensive testing and fix bugs:

1. Create test plan:
   - User registration (Seller, Reusse)
   - Login/logout
   - Password reset
   - Profile management
   - Request creation (all service types)
   - Request matching and acceptance
   - Meeting scheduling
   - Item cataloging
   - Price approval
   - Item listing
   - Item sale
   - Payment processing
   - Messaging
   - Notifications
   - Admin functions
   - All API endpoints

2. Test user flows:
   
   **Seller flow:**
   - Register → Create request → Get matched → Schedule meeting → Approve prices → Track items → Receive payment
   
   **Reusse flow:**
   - Register → Get approved → Accept request → Schedule meeting → Add items → Get approval → List items → Mark as sold → Receive payout
   
   **Admin flow:**
   - Review Reusse applications → Approve/reject → Monitor platform → Manage users

3. Test edge cases:
   - Empty states
   - Error states
   - Network failures
   - Invalid inputs
   - Concurrent actions
   - Large datasets
   - Slow connections

4. Cross-browser testing:
   - Chrome
   - Firefox
   - Safari
   - Edge
   - Mobile browsers

5. Performance testing:
   - Load testing (simulate many users)
   - Stress testing
   - Database query optimization
   - API response times

6. Accessibility testing:
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - Focus indicators
   - ARIA labels

7. Create bug tracking system:
   - Document all bugs
   - Prioritize by severity
   - Fix critical bugs first
   - Retest after fixes

8. User acceptance testing:
   - Get feedback from test users
   - Fix usability issues
   - Iterate on design

Create a checklist and systematically test each feature.
```

---

## 🚀 PHASE 14: DEPLOYMENT & LAUNCH (Week 24)

### Prompt 41: Production Deployment

```
Prepare for production deployment:

1. Environment setup:
   - Set up production environment variables
   - Configure production database
   - Set up production Stripe account
   - Configure production email service
   - Set up CDN for static assets
   - Configure domain and SSL

2. Database preparation:
   - Run all migrations on production
   - Set up database backups
   - Configure connection pooling
   - Set up monitoring

3. Build optimization:
   - Create production build
   - Minimize and compress assets
   - Set up CDN
   - Configure caching headers
   - Enable gzip compression

4. Deployment checklist:
   - [ ] All environment variables set
   - [ ] Database migrated
   - [ ] SSL certificate installed
   - [ ] Domain configured
   - [ ] Email service configured
   - [ ] Stripe configured
   - [ ] Analytics installed
   - [ ] Error monitoring set up
   - [ ] Backups configured
   - [ ] Security headers set
   - [ ] Rate limiting enabled
   - [ ] All tests passing

5. Monitoring setup:
   - Set up error tracking (Sentry)
   - Set up uptime monitoring
   - Set up performance monitoring
   - Configure alerts
   - Set up logging

6. Create deployment documentation:
   - Deployment process
   - Rollback procedure
   - Environment variables
   - Database management
   - Troubleshooting guide

7. Launch preparation:
   - Create launch announcement
   - Prepare marketing materials
   - Set up support channels
   - Train support team
   - Prepare FAQ updates

Deploy to production and monitor for issues.
```

---

## 📊 COMPLETION CHECKLIST

After completing all 41 prompts, verify:

### ✅ Core Functionality
- [ ] User registration (Seller, Reusse, Admin)
- [ ] Authentication and authorization
- [ ] Profile management
- [ ] Request creation and management
- [ ] Geographic matching
- [ ] Meeting scheduling
- [ ] Item cataloging and inventory
- [ ] Price approval workflow
- [ ] Payment processing (Stripe)
- [ ] Commission calculation
- [ ] In-app messaging
- [ ] Notifications
- [ ] Admin panel
- [ ] Reusse approval system

### ✅ Pages
- [ ] Homepage (landing page)
- [ ] Seller dashboard
- [ ] Reusse dashboard
- [ ] Admin dashboard
- [ ] My Requests
- [ ] My Items / Inventory
- [ ] Messages
- [ ] Earnings
- [ ] Calendar
- [ ] Profile
- [ ] Settings
- [ ] FAQ
- [ ] Contact
- [ ] Terms of Service
- [ ] Privacy Policy

### ✅ Features
- [ ] Multi-language support
- [ ] Search functionality
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Email notifications
- [ ] Analytics
- [ ] Security measures

### ✅ Technical
- [ ] Database schema complete
- [ ] All API endpoints working
- [ ] File uploads working
- [ ] Real-time features (Socket.io)
- [ ] Payment integration (Stripe)
- [ ] Email service configured
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Tests passing
- [ ] Deployed to production

---

## 🎯 NEXT STEPS AFTER MVP

Once MVP is complete, consider these enhancements:

1. **Vinted Integration** - Auto-list items on Vinted
2. **Mobile Apps** - Native iOS and Android apps
3. **Advanced Analytics** - ML-based price predictions
4. **Review System** - Ratings for Reusses and sellers
5. **Subscription Tiers** - Premium features for Reusses
6. **Automated Matching** - AI-powered matching algorithm
7. **Video Calls** - Virtual meetings
8. **Inventory Scanning** - Barcode/QR code scanning
9. **Multi-currency** - Support for other currencies
10. **Internationalization** - Expand to other countries

---

## 💡 TIPS FOR SUCCESS

1. **Test after each prompt** - Don't move forward with bugs
2. **Commit frequently** - Use git for version control
3. **Document as you go** - Update README and docs
4. **Ask for clarification** - If Replit's output is unclear
5. **Iterate and improve** - First version doesn't have to be perfect
6. **Get user feedback** - Test with real users early
7. **Monitor performance** - Keep an eye on speed and errors
8. **Stay organized** - Use project management tools
9. **Backup regularly** - Don't lose your work
10. **Celebrate milestones** - Acknowledge progress!

---

**Good luck building Sellzy! 🚀**
