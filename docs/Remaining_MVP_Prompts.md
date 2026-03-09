# SELLZY MVP - REMAINING IMPLEMENTATION PROMPTS

## Overview

This document contains the **34 remaining prompts** needed to complete the Sellzy MVP. These prompts cover all core marketplace functionality that is currently missing from the application.

**Current Status:** Landing page + informational pages (15% complete)  
**Target:** Full functional marketplace MVP  
**Remaining Work:** 34 prompts across 13 phases

---

## 📋 IMPLEMENTATION STRATEGY

### Recommended Approach

**Phase A: Core Backend (Week 1-2)** - Build foundation  
**Phase B: Seller Flow (Week 3-5)** - Enable sellers to create requests  
**Phase C: Reusse Flow (Week 6-8)** - Enable Reusses to accept and manage  
**Phase D: Payments (Week 9-11)** - Monetization  
**Phase E: Admin & Polish (Week 12-14)** - Management and refinement

---

## 🔴 PHASE A: CORE BACKEND FOUNDATION

These prompts MUST be completed first as all other features depend on them.

---

### Prompt A1: Complete Database Schema and Migrations

```
PRIORITY: CRITICAL - Complete this first before any other features

Review and implement the complete Prisma database schema for Sellzy:

1. Verify Prisma is installed and configured:
   - npm install prisma @prisma/client
   - Initialize if not done: npx prisma init
   - Configure DATABASE_URL in .env

2. Create/update schema.prisma with ALL required models:

```prisma
// User Model
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String?   // Optional if using OAuth only
  role              Role      @default(SELLER)
  isEmailVerified   Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  profile           Profile?
  sentMessages      Message[] @relation("SentMessages")
  receivedMessages  Message[] @relation("ReceivedMessages")
  notifications     Notification[]
  sellerRequests    Request[] @relation("SellerRequests")
  reusseRequests    Request[] @relation("ReusseRequests")
  transactions      Transaction[]
}

enum Role {
  SELLER
  REUSSE
  ADMIN
}

// Profile Model
model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName       String
  lastName        String
  phone           String?
  address         String?
  city            String?
  postalCode      String?
  department      String?
  latitude        Float?
  longitude       Float?
  
  // Reusse-specific fields
  bio             String?
  experience      String?
  siretNumber     String?
  serviceRadius   Int?     // in kilometers
  status          ProfileStatus @default(ACTIVE)
  stripeAccountId String?
  
  photoUrl        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum ProfileStatus {
  PENDING
  ACTIVE
  APPROVED
  REJECTED
  SUSPENDED
}

// Request Model
model Request {
  id              String   @id @default(cuid())
  sellerId        String
  seller          User     @relation("SellerRequests", fields: [sellerId], references: [id])
  reusseId        String?
  reusse          User?    @relation("ReusseRequests", fields: [reusseId], references: [id])
  
  serviceType     ServiceType
  status          RequestStatus @default(PENDING)
  itemCount       Int
  estimatedValue  Float?
  categories      String[] // Array of categories
  condition       String
  brands          String?
  notes           String?
  
  // Meeting preferences
  meetingLocation String?
  preferredDateStart DateTime?
  preferredDateEnd   DateTime?
  preferredTimeSlots String[] // Array of time slots
  specialRequirements String?
  
  meeting         Meeting?
  items           Item[]
  messages        Message[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sellerId])
  @@index([reusseId])
  @@index([status])
}

enum ServiceType {
  CLASSIC
  EXPRESS
  SOS_DRESSING
}

enum RequestStatus {
  PENDING
  MATCHED
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// Meeting Model
model Meeting {
  id          String   @id @default(cuid())
  requestId   String   @unique
  request     Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  
  scheduledDate DateTime
  location      String
  status        MeetingStatus @default(SCHEDULED)
  notes         String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum MeetingStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  RESCHEDULED
}

// Item Model
model Item {
  id              String   @id @default(cuid())
  requestId       String
  request         Request  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  sellerId        String
  reusseId        String?
  
  title           String
  description     String?
  brand           String?
  category        String
  subcategory     String?
  size            String?
  color           String?
  condition       String
  
  photos          String[] // Array of photo URLs
  originalPrice   Float?
  minPrice        Float
  maxPrice        Float
  approvedPrice   Float?
  salePrice       Float?
  
  status          ItemStatus @default(PENDING_APPROVAL)
  platforms       String[] // Where it's listed
  listedAt        DateTime?
  soldAt          DateTime?
  
  transactions    Transaction[]
  commissions     Commission[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([requestId])
  @@index([sellerId])
  @@index([reusseId])
  @@index([status])
}

enum ItemStatus {
  PENDING_APPROVAL
  APPROVED
  DECLINED
  LISTED
  SOLD
  UNSOLD
}

// Transaction Model
model Transaction {
  id              String   @id @default(cuid())
  type            TransactionType
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  itemId          String?
  item            Item?    @relation(fields: [itemId], references: [id])
  
  amount          Float
  status          TransactionStatus @default(PENDING)
  stripePaymentId String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([itemId])
}

enum TransactionType {
  SALE
  PAYOUT
  COMMISSION
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// Commission Model
model Commission {
  id              String   @id @default(cuid())
  itemId          String
  item            Item     @relation(fields: [itemId], references: [id])
  sellerId        String
  reusseId        String
  
  salePrice       Float
  sellerAmount    Float
  reusseAmount    Float
  platformAmount  Float
  
  createdAt       DateTime @default(now())
  
  @@index([itemId])
  @@index([sellerId])
  @@index([reusseId])
}

// Message Model
model Message {
  id          String   @id @default(cuid())
  senderId    String
  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId  String
  receiver    User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  requestId   String?
  request     Request? @relation(fields: [requestId], references: [id])
  
  content     String
  attachments String[] // Array of attachment URLs
  isRead      Boolean  @default(false)
  readAt      DateTime?
  
  createdAt   DateTime @default(now())
  
  @@index([senderId])
  @@index([receiverId])
  @@index([requestId])
}

// Notification Model
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      NotificationType
  title     String
  message   String
  link      String?
  isRead    Boolean  @default(false)
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
}

enum NotificationType {
  REQUEST_RECEIVED
  REQUEST_ACCEPTED
  MEETING_SCHEDULED
  ITEM_SOLD
  PAYMENT_RECEIVED
  MESSAGE_RECEIVED
  PRICE_APPROVAL_NEEDED
  REUSSE_APPROVED
  REUSSE_REJECTED
}
```

3. Run migrations:
   - npx prisma migrate dev --name init
   - npx prisma generate

4. Create seed data (server/prisma/seed.ts):
   - 2 test sellers with complete profiles
   - 2 test Reusses (approved) with complete profiles
   - 1 admin user
   - 2-3 sample requests in different statuses
   - 5-10 sample items
   - Sample messages and notifications

5. Run seed:
   - npx prisma db seed

6. Verify database:
   - npx prisma studio (opens database GUI)
   - Confirm all tables exist
   - Confirm seed data is present

Provide confirmation that database is fully set up and seeded.
```

---

### Prompt A2: API Routes and Middleware Infrastructure

```
PRIORITY: CRITICAL - Required for all API functionality

Set up the complete backend API structure with Express and middleware:

1. Install dependencies:
   - npm install express cors helmet morgan bcryptjs jsonwebtoken
   - npm install --save-dev @types/express @types/cors @types/bcryptjs @types/jsonwebtoken

2. Create server structure in server/src/:

**server/src/index.ts:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import requestRoutes from './routes/request.routes';
import itemRoutes from './routes/item.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Prisma available in requests
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

3. Create middleware files:

**server/src/middleware/auth.middleware.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

**server/src/middleware/error.middleware.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

**server/src/middleware/notFound.middleware.ts:**
```typescript
import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
};
```

4. Create route files (empty for now, will be filled in subsequent prompts):
   - server/src/routes/auth.routes.ts
   - server/src/routes/profile.routes.ts
   - server/src/routes/request.routes.ts
   - server/src/routes/item.routes.ts
   - server/src/routes/message.routes.ts
   - server/src/routes/notification.routes.ts
   - server/src/routes/payment.routes.ts
   - server/src/routes/admin.routes.ts

5. Create utility files:

**server/src/utils/response.ts:**
```typescript
export const success = (data: any, message = 'Success', statusCode = 200) => {
  return { success: true, message, data, statusCode };
};

export const error = (message: string, statusCode = 500, errors?: any) => {
  return { success: false, message, errors, statusCode };
};
```

6. Add environment variables to .env:
   - JWT_SECRET=your_jwt_secret_here
   - CLIENT_URL=http://localhost:5173
   - DATABASE_URL=your_database_url

7. Test server:
   - Start server: npm run dev
   - Test health endpoint: curl http://localhost:3000/health
   - Confirm server starts without errors

Confirm API infrastructure is ready for route implementation.
```

---

### Prompt A3: Authentication System with JWT

```
PRIORITY: CRITICAL - Required for all protected features

Implement complete JWT-based authentication system:

1. Create auth utilities (server/src/utils/auth.ts):
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};
```

2. Create auth controller (server/src/controllers/auth.controller.ts):
```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const prisma = new PrismaClient();

export const registerSeller = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, postalCode, department } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'SELLER',
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            address,
            city,
            postalCode,
            department,
            status: 'ACTIVE'
          }
        }
      },
      include: { profile: true }
    });
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Register seller error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const registerReusse = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, address, city, postalCode, department, bio, experience, siretNumber } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'REUSSE',
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            address,
            city,
            postalCode,
            department,
            bio,
            experience,
            siretNumber,
            status: 'PENDING' // Requires admin approval
          }
        }
      },
      include: { profile: true }
    });
    
    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: 'admin_user_id', // You'll need to get admin ID
        type: 'REUSSE_APPLICATION',
        title: 'New Reusse Application',
        message: `${firstName} ${lastName} has applied to become a Reusse`
      }
    });
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'Application submitted. You will be notified once approved.',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Register Reusse error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if Reusse is approved
    if (user.role === 'REUSSE' && user.profile?.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Your account is pending approval' });
    }
    
    const token = generateToken(user.id, user.email, user.role);
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};
```

3. Create auth routes (server/src/routes/auth.routes.ts):
```typescript
import express from 'express';
import { registerSeller, registerReusse, login, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register/seller', registerSeller);
router.post('/register/reusse', registerReusse);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
```

4. Update frontend to use JWT:
   - Create auth context/service
   - Store token in localStorage
   - Add token to API requests
   - Implement protected routes

5. Test all endpoints:
   - Register as seller
   - Register as Reusse
   - Login as seller
   - Login as Reusse (should fail if pending)
   - Get current user

Confirm authentication system is working end-to-end.
```

---

## 🔴 PHASE B: SELLER DASHBOARD & REQUEST FLOW

Complete seller-facing features to enable request creation and tracking.

---

### Prompt B1: Seller Dashboard Layout and Navigation

[Continue with remaining prompts B1-B7 for seller features...]
### Prompt B2: Request Creation - Service Selection
### Prompt B3: Request Creation - Item Details
### Prompt B4: Request Creation - Meeting Preferences
### Prompt B5: Request Creation - Review and Submit
### Prompt B6: My Requests List Page
### Prompt B7: Request Details Page

---

## 🔴 PHASE C: REUSSE DASHBOARD & WORKFLOW

[Continue with prompts C1-C5 for Reusse features...]
### Prompt C1: Reusse Dashboard Layout
### Prompt C2: Available Requests and Matching System
### Prompt C3: My Clients Management
### Prompt C4: Item Cataloging Interface
### Prompt C5: Inventory Management

---

## 🔴 PHASE D: COMMUNICATION & PAYMENTS

[Continue with prompts D1-D6...]
### Prompt D1: Messaging Backend (Socket.io)
### Prompt D2: Messaging Frontend
### Prompt D3: Notification System
### Prompt D4: Stripe Integration
### Prompt D5: Commission Calculation
### Prompt D6: Earnings Dashboards

---

## 🔴 PHASE E: ADMIN, PROFILE & POLISH

[Continue with prompts E1-E10...]
### Prompt E1: Admin Dashboard
### Prompt E2: User Management
### Prompt E3: Reusse Approval System
### Prompt E4: Profile Management
### Prompt E5: Settings Page
### Prompt E6: Meeting Scheduling
### Prompt E7: Price Approval Workflow
### Prompt E8: Search Functionality
### Prompt E9: Loading States & Error Handling
### Prompt E10: Email Templates

---

## 📊 PRIORITY MATRIX

### MUST HAVE (Blocking MVP):
- A1, A2, A3: Backend foundation
- B1-B7: Seller flow
- C1-C5: Reusse flow
- D4-D5: Payments
- E1-E3: Admin

### SHOULD HAVE (Important):
- D1-D3: Communication
- E4-E5: Profile/Settings
- E6-E7: Meeting/Approval

### NICE TO HAVE (Can defer):
- E8: Search
- E9: Polish
- E10: Emails

---

## 🎯 QUICK START GUIDE

1. **Start with A1** - Database is foundation for everything
2. **Then A2** - API structure needed for all endpoints
3. **Then A3** - Auth required for protected features
4. **Build seller flow** (B1-B7) - Get one side working
5. **Build Reusse flow** (C1-C5) - Complete the marketplace
6. **Add payments** (D4-D5) - Enable monetization
7. **Add admin** (E1-E3) - Platform management
8. **Polish** (remaining) - Improve UX

---

## ⏱️ ESTIMATED TIMELINE

- **Phase A (Backend):** 2 weeks
- **Phase B (Seller):** 3 weeks
- **Phase C (Reusse):** 3 weeks
- **Phase D (Payments):** 2 weeks
- **Phase E (Admin/Polish):** 3 weeks

**Total: 13 weeks to complete MVP**

---

## 💡 TIPS FOR SUCCESS

1. **Complete Phase A first** - Don't skip backend setup
2. **Test each prompt** - Verify before moving on
3. **Use Prisma Studio** - Visualize database as you build
4. **Commit frequently** - Save progress after each prompt
5. **Focus on core flow** - Get basic functionality working first
6. **Add polish later** - Don't get stuck on perfect UI
7. **Ask for help** - If Replit struggles, break prompts into smaller pieces

---

**Ready to build? Start with Prompt A1!** 🚀
