# Sellzy - Fashion Resale Marketplace

## Overview
Sellzy connects clothing sellers with expert resellers. Sellers submit resale requests, get matched with local resellers, schedule meetings for item pickup, track items through the resale process, and manage earnings.

## Brand Identity
- Primary Navy: #2C3E50 (HSL 210 29% 24%)
- Success Green: #27AE60 (HSL 145 63% 42%)
- Accent Red: #E74C3C (HSL 6 78% 57%)
- Commission Split: 80% seller, 20% Reusse

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js with PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Storage**: Replit Object Storage for file uploads
- **Routing**: wouter (frontend), Express (backend API)

## User Roles
1. **Seller** - Creates service requests, tracks items, views earnings
2. **Reusse** - Accepts requests, adds items, manages listings, earns commission
3. **Admin** - Manages users, approves Reusse applications, views analytics

## Service Types
- Classic: Standard pickup and resale
- Express: Priority handling
- SOS Dressing: Full wardrobe cleanout

## Project Structure
```
shared/
  schema.ts          - All data models (profiles, requests, items, meetings, messages, notifications)
  models/auth.ts     - Auth models (users, sessions)
server/
  routes.ts          - All API endpoints
  storage.ts         - DatabaseStorage implementation
  db.ts              - Database connection
  replit_integrations/ - Auth + Object Storage integrations
client/src/
  App.tsx            - Main app with routing
  pages/             - All page components
  components/        - Reusable components (sidebar, theme)
  hooks/             - Custom hooks (auth, toast, upload)
  lib/               - Utilities (queryClient, auth-utils)
```

## Key Decisions
- Schema-first approach with Drizzle ORM
- Dark sidebar with green accent for brand identity
- Replit Auth only (no custom authentication)
- Subscription/Stripe deferred to Phase 2

## Recent Changes
- Initial MVP build: complete frontend + backend
- Database schema: profiles, requests, items, meetings, messages, notifications
- All pages: landing, onboarding, seller/reusse/admin dashboards, request management, messaging, profile
- API: Full CRUD for all entities with auth middleware
