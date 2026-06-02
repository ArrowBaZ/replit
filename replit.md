# Sellzy - Fashion Resale Marketplace

## Overview
Sellzy is a fashion resale marketplace connecting clothing sellers with expert local resellers. It streamlines the resale process from item pickup and tracking to listing management and earnings for both sellers and resellers. The platform aims to simplify the consignment process, offer diverse service types, and provide a transparent, efficient system for second-hand fashion.

## User Preferences
None.

## System Architecture
Sellzy is built with a modern web stack:
- **Frontend**: React, Vite, TailwindCSS, and shadcn/ui for a responsive and consistent user experience. `wouter` is used for client-side routing.
- **Backend**: Express.js handles API endpoints, interacting with a PostgreSQL database via Drizzle ORM.
- **Authentication**: Replit Auth (OpenID Connect) is used for secure user authentication.
- **Storage**: Replit Object Storage manages file uploads, particularly for item photos and certificates.
- **Core Features**:
    - **User Roles**: Differentiated roles for Seller, Reseller (Reusse), and Admin, each with specific functionalities and dashboards.
    - **Service Types**: Offers various resale options including Classic, Express, and SOS Dressing.
    - **Data Management**: A schema-first approach with Drizzle ORM defines all data models (profiles, requests, items, meetings, messages, notifications, reviews, agreements, feeTiers).
    - **File Uploads**: Implements a secure presigned URL flow where clients upload directly to object storage, and the backend stores only metadata. Document downloads are proxied through the backend for authentication and security.
    - **Fee Tier System**: A database-driven, tiered fee structure (e.g., 50/40/10, 55/35/10, 60/30/10 commission splits) replaces hardcoded logic, allowing dynamic commission calculation.
    - **Item Categories**: Supports 16 distinct French item categories, each with dynamic filter fields and specific display logic (e.g., certificate upload for luxury items).
    - **Price Negotiation**: Sellers can review and counter-offer item prices after a reseller finalizes the item list, with iterative negotiation flows until mutual agreement.
    - **Agreement Generation**: Smart agreement generation and digital signing workflow, where agreements are auto-generated once all item prices are approved and signed digitally by both parties. This includes a detailed fee breakdown per item.
    - **Internationalization**: Full multilingual support (English/French) is implemented using `i18n` with language switching capabilities.
    - **Notifications**: Real-time notifications and toasts for key events like counter-offers, price revisions, and document requests, with user-configurable preferences.
    - **Reseller Discovery**: Sellers can discover and review resellers based on aggregated stats and multi-dimensional ratings.
    - **Admin Tools**: Admin users have capabilities to manage users, approve reseller applications, view analytics, manage fee tiers, and moderate requests.
    - **Request Workflow**: Multi-step request creation wizard, item photo uploads with guidance, meeting management, and detailed request/item lifecycle tracking.

## Database Setup

To initialise a fresh database or after any schema changes, run the seed script — it automatically applies pending schema migrations before inserting demo data:

```bash
npx tsx server/seed.ts
```

The script will:
1. Run `drizzle-kit push --force` to bring the database schema in line with `shared/schema.ts`.
2. Insert demo users and sample data if they do not already exist.

**Never run the seed directly without the migration step.** If new columns are added to `shared/schema.ts` and the seed is run against an outdated database, it will fail with "column does not exist" errors. The built-in migration step prevents this.

Demo credentials inserted by the seed:
- Reseller: `reseller@sellzy.demo` / `password123`
- Seller: `seller@sellzy.demo` / `password123`

## External Dependencies
- **Replit Auth**: For user authentication and authorization.
- **Replit Object Storage**: For storing item photos, certificates, and other documents.
- **PostgreSQL**: The primary database for all application data.
- **Resend/SendGrid**: Planned integration for email notifications (currently mocked).