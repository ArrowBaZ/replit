# REUSSES.COM - EXHAUSTIVE REPLIT PROMPTS

## How to Use These Prompts

1. **Sequential Execution**: Execute prompts in order - each builds on previous work
2. **One Prompt at a Time**: Don't combine prompts - let Replit complete each fully
3. **Review Before Next**: Check the output before moving to the next prompt
4. **Customize as Needed**: Adjust prompts based on Replit's responses
5. **Save Progress**: Replit auto-saves, but commit to git regularly

---

## PHASE 1: FOUNDATION & SETUP

### Prompt 1.1: Initialize Project Structure

```
Create a full-stack TypeScript application for a marketplace platform called "Reusses" that connects clothing sellers with expert resellers. 

Set up the following structure:
- Frontend: React 18 with TypeScript, Vite, React Router v6, Tailwind CSS
- Backend: Node.js with Express and TypeScript
- Database: PostgreSQL with Prisma ORM
- Shared types between frontend and backend

Initialize the project with:
1. Separate client and server directories
2. Configure TypeScript for both
3. Set up Tailwind CSS with a custom color scheme (primary: #2C3E50, secondary: #27AE60, accent: #E74C3C)
4. Create a basic Express server with CORS enabled
5. Initialize Prisma with PostgreSQL
6. Add necessary npm scripts for development
7. Create a basic folder structure with components, pages, services, controllers, routes, middleware

Include a README with setup instructions.
```

### Prompt 1.2: Database Schema - Core Tables

```
Using Prisma, create a comprehensive database schema for the Reusses marketplace with the following models:

1. **User** model:
   - id (UUID, primary key)
   - email (unique, required)
   - password (hashed, required)
   - role (enum: SELLER, REUSSE, ADMIN)
   - isEmailVerified (boolean, default false)
   - createdAt, updatedAt timestamps

2. **Profile** model:
   - id (UUID, primary key)
   - userId (foreign key to User)
   - firstName, lastName (required)
   - phone (required)
   - address, city, postalCode, department (required)
   - latitude, longitude (for geographic matching)
   - profilePhoto (optional URL)
   - bio (optional text)
   - For Reusses: experience, status (enum: PENDING, APPROVED, REJECTED), siretNumber
   - For Sellers: preferredContactMethod

3. **Request** model:
   - id (UUID, primary key)
   - sellerId (foreign key to User)
   - reusseId (foreign key to User, nullable)
   - serviceType (enum: CLASSIC, EXPRESS, SOS_DRESSING)
   - status (enum: PENDING, MATCHED, SCHEDULED, COMPLETED, CANCELLED)
   - itemCount (integer)
   - estimatedValue (decimal, optional)
   - meetingLocation (text, optional)
   - notes (text, optional)
   - createdAt, updatedAt, completedAt timestamps

4. **Meeting** model:
   - id (UUID, primary key)
   - requestId (foreign key to Request)
   - scheduledDate (datetime)
   - location (text)
   - duration (integer, minutes)
   - status (enum: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED)
   - notes (text, optional)

Generate the Prisma schema file and create a migration. Include proper relations and indexes for performance.
```

### Prompt 1.3: Database Schema - Items & Transactions

```
Extend the Prisma schema with additional models for inventory and financial management:

1. **Item** model:
   - id (UUID, primary key)
   - requestId (foreign key to Request)
   - sellerId (foreign key to User)
   - reusseId (foreign key to User)
   - title (required)
   - description (text)
   - brand (optional)
   - size (optional)
   - category (enum: CLOTHING, SHOES, ACCESSORIES)
   - condition (enum: NEW, EXCELLENT, GOOD, FAIR)
   - photos (array of URLs)
   - minPrice, maxPrice (decimal)
   - approvedPrice (decimal, nullable)
   - priceApprovedBySeller (boolean, default false)
   - status (enum: PENDING_APPROVAL, APPROVED, LISTED, SOLD, UNSOLD, RETURNED, DONATED)
   - listedAt, soldAt (datetime, nullable)
   - salePrice (decimal, nullable)
   - platformListedOn (text, optional)
   - createdAt, updatedAt timestamps

2. **Transaction** model:
   - id (UUID, primary key)
   - type (enum: SALE, SERVICE_FEE, SUBSCRIPTION, WITHDRAWAL, COMMISSION)
   - userId (foreign key to User)
   - itemId (foreign key to Item, nullable)
   - amount (decimal, required)
   - currency (default: EUR)
   - status (enum: PENDING, COMPLETED, FAILED, REFUNDED)
   - stripePaymentId (text, nullable)
   - description (text)
   - createdAt, completedAt timestamps

3. **Commission** model:
   - id (UUID, primary key)
   - itemId (foreign key to Item)
   - sellerId (foreign key to User)
   - reusseId (foreign key to User)
   - salePrice (decimal)
   - sellerAmount (decimal)
   - reusseAmount (decimal)
   - platformAmount (decimal)
   - status (enum: PENDING, PAID, DISPUTED)
   - paidAt (datetime, nullable)

4. **Subscription** model:
   - id (UUID, primary key)
   - reusseId (foreign key to User)
   - tier (enum: FREE, TIER_1, TIER_2, TIER_3, TIER_4, TIER_5)
   - activeRequestCount (integer)
   - monthlyFee (decimal)
   - status (enum: ACTIVE, CANCELLED, SUSPENDED)
   - currentPeriodStart, currentPeriodEnd (datetime)
   - stripeSubscriptionId (text, nullable)

Generate the updated schema and migration.
```

### Prompt 1.4: Database Schema - Communication & Admin

```
Complete the Prisma schema with communication and administrative models:

1. **Message** model:
   - id (UUID, primary key)
   - senderId (foreign key to User)
   - receiverId (foreign key to User)
   - requestId (foreign key to Request, nullable)
   - content (text, required)
   - attachments (array of URLs, optional)
   - isRead (boolean, default false)
   - readAt (datetime, nullable)
   - createdAt timestamp

2. **Notification** model:
   - id (UUID, primary key)
   - userId (foreign key to User)
   - type (enum: REQUEST_RECEIVED, REQUEST_ACCEPTED, MEETING_SCHEDULED, ITEM_SOLD, PAYMENT_RECEIVED, MESSAGE_RECEIVED, PRICE_APPROVAL_NEEDED)
   - title (text, required)
   - message (text, required)
   - link (text, optional)
   - isRead (boolean, default false)
   - createdAt timestamp

3. **AdminLog** model:
   - id (UUID, primary key)
   - adminId (foreign key to User)
   - action (text, required)
   - targetType (enum: USER, REQUEST, ITEM, TRANSACTION)
   - targetId (UUID)
   - details (JSON, optional)
   - createdAt timestamp

4. **FAQ** model:
   - id (UUID, primary key)
   - question (text, required)
   - answer (text, required)
   - category (text)
   - order (integer)
   - isPublished (boolean, default true)
   - createdAt, updatedAt timestamps

5. **Testimonial** model:
   - id (UUID, primary key)
   - userId (foreign key to User, nullable)
   - name (text, required)
   - role (enum: SELLER, REUSSE)
   - content (text, required)
   - rating (integer, 1-5)
   - isApproved (boolean, default false)
   - isFeatured (boolean, default false)
   - createdAt timestamp

Generate the complete schema, run migrations, and generate Prisma Client.
```

### Prompt 1.5: Environment Configuration

```
Set up environment configuration for the Reusses application:

1. Create a `.env.example` file with all required environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - JWT_EXPIRES_IN
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - SENDGRID_API_KEY
   - SENDGRID_FROM_EMAIL
   - CLIENT_URL
   - SERVER_URL
   - NODE_ENV

2. Create a config utility file that loads and validates environment variables

3. Add instructions in README for setting up Replit Secrets

4. Create a configuration object that exports typed config values for use throughout the application

Include proper TypeScript types for the config.
```

---

## PHASE 2: AUTHENTICATION & USER MANAGEMENT

### Prompt 2.1: Authentication Utilities

```
Create a complete authentication system with the following utilities:

1. **Password Hashing** (utils/password.ts):
   - hashPassword function using bcrypt (10 rounds)
   - comparePassword function
   - Include proper error handling

2. **JWT Utilities** (utils/jwt.ts):
   - generateToken function (includes userId, email, role)
   - verifyToken function
   - refreshToken function
   - Token expiration: 7 days

3. **Validation Utilities** (utils/validation.ts):
   - validateEmail (proper email format)
   - validatePassword (min 8 chars, 1 uppercase, 1 number, 1 special char)
   - validatePhone (French phone format)
   - validatePostalCode (French postal code format)

4. **Auth Middleware** (middleware/auth.ts):
   - authenticate middleware (verifies JWT)
   - requireRole middleware (checks user role)
   - attachUser middleware (adds user to request)

All functions should be fully typed with TypeScript and include error handling.
```

### Prompt 2.2: User Registration - Seller

```
Create the seller registration flow:

1. **Backend Route** (routes/auth.ts):
   - POST /api/auth/register/seller
   - Accepts: email, password, firstName, lastName, phone, address, city, postalCode, department
   - Validates all inputs
   - Checks if email already exists
   - Hashes password
   - Creates User and Profile records
   - Returns JWT token and user data (without password)

2. **Controller** (controllers/authController.ts):
   - registerSeller function
   - Proper error handling with appropriate HTTP status codes
   - Transaction support (rollback if profile creation fails)

3. **Frontend Service** (client/src/services/authService.ts):
   - registerSeller API call function
   - Stores token in localStorage
   - Returns user data

4. **Frontend Component** (client/src/pages/auth/SellerRegister.tsx):
   - Multi-step registration form
   - Step 1: Email & Password
   - Step 2: Personal Information
   - Step 3: Address Information
   - Form validation with error messages
   - Loading states
   - Redirect to dashboard on success

Use React Hook Form for form management and Zod for validation. Style with Tailwind CSS.
```

### Prompt 2.3: User Registration - Reusse

```
Create the Reusse registration flow with additional fields:

1. **Backend Route** (routes/auth.ts):
   - POST /api/auth/register/reusse
   - Accepts all seller fields PLUS: bio, experience, siretNumber (optional)
   - Creates User with role REUSSE
   - Creates Profile with status PENDING (requires admin approval)
   - Sends notification to admins about new Reusse application

2. **Controller** (controllers/authController.ts):
   - registerReusse function
   - Creates pending approval notification
   - Sends welcome email explaining approval process

3. **Frontend Component** (client/src/pages/auth/ReusseRegister.tsx):
   - Multi-step registration form
   - Step 1: Email & Password
   - Step 2: Personal Information
   - Step 3: Address & Service Area
   - Step 4: Experience & Bio
   - Step 5: Legal Information (SIRET optional, can add later)
   - Success message explaining approval process
   - Different styling to distinguish from seller registration

4. **Email Template**:
   - Create welcome email template for Reusses
   - Explains next steps and approval timeline

Include proper TypeScript types for all request/response bodies.
```

### Prompt 2.4: Login System

```
Create a unified login system for all user types:

1. **Backend Route** (routes/auth.ts):
   - POST /api/auth/login
   - Accepts: email, password
   - Validates credentials
   - Checks if user exists
   - Compares password
   - For Reusses: checks if approved (status === APPROVED)
   - Returns JWT token, user data, and profile data
   - Updates lastLoginAt timestamp

2. **Controller** (controllers/authController.ts):
   - login function
   - Proper error messages:
     - "Invalid credentials" (don't specify if email or password is wrong)
     - "Your account is pending approval" (for pending Reusses)
     - "Your account has been rejected" (for rejected Reusses)

3. **Frontend Service** (client/src/services/authService.ts):
   - login function
   - Stores token and user data
   - Sets up axios default headers with token

4. **Frontend Component** (client/src/pages/auth/Login.tsx):
   - Email and password fields
   - "Remember me" checkbox
   - "Forgot password?" link
   - Loading state during login
   - Error message display
   - Redirect based on user role:
     - SELLER → /seller/dashboard
     - REUSSE → /reusse/dashboard
     - ADMIN → /admin/dashboard
   - Links to registration pages

5. **Protected Route Component** (client/src/components/ProtectedRoute.tsx):
   - Checks if user is authenticated
   - Redirects to login if not
   - Can specify required role

Style with Tailwind CSS, include proper form validation.
```

### Prompt 2.5: Logout & Session Management

```
Implement logout and session management:

1. **Backend Route** (routes/auth.ts):
   - POST /api/auth/logout
   - Clears any server-side session data
   - Returns success message

2. **Frontend Service** (client/src/services/authService.ts):
   - logout function
   - Clears localStorage (token, user data)
   - Clears axios default headers
   - Redirects to homepage

3. **Auth Context** (client/src/context/AuthContext.tsx):
   - Create React Context for authentication state
   - Provides: user, isAuthenticated, login, logout, register
   - Persists auth state across page refreshes
   - Checks token validity on app load
   - Auto-logout if token expired

4. **Auth Hook** (client/src/hooks/useAuth.ts):
   - Custom hook to access auth context
   - Provides type-safe access to auth state and methods

5. **Header Component** (client/src/components/Header.tsx):
   - Shows different navigation based on auth state
   - Logged out: Login, Register buttons
   - Logged in: User menu with profile, dashboard, logout
   - Different menu items based on user role

Implement proper TypeScript types for all context values.
```

### Prompt 2.6: Password Reset Flow

```
Create a complete password reset system:

1. **Backend Routes** (routes/auth.ts):
   - POST /api/auth/forgot-password
     - Accepts: email
     - Generates reset token (6-digit code or UUID)
     - Stores token in database with expiration (1 hour)
     - Sends email with reset link/code
   
   - POST /api/auth/reset-password
     - Accepts: token, newPassword
     - Validates token and expiration
     - Updates password
     - Invalidates token
     - Sends confirmation email

2. **Database Update**:
   - Add to User model: resetToken, resetTokenExpiry

3. **Controllers** (controllers/authController.ts):
   - forgotPassword function
   - resetPassword function
   - Proper error handling for invalid/expired tokens

4. **Email Templates**:
   - Password reset email with link
   - Password changed confirmation email

5. **Frontend Pages**:
   - ForgotPassword.tsx: Email input form
   - ResetPassword.tsx: New password form (gets token from URL)
   - Success messages and error handling
   - Password strength indicator

6. **Email Service** (server/src/services/emailService.ts):
   - sendPasswordResetEmail function
   - sendPasswordChangedEmail function
   - Use SendGrid or similar

Include proper validation and security measures.
```

### Prompt 2.7: Profile Management

```
Create profile viewing and editing functionality:

1. **Backend Routes** (routes/profile.ts):
   - GET /api/profile/me (get current user's profile)
   - PUT /api/profile/me (update current user's profile)
   - PATCH /api/profile/photo (update profile photo)
   - GET /api/profile/:userId (get any user's public profile)

2. **Controllers** (controllers/profileController.ts):
   - getMyProfile: Returns user + profile data
   - updateMyProfile: Updates allowed fields only
   - uploadProfilePhoto: Handles image upload to Cloudinary
   - getPublicProfile: Returns public profile data

3. **Image Upload** (middleware/upload.ts):
   - Multer configuration for file uploads
   - Cloudinary integration
   - Image validation (size, type)
   - Image optimization

4. **Frontend Pages**:
   - ProfileView.tsx: Display profile information
   - ProfileEdit.tsx: Edit form with sections:
     - Personal Information
     - Contact Information
     - Address
     - For Reusses: Bio, Experience, SIRET
   - Photo upload with preview
   - Form validation
   - Success/error messages

5. **Frontend Service** (client/src/services/profileService.ts):
   - getProfile, updateProfile, uploadPhoto functions

Ensure sellers can't edit Reusse-specific fields and vice versa.
```

---

## PHASE 3: PUBLIC WEBSITE

### Prompt 3.1: Homepage - Hero Section

```
Create a compelling homepage hero section:

1. **Frontend Component** (client/src/pages/public/Home.tsx):
   - Hero section with:
     - Main headline: "Nous vendons vos vêtements à votre place"
     - Subheadline: "Confiez vos vêtements à une Reusse experte"
     - Two prominent CTAs:
       - "Faire appel à une Reusse" (primary button)
       - "Devenir une Reusse" (secondary button)
     - Hero image showing people exchanging clothes
   
   - Statistics section:
     - "40,000+ vêtements revendus"
     - "70+ départements couverts"
     - "92% de satisfaction"
     - Animated counters for visual appeal

2. **Styling**:
   - Modern, clean design with Tailwind CSS
   - Responsive layout (mobile-first)
   - Gradient background
   - Smooth animations on scroll
   - Professional typography

3. **Components**:
   - Button.tsx: Reusable button component
   - StatCard.tsx: Statistic display component

Make it visually appealing and conversion-focused.
```

### Prompt 3.2: Homepage - How It Works

```
Create the "How It Works" section for the homepage:

1. **Frontend Component** (client/src/components/public/HowItWorks.tsx):
   - Section title: "Vendre vos vêtements n'a jamais été aussi simple"
   - 4-step process visualization:
     
     Step 1: "Envoyez gratuitement votre demande"
     - Icon: Form/Document
     - Description: "Faites appel à une Reusse proche de chez vous en 3 clics"
     
     Step 2: "Confiez vos vêtements à votre Reusse"
     - Icon: Handshake/Delivery
     - Description: "Votre vendeuse récupère vos articles à domicile et les stocke chez elle"
     
     Step 3: "Vos pépites sont mises en vente"
     - Icon: Camera/Shopping
     - Description: "Votre Reusse se charge de tout : suggestion des prix, photos, mise en ligne"
     
     Step 4: "Recevez les bénéfices de vos ventes"
     - Icon: Money/Wallet
     - Description: "Vous touchez entre 40% et 70% des prix de vente en fin de vente, sans frais"

2. **Design**:
   - Vertical timeline on mobile
   - Horizontal flow on desktop
   - Icons with circular backgrounds
   - Connecting lines between steps
   - Animations on scroll

3. **Components**:
   - ProcessStep.tsx: Individual step component
   - Include hover effects and transitions

Make it clear, visual, and easy to understand.
```

### Prompt 3.3: Homepage - Reusse Profiles Showcase

```
Create a showcase of top Reusses:

1. **Backend Route** (routes/public.ts):
   - GET /api/public/featured-reusses
   - Returns 5-6 top-performing Reusses
   - Includes: name, location, photo, stats (items sold, total revenue, member since)
   - Only approved Reusses with isFeatured flag

2. **Controller** (controllers/publicController.ts):
   - getFeaturedReusses function
   - Sorts by performance metrics
   - Returns public profile data only

3. **Frontend Component** (client/src/components/public/ReusseShowcase.tsx):
   - Section title: "La communauté de vendeuses Reusses"
   - Subtitle: "Vendre en ligne, c'est tout un art ! Et nos Reusses le maîtrisent."
   - Grid/carousel of Reusse cards showing:
     - Profile photo
     - Name
     - Location (city, department)
     - "Reusse depuis [date]"
     - "[X] articles vendus pour [Y]€"
   - Horizontal scroll on mobile, grid on desktop

4. **Components**:
   - ReusseCard.tsx: Individual Reusse profile card
   - Carousel.tsx: Reusable carousel component

5. **Styling**:
   - Professional headshots
   - Clean card design
   - Subtle shadows and hover effects
   - Trust-building visual design

Include loading states and error handling.
```

### Prompt 3.4: Homepage - Testimonials Section

```
Create a testimonials section with real customer reviews:

1. **Backend Route** (routes/public.ts):
   - GET /api/public/testimonials
   - Returns approved and featured testimonials
   - Includes: name, role (seller/reusse), content, rating

2. **Controller** (controllers/publicController.ts):
   - getTestimonials function
   - Filters for approved and featured only
   - Random selection or ordered by date

3. **Frontend Component** (client/src/components/public/Testimonials.tsx):
   - Section title: "L'avis de nos clients"
   - 3 testimonial cards displayed prominently
   - Each card shows:
     - Name
     - Role badge (Seller or Reusse)
     - Star rating (visual)
     - Quote/review text
     - Optional photo
   - Rotating carousel or static grid

4. **Components**:
   - TestimonialCard.tsx: Individual testimonial
   - StarRating.tsx: Visual star rating component

5. **Styling**:
   - Quote marks or speech bubble design
   - Warm, trustworthy colors
   - Readable typography
   - Responsive layout

Add subtle animations for engagement.
```

### Prompt 3.5: FAQ Page

```
Create a comprehensive FAQ page:

1. **Backend Route** (routes/public.ts):
   - GET /api/public/faq
   - Returns all published FAQs
   - Grouped by category
   - Ordered by order field

2. **Controller** (controllers/publicController.ts):
   - getFAQs function
   - Groups FAQs by category
   - Returns structured data

3. **Frontend Page** (client/src/pages/public/FAQ.tsx):
   - Page title: "Les réponses à vos questions"
   - Categories:
     - "Pour les vendeurs"
     - "Pour les Reusses"
     - "Paiements et commissions"
     - "Processus de vente"
   - Accordion-style Q&A:
     - Click to expand/collapse
     - Smooth animations
     - Search functionality
   - CTA at bottom: "Vous ne trouvez pas votre réponse ? Contactez-nous"

4. **Components**:
   - FAQAccordion.tsx: Expandable Q&A component
   - FAQSearch.tsx: Search/filter functionality
   - FAQCategory.tsx: Category section

5. **Content** (seed data):
   - Add the FAQ content from the website analysis:
     - "Quels articles puis-je confier à ma Reusse ?"
     - "Quel pourcentage vais-je toucher sur mes ventes ?"
     - "Qui fixe les prix ?"
     - "Comment et quand recevoir le bénéfice de mes ventes ?"
     - etc.

Include proper SEO meta tags and structured data.
```

### Prompt 3.6: Contact Form

```
Create a functional contact form:

1. **Backend Route** (routes/public.ts):
   - POST /api/public/contact
   - Accepts: name, email, subject, message, userType (seller/reusse/other)
   - Validates inputs
   - Sends email to support team
   - Stores in database for tracking
   - Sends auto-reply to user

2. **Database Model**:
   - Add ContactMessage model:
     - id, name, email, subject, message, userType, status, createdAt

3. **Controller** (controllers/publicController.ts):
   - submitContactForm function
   - Email notification to admin
   - Auto-reply to user

4. **Frontend Page** (client/src/pages/public/Contact.tsx):
   - Form fields:
     - Name (required)
     - Email (required, validated)
     - Subject (required)
     - Message (required, textarea)
     - "Je suis..." dropdown (Vendeur/Reusse/Autre)
   - Form validation with error messages
   - Submit button with loading state
   - Success message after submission
   - reCAPTCHA or honeypot for spam prevention

5. **Email Templates**:
   - Admin notification email
   - User auto-reply email

6. **Styling**:
   - Clean, accessible form design
   - Clear labels and placeholders
   - Error states
   - Success confirmation

Include rate limiting to prevent spam.
```

### Prompt 3.7: Legal Pages

```
Create Terms & Conditions and Privacy Policy pages:

1. **Frontend Pages**:
   - TermsAndConditions.tsx (client/src/pages/public/Terms.tsx)
   - PrivacyPolicy.tsx (client/src/pages/public/Privacy.tsx)

2. **Content Structure for Terms**:
   - Introduction
   - Definitions
   - Service Description
   - User Obligations (Sellers)
   - User Obligations (Reusses)
   - Pricing and Commissions
   - Payment Terms
   - Liability
   - Dispute Resolution
   - Termination
   - Governing Law
   - Contact Information

3. **Content Structure for Privacy**:
   - Introduction
   - Data Controller Information
   - Data Collected
   - Purpose of Data Collection
   - Legal Basis (GDPR)
   - Data Retention
   - User Rights
   - Cookies Policy
   - Third-party Services (Stripe, Cloudinary, SendGrid)
   - Data Security
   - Contact for Privacy Concerns

4. **Components**:
   - LegalSection.tsx: Reusable section component
   - TableOfContents.tsx: Navigation within document

5. **Styling**:
   - Professional, readable typography
   - Clear hierarchy (h1, h2, h3)
   - Table of contents with anchor links
   - Print-friendly layout
   - Last updated date

6. **Footer Links**:
   - Update Footer component to include links to these pages

Note: Include placeholder legal text with [PLACEHOLDER] markers for lawyer review.
```

---

## PHASE 4: CORE MARKETPLACE - SELLER FLOW

### Prompt 4.1: Service Selection Page

```
Create the service tier selection page for sellers:

1. **Frontend Page** (client/src/pages/seller/ServiceSelection.tsx):
   - Page title: "Choix du service"
   - Progress indicator: Step 1 of 4
   - Three service options displayed as cards:

   **OPTION 1 - Demande Classique** (FREE):
   - Time: 5-10 min + 15 min meeting
   - Description: "J'ai déjà fait mon tri, j'ai identifié les pièces de valeur"
   - Features:
     - ✓ Récupération à domicile
     - ✓ Mise en vente par la Reusse
     - ✓ Suivi des ventes
   - Price: GRATUIT
   - CTA: "Je continue avec l'option 1"

   **OPTION 2 - Demande Express** (15€):
   - Time: <2 min + 5 min meeting
   - Description: "J'ai fait mon tri mais pas le temps de lister mes articles"
   - Features:
     - ✓ Récupération à domicile
     - ✓ Inventaire par la Reusse
     - ✓ Mise en vente par la Reusse
   - Price: 15€
   - CTA: "Je continue avec l'option 2"

   **OPTION 3 - SOS Dressing** (40€):
   - Time: <2 min + 30min-1h meeting
   - Description: "Je ne sais pas quelles pièces ont de la valeur"
   - Features:
     - ✓ Consultation à domicile
     - ✓ Tri et sélection par la Reusse
     - ✓ Inventaire complet
     - ✓ Mise en vente
   - Price: 40€
   - CTA: "Je continue avec l'option 3"

2. **State Management**:
   - Store selected service in context or state
   - Pass to next step

3. **Components**:
   - ServiceCard.tsx: Individual service option
   - PriceTag.tsx: Price display component
   - ProgressIndicator.tsx: Multi-step progress bar

4. **Styling**:
   - Card-based layout
   - Highlight recommended option
   - Clear pricing
   - Responsive grid (1 col mobile, 3 col desktop)
   - Hover effects

Include modal with more details about each service.
```

### Prompt 4.2: Item Listing Form - Classic Service

```
Create the item listing form for classic service (seller lists items):

1. **Frontend Page** (client/src/pages/seller/ItemListingForm.tsx):
   - Page title: "Détails de votre demande"
   - Progress indicator: Step 2 of 4
   - Form to add multiple items:
     - "Ajouter un article" button
     - Dynamic form fields for each item:
       - Photos (up to 5 per item, drag & drop)
       - Titre/Description
       - Marque
       - Taille
       - Catégorie (dropdown: Vêtements, Chaussures, Accessoires)
       - Condition (dropdown: Neuf, Excellent, Bon, Correct)
       - Prix estimé (optional)
     - Remove item button
   - Minimum 8 items, maximum 40 items
   - Item counter display
   - "Ajouter un autre article" button
   - Navigation: Back / Continue

2. **Image Upload**:
   - Drag and drop interface
   - Image preview before upload
   - Upload to Cloudinary
   - Progress indicator
   - Image validation (max 5MB, jpg/png)

3. **Form Validation**:
   - Required fields marked
   - Real-time validation
   - Error messages
   - Prevent submission if invalid

4. **State Management**:
   - Store items array in form state
   - Persist to localStorage (draft saving)

5. **Components**:
   - ItemForm.tsx: Single item form
   - ImageUploader.tsx: Drag & drop image upload
   - ItemList.tsx: List of added items with edit/delete

6. **Styling**:
   - Clean, organized form layout
   - Visual separation between items
   - Mobile-friendly inputs
   - Clear CTAs

Include auto-save functionality to prevent data loss.
```

### Prompt 4.3: Meeting Scheduling

```
Create the meeting scheduling interface:

1. **Frontend Page** (client/src/pages/seller/MeetingSchedule.tsx):
   - Page title: "Planification du rendez-vous"
   - Progress indicator: Step 3 of 4
   - Form fields:
     - Preferred date (date picker, minimum tomorrow)
     - Preferred time slot (dropdown: Matin 9h-12h, Après-midi 14h-18h, Soir 18h-20h)
     - Meeting location options:
       - Radio: "À mon domicile" (default, uses profile address)
       - Radio: "Autre lieu" (text input for address)
     - Duration estimate (auto-calculated based on item count)
     - Special instructions (textarea, optional)
   - Display: "Durée estimée: ~15 minutes" (or 30min/1h based on service)
   - Navigation: Back / Continue

2. **Date Picker**:
   - Calendar interface
   - Disable past dates
   - Highlight available dates
   - Mobile-friendly

3. **Components**:
   - DatePicker.tsx: Calendar component
   - TimeSlotSelector.tsx: Time slot selection
   - LocationInput.tsx: Address input with autocomplete

4. **Validation**:
   - Ensure date is in future
   - Require time slot
   - Validate address if "Autre lieu" selected

5. **State Management**:
   - Store meeting details
   - Combine with previous form data

Include a summary of selected date/time/location.
```

### Prompt 4.4: Request Summary & Submission

```
Create the final review and submission page:

1. **Frontend Page** (client/src/pages/seller/RequestSummary.tsx):
   - Page title: "Récapitulatif de votre demande"
   - Progress indicator: Step 4 of 4
   - Summary sections:
     
     **Service choisi:**
     - Service type and price
     - Features included
     
     **Vos articles:** (for Classic service)
     - Count: "X articles"
     - List with thumbnails
     - Edit button to go back
     
     **Rendez-vous:**
     - Date and time
     - Location
     - Duration
     - Edit button
     
     **Conditions:**
     - Commission structure explanation
     - Expected timeline (2-3 months)
     - Checkbox: "J'accepte les conditions générales"
     - Checkbox: "Je comprends que je toucherai 40-70% du prix de vente"
   
   - Total cost (if Express or SOS service)
   - Submit button: "Envoyer ma demande"

2. **Backend Route** (routes/requests.ts):
   - POST /api/requests
   - Creates Request record
   - Creates Item records (if Classic service)
   - Creates Meeting record
   - If paid service: Creates Transaction record
   - Sends confirmation email to seller
   - Notifies nearby Reusses

3. **Controller** (controllers/requestController.ts):
   - createRequest function
   - Transaction handling (all or nothing)
   - Notification creation
   - Email sending

4. **Success Page**:
   - Confirmation message
   - Request ID
   - Next steps explanation
   - "Retour au tableau de bord" button

5. **Payment Integration** (if Express/SOS):
   - Stripe payment form
   - Secure payment processing
   - Payment confirmation

Include loading states and error handling.
```

### Prompt 4.5: Seller Dashboard - Overview

```
Create the seller dashboard homepage:

1. **Frontend Page** (client/src/pages/seller/Dashboard.tsx):
   - Welcome message: "Bonjour [FirstName]!"
   - Quick stats cards:
     - Active requests
     - Items in sale
     - Items sold
     - Total earnings
   
   - Recent activity section:
     - Latest request status
     - Recent sales
     - Pending actions (price approvals needed)
   
   - Quick actions:
     - "Nouvelle demande" button
     - "Voir mes ventes" link
     - "Contacter ma Reusse" link

2. **Backend Route** (routes/seller.ts):
   - GET /api/seller/dashboard
   - Returns:
     - User stats
     - Recent requests
     - Recent items sold
     - Pending price approvals
     - Total earnings

3. **Controller** (controllers/sellerController.ts):
   - getDashboard function
   - Aggregates data from multiple tables
   - Calculates stats

4. **Components**:
   - StatCard.tsx: Stat display with icon
   - ActivityFeed.tsx: Recent activity list
   - QuickActions.tsx: Action buttons

5. **Styling**:
   - Clean, modern dashboard
   - Card-based layout
   - Icons for visual appeal
   - Responsive grid

Include skeleton loading states.
```

### Prompt 4.6: My Requests Page

```
Create a page to view all seller requests:

1. **Frontend Page** (client/src/pages/seller/MyRequests.tsx):
   - Page title: "Mes demandes"
   - Filter/sort options:
     - Status filter (All, Pending, Matched, In Progress, Completed)
     - Sort by date
   - Request list showing:
     - Request ID
     - Service type
     - Status badge (color-coded)
     - Date created
     - Item count
     - Matched Reusse (if matched)
     - Meeting date (if scheduled)
     - Actions: View details, Message Reusse, Cancel
   - Pagination or infinite scroll

2. **Backend Route** (routes/seller.ts):
   - GET /api/seller/requests
   - Query params: status, page, limit, sort
   - Returns paginated requests with related data

3. **Controller** (controllers/sellerController.ts):
   - getMyRequests function
   - Includes Request, Meeting, Reusse profile data
   - Filters and sorts

4. **Request Detail Modal**:
   - Full request details
   - Timeline of status changes
   - Item list
   - Meeting information
   - Reusse contact info
   - Message button

5. **Components**:
   - RequestCard.tsx: Individual request display
   - StatusBadge.tsx: Color-coded status
   - RequestDetailModal.tsx: Detail view

Include empty state when no requests exist.
```

### Prompt 4.7: My Items & Sales Page

```
Create a page to view all items and sales:

1. **Frontend Page** (client/src/pages/seller/MyItems.tsx):
   - Page title: "Mes articles"
   - Tabs:
     - "En attente d'approbation" (pending price approval)
     - "En vente" (listed)
     - "Vendus" (sold)
     - "Invendus" (unsold)
   
   - Item grid/list showing:
     - Photo thumbnail
     - Title
     - Brand
     - Proposed price (if pending approval)
     - Listed price
     - Sale price (if sold)
     - Status
     - Platform (Vinted, etc.)
     - Date listed/sold
     - Actions: View, Approve price, Message Reusse

2. **Backend Route** (routes/seller.ts):
   - GET /api/seller/items
   - Query params: status, requestId
   - Returns items with related data

3. **Controller** (controllers/sellerController.ts):
   - getMyItems function
   - Filters by status
   - Includes item photos and details

4. **Price Approval Interface**:
   - Shows Reusse's suggested price
   - Approve or counter-offer
   - Explanation of pricing

5. **Components**:
   - ItemCard.tsx: Item display card
   - PriceApprovalModal.tsx: Approve/reject pricing
   - ItemDetailModal.tsx: Full item details

6. **Sales Summary**:
   - Total items sold
   - Total revenue
   - Average sale price
   - Commission breakdown

Include filtering and search functionality.
```

---

## PHASE 5: CORE MARKETPLACE - REUSSE FLOW

### Prompt 5.1: Reusse Dashboard - Overview

```
Create the Reusse dashboard with different features than seller:

1. **Frontend Page** (client/src/pages/reusse/Dashboard.tsx):
   - Welcome message: "Bonjour [FirstName]!"
   - Quick stats cards:
     - Active clients
     - Items in inventory
     - Items sold this month
     - Earnings this month
     - Current subscription tier
   
   - Available requests section:
     - New requests in your area
     - Distance from you
     - Item count
     - Service type
     - "Accepter" / "Voir détails" buttons
   
   - Active requests:
     - Accepted but not completed
     - Upcoming meetings
     - Pending actions (price approvals to submit, items to list)
   
   - Quick actions:
     - "Voir les nouvelles demandes"
     - "Gérer mon inventaire"
     - "Mes statistiques"

2. **Backend Route** (routes/reusse.ts):
   - GET /api/reusse/dashboard
   - Returns:
     - Reusse stats
     - Available requests (within service area)
     - Active requests
     - Upcoming meetings
     - Subscription info

3. **Controller** (controllers/reusseController.ts):
   - getDashboard function
   - Geographic matching for available requests
     - Calculate distance based on lat/long
   - Aggregates performance data

4. **Components**:
   - AvailableRequestCard.tsx: New request display
   - ActiveRequestCard.tsx: Ongoing request
   - ReusseStatCard.tsx: Performance metrics

5. **Styling**:
   - Professional dashboard for business users
   - Action-oriented design
   - Clear CTAs
   - Performance metrics prominent

Include real-time updates for new requests.
```

### Prompt 5.2: Available Requests & Matching

```
Create the request browsing and acceptance system:

1. **Frontend Page** (client/src/pages/reusse/AvailableRequests.tsx):
   - Page title: "Demandes disponibles"
   - Filter options:
     - Distance (5km, 10km, 20km, 50km)
     - Service type
     - Item count
     - Date posted
   - Request cards showing:
     - Seller first name only (privacy)
     - Location (city, distance)
     - Service type
     - Item count (or "À déterminer" for SOS)
     - Estimated value
     - Meeting preferences
     - Posted date
     - "Voir détails" / "Accepter" buttons
   
   - Request detail modal:
     - Full details
     - Map showing location
     - Item list (if Classic service)
     - Seller notes
     - "Accepter cette demande" button

2. **Backend Routes** (routes/reusse.ts):
   - GET /api/reusse/available-requests
     - Filters: distance, serviceType, minItems, maxItems
     - Returns requests within Reusse's service area
     - Excludes already matched requests
   
   - POST /api/reusse/accept-request/:requestId
     - Matches Reusse to request
     - Updates request status to MATCHED
     - Creates notification for seller
     - Sends email to both parties
     - Returns updated request

3. **Controllers** (controllers/reusseController.ts):
   - getAvailableRequests function
     - Geographic filtering
     - Capacity check (based on subscription tier)
   - acceptRequest function
     - Validates Reusse can accept (capacity, approval status)
     - Creates match
     - Sends notifications

4. **Geographic Matching**:
   - Calculate distance using Haversine formula
   - Filter by Reusse's service radius
   - Sort by distance (closest first)

5. **Components**:
   - RequestCard.tsx: Available request display
   - RequestDetailModal.tsx: Full request details
   - MapView.tsx: Show request location

Include confirmation dialog before accepting request.
```

### Prompt 5.3: My Clients & Active Requests

```
Create the Reusse's client management page:

1. **Frontend Page** (client/src/pages/reusse/MyClients.tsx):
   - Page title: "Mes clients"
   - Tabs:
     - "Actifs" (ongoing requests)
     - "Complétés" (finished)
     - "Tous"
   
   - Client cards showing:
     - Seller name
     - Location
     - Request status
     - Service type
     - Item count / Items sold
     - Meeting date
     - Days remaining in sales period
     - Progress bar (items listed/sold)
     - Actions: View details, Message, Manage items

2. **Backend Route** (routes/reusse.ts):
   - GET /api/reusse/my-requests
   - Query params: status
   - Returns all requests where reusseId = current user
   - Includes seller info, items, meeting details

3. **Controller** (controllers/reusseController.ts):
   - getMyRequests function
   - Includes related data
   - Calculates progress metrics

4. **Client Detail View**:
   - Full client information
   - Request timeline
   - Item inventory for this client
   - Sales performance
   - Communication history
   - Meeting details
   - Actions: Add items, Update prices, Mark items sold

5. **Components**:
   - ClientCard.tsx: Client overview
   - ClientDetailModal.tsx: Full client view
   - ProgressIndicator.tsx: Sales period progress

6. **Bulk Actions**:
   - Select multiple clients
   - Send bulk messages
   - Export data

Include search and filter functionality.
```

### Prompt 5.4: Inventory Management

```
Create the Reusse's inventory management system:

1. **Frontend Page** (client/src/pages/reusse/Inventory.tsx):
   - Page title: "Mon inventaire"
   - Filter/group options:
     - By client
     - By status (Pending approval, Approved, Listed, Sold, Unsold)
     - By date added
   - Item grid view:
     - Photo
     - Title
     - Brand, size, condition
     - Client name
     - Proposed price
     - Status
     - Actions: Edit, Set price, Mark sold, Delete
   
   - "Ajouter des articles" button
   - Bulk actions: Select multiple, bulk price update, bulk list

2. **Backend Routes** (routes/reusse.ts):
   - GET /api/reusse/inventory
     - Returns all items for this Reusse
     - Filters: status, requestId, search
   
   - POST /api/reusse/items
     - Add new items to a request
     - Upload photos
     - Set initial details
   
   - PUT /api/reusse/items/:itemId
     - Update item details
     - Update price
     - Update status
   
   - POST /api/reusse/items/:itemId/propose-price
     - Propose price to seller
     - Creates notification for seller
     - Sends email

3. **Controllers** (controllers/reusseController.ts):
   - getInventory function
   - addItems function
   - updateItem function
   - proposePrice function

4. **Add Items Form**:
   - Select client/request
   - Multi-item entry (like seller form)
   - Photo upload
   - Item details
   - Price suggestion (min/max)
   - Submit for seller approval

5. **Price Proposal Interface**:
   - Item details display
   - Market research helper (suggested price ranges)
   - Min and max price inputs
   - Justification note to seller
   - Submit button

6. **Components**:
   - InventoryGrid.tsx: Item grid view
   - AddItemsModal.tsx: Add new items
   - PriceProposalModal.tsx: Propose pricing
   - ItemEditModal.tsx: Edit item details

Include batch operations for efficiency.
```

### Prompt 5.5: Sales Recording

```
Create the interface for Reusses to record sales:

1. **Frontend Page** (client/src/pages/reusse/RecordSale.tsx):
   - Page title: "Enregistrer une vente"
   - Search for item:
     - By client name
     - By item title
     - Scan barcode (future feature)
   
   - Sale form:
     - Item details (read-only)
     - Sale date (default: today)
     - Sale price (required)
     - Platform sold on (dropdown: Vinted, Leboncoin, Autre)
     - Buyer information (optional)
     - Shipping cost (optional)
     - Notes (optional)
   
   - Commission calculation display:
     - Sale price
     - Seller amount (40-70% based on price tier)
     - Reusse amount (20-40%)
     - Platform amount (10-20%)
   
   - Submit button: "Enregistrer la vente"

2. **Backend Route** (routes/reusse.ts):
   - POST /api/reusse/record-sale/:itemId
   - Accepts: salePrice, saleDate, platform, notes
   - Updates item status to SOLD
   - Creates Transaction records
   - Creates Commission record
   - Calculates commission split
   - Sends notification to seller
   - Sends email confirmation

3. **Controller** (controllers/reusseController.ts):
   - recordSale function
   - Commission calculation logic
   - Transaction creation
   - Notification sending

4. **Commission Calculator**:
   - Utility function to calculate splits
   - Based on price tiers:
     - 0-100€: 40% seller, 40% reusse, 20% platform
     - 101-300€: 50% seller, 30% reusse, 20% platform
     - 301-500€: 60% seller, 30% reusse, 10% platform
     - 500+€: 70% seller, 20% reusse, 10% platform

5. **Success Confirmation**:
   - Sale recorded message
   - Commission breakdown
   - Link to view in sales history

6. **Components**:
   - ItemSearch.tsx: Search for items
   - SaleForm.tsx: Sale recording form
   - CommissionBreakdown.tsx: Visual commission split

Include validation to prevent duplicate sale recording.
```

### Prompt 5.6: Reusse Earnings & Analytics

```
Create earnings dashboard and analytics for Reusses:

1. **Frontend Page** (client/src/pages/reusse/Earnings.tsx):
   - Page title: "Mes revenus"
   - Time period selector (This month, Last month, Last 3 months, All time)
   
   - Summary cards:
     - Total earnings
     - Pending earnings (not yet paid)
     - Paid earnings
     - Average commission per item
   
   - Earnings breakdown:
     - By month (chart)
     - By client
     - By item category
   
   - Recent transactions:
     - Date
     - Item
     - Sale price
     - Your commission
     - Status (Pending/Paid)
   
   - Payment schedule:
     - Next payment date
     - Amount to be paid
     - Payment method

2. **Backend Route** (routes/reusse.ts):
   - GET /api/reusse/earnings
   - Query params: startDate, endDate
   - Returns:
     - Total earnings
     - Earnings by period
     - Transaction history
     - Commission breakdown
     - Payment schedule

3. **Controller** (controllers/reusseController.ts):
   - getEarnings function
   - Aggregates commission data
   - Calculates pending vs paid
   - Groups by time period

4. **Charts**:
   - Line chart: Earnings over time
   - Pie chart: Earnings by category
   - Bar chart: Top performing clients

5. **Export Functionality**:
   - Export to CSV
   - Export to PDF
   - For tax purposes

6. **Components**:
   - EarningsChart.tsx: Visual earnings data
   - TransactionList.tsx: Transaction history
   - PaymentSchedule.tsx: Upcoming payments

Include comparison to previous periods.
```

---

## PHASE 6: MATCHING SYSTEM

### Prompt 6.1: Geographic Matching Algorithm

```
Implement the core geographic matching system:

1. **Backend Service** (services/matchingService.ts):
   - calculateDistance function:
     - Uses Haversine formula
     - Accepts two lat/long pairs
     - Returns distance in kilometers
   
   - findNearbyReusses function:
     - Accepts seller location (lat/long)
     - Accepts radius (default 20km)
     - Returns Reusses within radius
     - Filters for approved Reusses only
     - Sorts by distance (closest first)
   
   - matchRequestToReusses function:
     - Finds nearby Reusses
     - Checks Reusse capacity (subscription tier limits)
     - Checks Reusse availability
     - Returns ranked list of potential matches
   
   - notifyPotentialReusses function:
     - Sends notifications to nearby Reusses
     - Creates in-app notifications
     - Sends email notifications
     - Limits to top 10 closest Reusses

2. **Capacity Checking**:
   - Get Reusse's active request count
   - Check against subscription tier limits:
     - 1-2 active: Can accept more
     - 3-5 active: Tier 2 required
     - 6-9 active: Tier 3 required
     - 10-19 active: Tier 4 required
     - 20+ active: Tier 5 required
   - Return boolean: canAcceptMore

3. **Database Optimization**:
   - Add indexes on latitude/longitude
   - Add index on Profile.status
   - Optimize query performance

4. **Testing**:
   - Unit tests for distance calculation
   - Test with various locations
   - Test capacity limits

5. **Integration**:
   - Call from createRequest controller
   - Call when Reusse updates service area

Include proper error handling and logging.
```

### Prompt 6.2: Request Notification System

```
Create a comprehensive notification system for requests:

1. **Backend Service** (services/notificationService.ts):
   - createNotification function:
     - Accepts: userId, type, title, message, link
     - Creates Notification record
     - Triggers real-time update (Socket.io)
     - Optionally sends email
   
   - notifyNewRequest function:
     - Notifies Reusses about new request
     - Creates in-app notification
     - Sends email with request details
   
   - notifyRequestAccepted function:
     - Notifies seller that Reusse accepted
     - Includes Reusse contact info
   
   - notifyPriceProposal function:
     - Notifies seller of price proposals
     - Links to approval page
   
   - notifyItemSold function:
     - Notifies seller of sale
     - Shows sale price and commission
   
   - notifyPaymentReceived function:
     - Notifies when payment processed

2. **Backend Routes** (routes/notifications.ts):
   - GET /api/notifications
     - Returns user's notifications
     - Paginated
     - Filter: read/unread
   
   - PATCH /api/notifications/:id/read
     - Marks notification as read
   
   - PATCH /api/notifications/read-all
     - Marks all as read
   
   - DELETE /api/notifications/:id
     - Deletes notification

3. **Controllers** (controllers/notificationController.ts):
   - getNotifications function
   - markAsRead function
   - markAllAsRead function
   - deleteNotification function

4. **Frontend Components**:
   - NotificationBell.tsx: Header bell icon with badge
   - NotificationDropdown.tsx: Dropdown list
   - NotificationItem.tsx: Individual notification
   - NotificationPage.tsx: Full notifications page

5. **Real-time Updates**:
   - Socket.io integration
   - Listen for new notifications
   - Update bell badge count
   - Show toast for important notifications

6. **Email Templates**:
   - New request available
   - Request accepted
   - Price proposal received
   - Item sold
   - Payment received

Include notification preferences (email on/off).
```

### Prompt 6.3: Meeting Scheduling & Calendar

```
Create meeting management system:

1. **Backend Routes** (routes/meetings.ts):
   - GET /api/meetings/my-meetings
     - Returns user's meetings
     - Filter: upcoming, past, cancelled
   
   - PUT /api/meetings/:id
     - Update meeting details
     - Reschedule
     - Update status
   
   - POST /api/meetings/:id/cancel
     - Cancel meeting
     - Notify other party
   
   - POST /api/meetings/:id/complete
     - Mark meeting as completed
     - Trigger next steps

2. **Controllers** (controllers/meetingController.ts):
   - getMyMeetings function
   - updateMeeting function
   - cancelMeeting function
   - completeMeeting function

3. **Frontend Page** (client/src/pages/common/MyMeetings.tsx):
   - Calendar view of meetings
   - List view option
   - Upcoming meetings highlighted
   - Meeting cards showing:
     - Date & time
     - Other party (Seller or Reusse)
     - Location
     - Request details
     - Actions: Reschedule, Cancel, View details

4. **Rescheduling Interface**:
   - Modal with date/time picker
   - Reason for rescheduling
   - Notify other party
   - Confirmation

5. **Meeting Reminders**:
   - Email reminder 24h before
   - Email reminder 2h before
   - In-app notification

6. **Components**:
   - MeetingCalendar.tsx: Calendar view
   - MeetingCard.tsx: Meeting display
   - RescheduleModal.tsx: Reschedule interface

7. **Integration**:
   - Add to Google Calendar (iCal link)
   - Download .ics file

Include timezone handling (all times in Europe/Paris).
```

---

## PHASE 7: COMMUNICATION SYSTEM

### Prompt 7.1: In-App Messaging - Backend

```
Create the backend for in-app messaging:

1. **Backend Routes** (routes/messages.ts):
   - GET /api/messages/conversations
     - Returns list of conversations
     - Shows last message preview
     - Unread count per conversation
   
   - GET /api/messages/conversation/:userId
     - Returns messages with specific user
     - Paginated (load more on scroll)
     - Marks messages as read
   
   - POST /api/messages
     - Send new message
     - Accepts: receiverId, content, requestId (optional), attachments
     - Creates Message record
     - Sends real-time notification
     - Sends email if recipient offline
   
   - POST /api/messages/upload-attachment
     - Upload file (image)
     - Returns URL
   
   - DELETE /api/messages/:id
     - Delete message (soft delete)

2. **Controllers** (controllers/messageController.ts):
   - getConversations function
     - Groups messages by conversation
     - Returns unique users with last message
   
   - getConversation function
     - Returns messages between two users
     - Optionally filtered by requestId
     - Marks as read
   
   - sendMessage function
     - Creates message
     - Emits Socket.io event
     - Sends notification
   
   - uploadAttachment function
     - Handles file upload to Cloudinary

3. **Socket.io Integration** (server/src/socket.ts):
   - Set up Socket.io server
   - Authentication middleware
   - Events:
     - 'join': User joins their room
     - 'message': Send message
     - 'typing': Typing indicator
     - 'read': Mark as read
   - Emit to specific user rooms

4. **Real-time Features**:
   - Message delivery in real-time
   - Typing indicators
   - Read receipts
   - Online/offline status

5. **Database Optimization**:
   - Index on senderId, receiverId
   - Index on createdAt for sorting
   - Efficient pagination queries

Include rate limiting to prevent spam.
```

### Prompt 7.2: In-App Messaging - Frontend

```
Create the frontend messaging interface:

1. **Frontend Page** (client/src/pages/common/Messages.tsx):
   - Two-panel layout:
     - Left: Conversation list
     - Right: Active conversation
   
   - Conversation list:
     - User avatar
     - Name and role (Seller/Reusse)
     - Last message preview
     - Timestamp
     - Unread badge
     - Related request (if any)
     - Click to open conversation
   
   - Active conversation:
     - Header: Other user's name, avatar, online status
     - Message thread (scrollable)
     - Message bubbles (different colors for sent/received)
     - Timestamps
     - Read indicators
     - Image attachments (clickable to enlarge)
     - Input area:
       - Text input
       - Attachment button
       - Send button
       - Character count
     - Typing indicator

2. **Socket.io Client** (client/src/services/socketService.ts):
   - Connect to Socket.io server
   - Authenticate with JWT
   - Listen for events:
     - 'message': New message received
     - 'typing': Other user typing
     - 'read': Message read
   - Emit events:
     - 'join': Join room
     - 'message': Send message
     - 'typing': Typing status
     - 'read': Mark as read

3. **Components**:
   - ConversationList.tsx: List of conversations
   - ConversationItem.tsx: Single conversation preview
   - MessageThread.tsx: Message display area
   - MessageBubble.tsx: Individual message
   - MessageInput.tsx: Input area
   - TypingIndicator.tsx: "User is typing..."
   - ImageAttachment.tsx: Image display
   - ImageLightbox.tsx: Full-size image view

4. **State Management**:
   - Use React Query for message fetching
   - Use Zustand for Socket.io state
   - Optimistic updates for sent messages
   - Auto-scroll to bottom on new message

5. **Features**:
   - Infinite scroll for message history
   - Image upload with preview
   - Emoji support
   - Link detection and formatting
   - Timestamp grouping (Today, Yesterday, date)

6. **Mobile Responsive**:
   - Single panel on mobile (list OR conversation)
   - Back button to return to list
   - Swipe gestures

Include notification sound for new messages.
```

### Prompt 7.3: Email Notification System

```
Create a comprehensive email notification system:

1. **Email Service** (server/src/services/emailService.ts):
   - sendEmail function (generic):
     - Uses SendGrid
     - Accepts: to, subject, html, text
     - Error handling and logging
   
   - Email template functions:
     - sendWelcomeEmail (seller/reusse)
     - sendEmailVerification
     - sendPasswordReset
     - sendRequestConfirmation (seller)
     - sendNewRequestNotification (reusse)
     - sendRequestAcceptedNotification (seller)
     - sendMeetingReminder
     - sendPriceProposalNotification (seller)
     - sendItemSoldNotification (seller)
     - sendPaymentNotification
     - sendMessageNotification (if offline)

2. **Email Templates** (server/src/templates/):
   - Create HTML email templates
   - Use responsive email design
   - Include Reusses branding
   - Clear CTAs
   - Unsubscribe link
   
   Templates needed:
     - welcome-seller.html
     - welcome-reusse.html
     - email-verification.html
     - password-reset.html
     - request-confirmation.html
     - new-request.html
     - request-accepted.html
     - meeting-reminder.html
     - price-proposal.html
     - item-sold.html
     - payment-received.html
     - new-message.html

3. **Template Variables**:
   - User name
   - Request details
   - Meeting details
   - Item details
   - Links to platform
   - Dynamic content

4. **Email Preferences**:
   - Add to User model: emailPreferences (JSON)
   - Allow users to opt out of certain emails
   - Always send critical emails (password reset, payments)

5. **Email Queue** (optional for scale):
   - Use Bull or similar for email queue
   - Retry failed emails
   - Rate limiting

6. **Testing**:
   - Use Mailtrap for development
   - Test all email templates
   - Verify links work

Include email tracking (opens, clicks) for analytics.
```

### Prompt 7.4: Message Threading & Context

```
Enhance messaging with request context and threading:

1. **Request-Specific Messaging**:
   - Link messages to specific requests
   - Filter conversation by request
   - Show request context in message thread

2. **Frontend Enhancement** (client/src/pages/common/Messages.tsx):
   - Add request selector dropdown
   - "All messages" or filter by request
   - Show request details in conversation header
   - Quick actions related to request:
     - View request details
     - View items
     - Schedule meeting

3. **Backend Update** (routes/messages.ts):
   - Update GET /api/messages/conversation/:userId
   - Add query param: requestId
   - Filter messages by request

4. **Message Templates**:
   - Quick reply templates for common messages:
     - "Je suis disponible pour le rendez-vous"
     - "J'ai bien reçu vos articles"
     - "Les prix sont proposés, merci de valider"
     - "Votre article est vendu !"
   - Customizable templates

5. **Components**:
   - RequestContext.tsx: Show request info in chat
   - QuickReplies.tsx: Template selector
   - MessageFilter.tsx: Filter by request

6. **File Attachments**:
   - Support for images (already done)
   - Support for PDFs (receipts, invoices)
   - File size limits
   - Preview for images
   - Download for PDFs

Include search within conversation.
```

---

## PHASE 8: PAYMENT INTEGRATION

### Prompt 8.1: Stripe Setup & Configuration

```
Set up Stripe integration for payments:

1. **Stripe Service** (server/src/services/stripeService.ts):
   - Initialize Stripe with secret key
   - createCustomer function:
     - Creates Stripe customer
     - Links to User record
     - Stores Stripe customer ID
   
   - createPaymentIntent function:
     - For service fees (Express, SOS)
     - Accepts amount, currency, customerId
     - Returns client secret
   
   - createConnectedAccount function:
     - For Reusses and Sellers to receive payments
     - Stripe Connect
     - Returns account ID
   
   - createPayout function:
     - Transfer money to connected account
     - For seller/reusse earnings

2. **Database Updates**:
   - Add to User model:
     - stripeCustomerId
     - stripeConnectedAccountId
     - stripeAccountStatus (enum: NOT_CREATED, PENDING, ACTIVE, RESTRICTED)

3. **Backend Routes** (routes/payments.ts):
   - POST /api/payments/setup-intent
     - Creates setup intent for saving payment method
   
   - POST /api/payments/create-payment-intent
     - For service fees
     - Returns client secret
   
   - POST /api/payments/webhook
     - Stripe webhook handler
     - Verifies signature
     - Handles events:
       - payment_intent.succeeded
       - payment_intent.failed
       - account.updated
       - payout.paid
       - payout.failed

4. **Controllers** (controllers/paymentController.ts):
   - createSetupIntent function
   - createPaymentIntent function
   - handleWebhook function
   - Proper error handling

5. **Stripe Connect Onboarding**:
   - POST /api/payments/create-connect-account
   - POST /api/payments/connect-account-link
   - Returns onboarding URL

6. **Environment Setup**:
   - Add Stripe keys to .env
   - Test mode for development
   - Production keys for live

Include comprehensive error handling and logging.
```

### Prompt 8.2: Service Fee Payment (Express & SOS)

```
Implement payment for Express and SOS Dressing services:

1. **Frontend Component** (client/src/components/payments/ServiceFeePayment.tsx):
   - Stripe Elements integration
   - Card input form
   - Payment button
   - Loading states
   - Error handling
   - Success confirmation

2. **Payment Flow**:
   - When seller selects Express or SOS service
   - Show payment form before final submission
   - Collect payment
   - On success: Create request
   - On failure: Show error, allow retry

3. **Backend Integration**:
   - Update createRequest controller
   - If serviceType is EXPRESS or SOS_DRESSING:
     - Verify payment completed
     - Create Transaction record
     - Link to Request

4. **Payment Confirmation**:
   - Email receipt
   - Show in transaction history
   - Invoice generation

5. **Components**:
   - PaymentForm.tsx: Stripe Elements form
   - PaymentSuccess.tsx: Success message
   - PaymentError.tsx: Error handling

6. **Security**:
   - Never store card details
   - Use Stripe's secure elements
   - PCI compliance
   - HTTPS only

Include refund handling for cancelled requests.
```

### Prompt 8.3: Seller & Reusse Payout Setup

```
Create the payout setup for sellers and Reusses:

1. **Frontend Page** (client/src/pages/common/PayoutSetup.tsx):
   - Page title: "Configuration des paiements"
   - Explanation of Stripe Connect
   - "Connecter mon compte bancaire" button
   - Shows current status:
     - Not set up
     - Pending verification
     - Active
     - Restricted (needs attention)
   
   - If active:
     - Shows last 4 digits of bank account
     - Next payout date and amount
     - "Modifier" button

2. **Backend Routes** (routes/payments.ts):
   - POST /api/payments/connect/create-account
     - Creates Stripe Connected Account
     - Returns account ID
     - Stores in database
   
   - POST /api/payments/connect/account-link
     - Creates account link for onboarding
     - Returns URL
     - Redirects user to Stripe
   
   - GET /api/payments/connect/account-status
     - Checks Stripe account status
     - Returns details and capabilities

3. **Controllers** (controllers/paymentController.ts):
   - createConnectedAccount function
   - createAccountLink function
   - getAccountStatus function

4. **Stripe Connect Flow**:
   - User clicks "Connect"
   - Create connected account
   - Generate account link
   - Redirect to Stripe onboarding
   - User completes bank details
   - Stripe redirects back
   - Update account status

5. **Return URLs**:
   - Success: /payout-setup/success
   - Failure: /payout-setup/retry

6. **Components**:
   - PayoutStatus.tsx: Current status display
   - ConnectButton.tsx: Stripe connect CTA

Require payout setup before first payment.
```

### Prompt 8.4: Commission Calculation & Distribution

```
Implement automatic commission calculation and distribution:

1. **Commission Service** (server/src/services/commissionService.ts):
   - calculateCommission function:
     - Accepts sale price
     - Returns breakdown:
       - Seller amount (40-70%)
       - Reusse amount (20-40%)
       - Platform amount (10-20%)
     - Based on price tiers
   
   - createCommissionRecords function:
     - Creates Commission record
     - Creates Transaction records for seller and reusse
     - Marks as PENDING
   
   - processPayouts function:
     - Runs at end of sales period
     - Gets all PENDING commissions
     - Groups by user
     - Creates Stripe payouts
     - Marks as PAID
     - Sends notifications

2. **Price Tier Logic**:
   ```
   if (price <= 100) {
     seller: 40%, reusse: 40%, platform: 20%
   } else if (price <= 300) {
     seller: 50%, reusse: 30%, platform: 20%
   } else if (price <= 500) {
     seller: 60%, reusse: 30%, platform: 10%
   } else {
     seller: 70%, reusse: 20%, platform: 10%
   }
   ```

3. **Backend Routes** (routes/payments.ts):
   - GET /api/payments/pending-earnings
     - Returns pending earnings for user
     - Grouped by request
   
   - POST /api/payments/request-early-withdrawal
     - Triggers early payout (2€ fee)
     - Creates payout immediately
     - Deducts fee

4. **Scheduled Job** (server/src/jobs/payoutJob.ts):
   - Cron job runs monthly
   - Processes all pending payouts
   - Sends payment notifications

5. **Frontend Display**:
   - Show commission breakdown on item sold
   - Show pending vs paid earnings
   - Show next payout date

6. **Components**:
   - CommissionBreakdown.tsx: Visual breakdown
   - EarningsTimeline.tsx: Payment schedule

Include transaction fees in calculations.
```

### Prompt 8.5: Payment History & Invoicing

```
Create payment history and invoice generation:

1. **Frontend Page** (client/src/pages/common/PaymentHistory.tsx):
   - Page title: "Historique des paiements"
   - Filter options:
     - Date range
     - Type (Received, Paid, Fee)
     - Status (Pending, Completed, Failed)
   
   - Transaction list:
     - Date
     - Description
     - Type
     - Amount
     - Status
     - Actions: View details, Download invoice

2. **Backend Routes** (routes/payments.ts):
   - GET /api/payments/transactions
     - Returns user's transactions
     - Paginated
     - Filtered by query params
   
   - GET /api/payments/transaction/:id
     - Returns transaction details
   
   - GET /api/payments/invoice/:transactionId
     - Generates and returns PDF invoice

3. **Controllers** (controllers/paymentController.ts):
   - getTransactions function
   - getTransactionDetails function
   - generateInvoice function

4. **Invoice Generation** (server/src/services/invoiceService.ts):
   - generateInvoice function:
     - Uses PDF library (PDFKit or similar)
     - Includes:
       - Invoice number
       - Date
       - Reusses company info
       - User info
       - Transaction details
       - Amount breakdown
       - Payment method
       - Tax info (if applicable)
     - Returns PDF buffer

5. **Invoice Template**:
   - Professional design
   - Company branding
   - All required legal information
   - Unique invoice number

6. **Components**:
   - TransactionList.tsx: Transaction table
   - TransactionDetail.tsx: Detail modal
   - InvoiceDownload.tsx: Download button

7. **Export Functionality**:
   - Export to CSV
   - Date range selection
   - For accounting purposes

Include VAT handling if applicable.
```

### Prompt 8.6: Reusse Subscription Billing

```
Implement Reusse subscription billing system:

1. **Subscription Service** (server/src/services/subscriptionService.ts):
   - calculateSubscriptionTier function:
     - Counts active requests
     - Returns appropriate tier and fee:
       - 0-2 active: FREE (first 2 orders)
       - 1-2 active: 4€/month
       - 3-5 active: 6€/month
       - 6-9 active: 10€/month
       - 10-19 active: 15€/month
       - 20+ active: 20€/month
   
   - updateSubscription function:
     - Called when Reusse accepts new request
     - Recalculates tier
     - Updates Subscription record
     - Creates/updates Stripe subscription
   
   - chargeSubscription function:
     - Monthly billing
     - Creates charge
     - Creates Transaction record
     - Sends invoice

2. **Backend Routes** (routes/subscriptions.ts):
   - GET /api/subscriptions/my-subscription
     - Returns current subscription details
   
   - GET /api/subscriptions/pricing
     - Returns pricing tiers
   
   - POST /api/subscriptions/update-payment-method
     - Updates payment method for subscription

3. **Controllers** (controllers/subscriptionController.ts):
   - getMySubscription function
   - getPricing function
   - updatePaymentMethod function

4. **Scheduled Job** (server/src/jobs/subscriptionJob.ts):
   - Runs monthly
   - Charges all active subscriptions
   - Handles failed payments
   - Sends notifications

5. **Frontend Page** (client/src/pages/reusse/Subscription.tsx):
   - Current tier display
   - Active request count
   - Monthly fee
   - Pricing table (all tiers)
   - Payment method
   - Billing history
   - Next billing date

6. **Components**:
   - SubscriptionTier.tsx: Current tier card
   - PricingTable.tsx: All tiers display
   - PaymentMethodCard.tsx: Card on file

7. **Failed Payment Handling**:
   - Retry 3 times
   - Email notifications
   - Suspend account if still fails
   - Reactivate on payment

Include grace period for failed payments.
```

---

## PHASE 9: ADMIN TOOLS

### Prompt 9.1: Admin Dashboard Overview

```
Create a comprehensive admin dashboard:

1. **Frontend Page** (client/src/pages/admin/Dashboard.tsx):
   - Requires ADMIN role
   - Overview cards:
     - Total users (Sellers, Reusses, Admins)
     - Pending Reusse applications
     - Active requests
     - Total items in circulation
     - Total sales (this month)
     - Total revenue (this month)
     - Platform commission (this month)
   
   - Charts:
     - Users over time (line chart)
     - Requests by status (pie chart)
     - Sales by month (bar chart)
     - Revenue by month (line chart)
     - Geographic distribution (map)
   
   - Recent activity:
     - New user registrations
     - New requests
     - Recent sales
     - Failed payments
     - Disputes
   
   - Quick actions:
     - Review pending Reusses
     - View all users
     - View all requests
     - Generate reports

2. **Backend Route** (routes/admin.ts):
   - GET /api/admin/dashboard
   - Requires admin authentication
   - Returns aggregated stats

3. **Controller** (controllers/adminController.ts):
   - getDashboard function
   - Complex queries to aggregate data
   - Caching for performance

4. **Components**:
   - AdminStatCard.tsx: Stat display
   - AdminChart.tsx: Chart wrapper
   - ActivityFeed.tsx: Recent activity
   - QuickActions.tsx: Action buttons

5. **Styling**:
   - Professional admin interface
   - Data-dense but readable
   - Dark theme option
   - Responsive layout

Include real-time updates for critical metrics.
```

### Prompt 9.2: User Management

```
Create user management interface for admins:

1. **Frontend Page** (client/src/pages/admin/Users.tsx):
   - Page title: "Gestion des utilisateurs"
   - Filter/search:
     - Role (All, Sellers, Reusses, Admins)
     - Status (Active, Suspended, Pending)
     - Search by name, email
     - Date registered
   
   - User table:
     - Avatar
     - Name
     - Email
     - Role
     - Status
     - Registered date
     - Last login
     - Actions: View, Edit, Suspend, Delete
   
   - Pagination
   - Export to CSV

2. **Backend Routes** (routes/admin.ts):
   - GET /api/admin/users
     - Returns all users
     - Filters: role, status, search
     - Paginated
   
   - GET /api/admin/users/:id
     - Returns user details
     - Includes profile, requests, items, transactions
   
   - PUT /api/admin/users/:id
     - Update user details
     - Change role
     - Change status
   
   - DELETE /api/admin/users/:id
     - Soft delete user
     - Anonymize data (GDPR)

3. **Controllers** (controllers/adminController.ts):
   - getAllUsers function
   - getUserDetails function
   - updateUser function
   - deleteUser function

4. **User Detail Modal**:
   - Full user information
   - Profile details
   - Activity history
   - Requests (if seller)
   - Clients (if reusse)
   - Financial summary
   - Audit log
   - Actions: Edit, Suspend, Delete, Send message

5. **Components**:
   - UserTable.tsx: User list
   - UserDetailModal.tsx: Detail view
   - UserEditForm.tsx: Edit interface
   - UserActions.tsx: Action buttons

6. **Bulk Actions**:
   - Select multiple users
   - Bulk suspend
   - Bulk email
   - Bulk export

Include activity logging for all admin actions.
```

### Prompt 9.3: Reusse Approval Workflow

```
Create Reusse application review and approval system:

1. **Frontend Page** (client/src/pages/admin/ReusseApplications.tsx):
   - Page title: "Candidatures Reusses"
   - Tabs:
     - Pending (needs review)
     - Approved
     - Rejected
   
   - Application cards:
     - Name
     - Location
     - Applied date
     - Experience summary
     - SIRET (if provided)
     - Actions: View full application, Approve, Reject

2. **Application Detail Modal**:
   - Full profile information
   - Bio and experience
   - Service area
   - SIRET number
   - Contact information
   - Application date
   - Notes field (admin only)
   - Approve/Reject buttons with reason

3. **Backend Routes** (routes/admin.ts):
   - GET /api/admin/reusse-applications
     - Returns Reusse profiles
     - Filter by status
   
   - POST /api/admin/reusse-applications/:id/approve
     - Updates status to APPROVED
     - Sends approval email
     - Creates notification
   
   - POST /api/admin/reusse-applications/:id/reject
     - Updates status to REJECTED
     - Accepts rejection reason
     - Sends rejection email

4. **Controllers** (controllers/adminController.ts):
   - getReusseApplications function
   - approveReusse function
   - rejectReusse function

5. **Email Templates**:
   - Approval email:
     - Welcome to Reusses
     - Next steps
     - Link to dashboard
   - Rejection email:
     - Polite rejection
     - Reason (if provided)
     - Encourage reapplication

6. **Components**:
   - ApplicationCard.tsx: Application preview
   - ApplicationDetail.tsx: Full details
   - ApprovalForm.tsx: Approve/reject interface

Include admin notes for internal tracking.
```

### Prompt 9.4: Request Monitoring

```
Create request monitoring and management for admins:

1. **Frontend Page** (client/src/pages/admin/Requests.tsx):
   - Page title: "Gestion des demandes"
   - Filter options:
     - Status (All, Pending, Matched, In Progress, Completed, Cancelled)
     - Service type
     - Date range
     - Location
     - Search by seller or reusse name
   
   - Request table:
     - Request ID
     - Seller name
     - Reusse name (if matched)
     - Service type
     - Status
     - Item count
     - Created date
     - Meeting date
     - Actions: View, Edit, Cancel

2. **Backend Routes** (routes/admin.ts):
   - GET /api/admin/requests
     - Returns all requests
     - Filters and search
     - Paginated
   
   - GET /api/admin/requests/:id
     - Returns request details
     - Includes all related data
   
   - PUT /api/admin/requests/:id
     - Update request
     - Change status
     - Reassign Reusse
   
   - DELETE /api/admin/requests/:id
     - Cancel request
     - Refund if applicable

3. **Controllers** (controllers/adminController.ts):
   - getAllRequests function
   - getRequestDetails function
   - updateRequest function
   - cancelRequest function

4. **Request Detail View**:
   - Full request information
   - Seller and Reusse details
   - Item list
   - Meeting details
   - Status timeline
   - Messages between parties
   - Financial information
   - Admin actions: Edit, Cancel, Reassign

5. **Components**:
   - RequestTable.tsx: Request list
   - RequestDetailModal.tsx: Full details
   - RequestTimeline.tsx: Status history
   - ReassignModal.tsx: Reassign to different Reusse

6. **Dispute Resolution**:
   - Flag for disputes
   - Admin notes
   - Resolution actions

Include export and reporting functionality.
```

### Prompt 9.5: Payment Management & Monitoring

```
Create payment monitoring and management for admins:

1. **Frontend Page** (client/src/pages/admin/Payments.tsx):
   - Page title: "Gestion des paiements"
   - Summary cards:
     - Total processed this month
     - Pending payouts
     - Failed payments
     - Platform revenue
   
   - Filter options:
     - Type (Service fees, Commissions, Subscriptions, Payouts)
     - Status (Pending, Completed, Failed, Refunded)
     - Date range
     - User search
   
   - Transaction table:
     - Transaction ID
     - Date
     - User
     - Type
     - Amount
     - Status
     - Stripe ID
     - Actions: View, Refund, Retry

2. **Backend Routes** (routes/admin.ts):
   - GET /api/admin/transactions
     - Returns all transactions
     - Filters and search
     - Paginated
   
   - GET /api/admin/transactions/:id
     - Returns transaction details
   
   - POST /api/admin/transactions/:id/refund
     - Process refund via Stripe
     - Update transaction status
   
   - POST /api/admin/transactions/:id/retry
     - Retry failed payment

3. **Controllers** (controllers/adminController.ts):
   - getAllTransactions function
   - getTransactionDetails function
   - refundTransaction function
   - retryTransaction function

4. **Transaction Detail Modal**:
   - Full transaction information
   - User details
   - Related request/item
   - Stripe payment details
   - Status history
   - Admin actions: Refund, Retry, Cancel

5. **Failed Payment Management**:
   - List of failed payments
   - Retry functionality
   - Contact user
   - Suspend service if needed

6. **Financial Reports**:
   - Revenue by period
   - Commission breakdown
   - Payout summary
   - Export to CSV/PDF

7. **Components**:
   - TransactionTable.tsx: Transaction list
   - TransactionDetail.tsx: Detail view
   - RefundModal.tsx: Refund interface
   - FinancialReport.tsx: Report generator

Include Stripe dashboard integration links.
```

### Prompt 9.6: Admin Logging & Audit Trail

```
Create comprehensive admin activity logging:

1. **Logging Service** (server/src/services/auditService.ts):
   - logAdminAction function:
     - Accepts: adminId, action, targetType, targetId, details
     - Creates AdminLog record
     - Includes IP address, user agent
   
   - Logged actions:
     - User created/updated/deleted
     - Reusse approved/rejected
     - Request modified/cancelled
     - Transaction refunded/retried
     - Settings changed
     - Any admin-only action

2. **Backend Routes** (routes/admin.ts):
   - GET /api/admin/audit-logs
     - Returns admin activity logs
     - Filters: admin, action type, date range
     - Paginated

3. **Controller** (controllers/adminController.ts):
   - getAuditLogs function

4. **Frontend Page** (client/src/pages/admin/AuditLogs.tsx):
   - Page title: "Journal d'audit"
   - Filter options:
     - Admin user
     - Action type
     - Target type
     - Date range
   
   - Log table:
     - Timestamp
     - Admin name
     - Action
     - Target
     - Details
     - IP address

5. **Middleware** (middleware/auditLog.ts):
   - Automatically log admin actions
   - Attach to admin routes

6. **Components**:
   - AuditLogTable.tsx: Log display
   - AuditLogDetail.tsx: Detail view

7. **Security**:
   - Logs cannot be deleted
   - Only viewable by admins
   - Exported for compliance

Include retention policy (keep logs for 2 years).
```

---

## PHASE 10: HIGH VALUE FEATURES - PART 1

### Prompt 10.1: Email Verification

```
Implement email verification for new users:

1. **Backend Updates**:
   - Add to User model: emailVerificationToken, emailVerificationExpiry
   - Update register functions to:
     - Generate verification token
     - Send verification email
     - Set isEmailVerified to false

2. **Backend Routes** (routes/auth.ts):
   - GET /api/auth/verify-email/:token
     - Verifies token
     - Checks expiry
     - Sets isEmailVerified to true
     - Returns success message
   
   - POST /api/auth/resend-verification
     - Generates new token
     - Sends new email

3. **Controllers** (controllers/authController.ts):
   - verifyEmail function
   - resendVerification function

4. **Email Template**:
   - Welcome message
   - Verification link
     - Clear CTA button
   - Expiry notice (24 hours)

5. **Frontend Pages**:
   - EmailVerificationSent.tsx: After registration
   - EmailVerified.tsx: After clicking link
   - ResendVerification.tsx: If expired

6. **Middleware**:
   - requireEmailVerified middleware
   - Apply to sensitive routes
   - Allow users to browse but not create requests until verified

7. **Components**:
   - EmailVerificationBanner.tsx: Reminder banner
   - ResendButton.tsx: Resend email

Include rate limiting on resend.
```

### Prompt 10.2: Availability Matching

```
Implement availability-based matching:

1. **Database Updates**:
   - Add to Profile model:
     - availability (JSON): {monday: {morning: true, afternoon: true, evening: false}, ...}
     - maxDistance (integer, km)
   
   - Add to Request model:
     - preferredDays (array of days)
     - preferredTimeSlots (array)

2. **Backend Service** (services/matchingService.ts):
   - Update findNearbyReusses to include availability check
   - matchAvailability function:
     - Compares request preferred times with Reusse availability
     - Returns compatibility score
   
   - Ranking algorithm:
     - Distance (40%)
     - Availability match (30%)
     - Capacity (20%)
     - Performance rating (10%)

3. **Frontend Components**:
   - AvailabilityEditor.tsx: Set availability (Reusse)
   - Weekly grid with checkboxes
   - Save to profile

4. **Request Form Update**:
   - Add preferred days/times to seller request form
   - Optional but improves matching

5. **Matching Display**:
   - Show match score to Reusses
   - "Perfect match" badge for high scores

Include timezone handling.
```

### Prompt 10.3: Capacity Matching

```
Enhance matching with capacity awareness:

1. **Capacity Service** (server/src/services/capacityService.ts):
   - getReusseCapacity function:
     - Counts active requests
     - Checks subscription tier
     - Returns: current, max, available
   
   - canAcceptRequest function:
     - Checks if Reusse has capacity
     - Considers request size (item count)
     - Returns boolean

2. **Backend Updates**:
   - Update matchRequestToReusses to filter by capacity
   - Only show requests to Reusses with capacity

3. **Frontend Display**:
   - Show capacity on Reusse dashboard
   - "X/Y clients" indicator
   - Warning when approaching limit
   - Upgrade prompt if at limit

4. **Subscription Enforcement**:
   - Block request acceptance if over limit
   - Prompt to upgrade subscription

5. **Components**:
   - CapacityIndicator.tsx: Visual capacity bar
   - UpgradePrompt.tsx: Subscription upgrade CTA

Include grace period for existing clients.
```

### Prompt 10.4: Cancellation & Rescheduling

```
Implement request cancellation and meeting rescheduling:

1. **Backend Routes** (routes/requests.ts):
   - POST /api/requests/:id/cancel
     - Accepts: reason, cancelledBy (seller/reusse)
     - Updates request status to CANCELLED
     - Processes refund if applicable
     - Notifies other party
     - Creates cancellation record
   
   - POST /api/meetings/:id/reschedule
     - Accepts: newDate, newTime, reason
     - Updates meeting
     - Notifies other party
     - Requires confirmation from other party

2. **Controllers**:
   - cancelRequest function
   - rescheduleMeeting function

3. **Cancellation Policy**:
   - Free cancellation 24h before meeting
   - 50% refund if <24h
   - No refund if no-show
   - Store in database

4. **Frontend Components**:
   - CancelRequestModal.tsx: Cancellation interface
   - RescheduleMeetingModal.tsx: Reschedule interface
   - Reason dropdown
   - Confirmation step

5. **Refund Processing**:
   - Automatic refund via Stripe
   - Create refund transaction
   - Send confirmation email

6. **Rescheduling Flow**:
   - Reusse/Seller proposes new time
   - Other party receives notification
   - Must accept or propose alternative
   - Maximum 3 reschedules

Include cancellation analytics for admins.
```

### Prompt 10.5: Multi-Request Handling

```
Enable Reusses to manage multiple requests efficiently:

1. **Frontend Page** (client/src/pages/reusse/RequestManagement.tsx):
   - Kanban board view:
     - Columns: New, Scheduled, In Progress, Completed
     - Drag and drop to update status
   - Calendar view:
     - All meetings visualized
     - Color-coded by client
   - List view:
     - Sortable, filterable

2. **Bulk Operations**:
   - Select multiple requests
   - Bulk status update
   - Bulk message to clients
   - Bulk export

3. **Priority System**:
   - Flag urgent requests
   - Sort by deadline (sales period end)
   - Highlight overdue actions

4. **Components**:
   - KanbanBoard.tsx: Kanban view
   - RequestCard.tsx: Draggable card
   - CalendarView.tsx: Calendar integration
   - BulkActions.tsx: Bulk operation bar

5. **Performance Optimization**:
   - Lazy loading
   - Pagination
   - Caching

Include keyboard shortcuts for power users.
```

---

## PHASE 11: HIGH VALUE FEATURES - PART 2

### Prompt 11.1: Vinted Integration - Setup

```
Begin Vinted integration for automated listing:

1. **Research & Planning**:
   - Vinted API documentation review
   - Authentication method (OAuth or API key)
   - Rate limits and restrictions
   - Available endpoints

2. **Database Updates**:
   - Add to User model:
     - vintedAccessToken
     - vintedRefreshToken
     - vintedUserId
     - vintedConnected (boolean)
   
   - Add to Item model:
     - vintedListingId
     - vintedUrl
     - vintedStatus

3. **Vinted Service** (server/src/services/vintedService.ts):
   - authenticateVinted function
   - refreshVintedToken function
   - createListing function
   - updateListing function
   - deleteListing function
   - getListingStats function

4. **Backend Routes** (routes/integrations.ts):
   - GET /api/integrations/vinted/auth
     - Initiates OAuth flow
   
   - GET /api/integrations/vinted/callback
     - Handles OAuth callback
     - Stores tokens
   
   - POST /api/integrations/vinted/disconnect
     - Removes Vinted connection

5. **Frontend Components**:
   - VintedConnect.tsx: Connect button
   - VintedStatus.tsx: Connection status
   - Shows connected account info

Note: This is a complex integration that may require Vinted API access approval.
```

### Prompt 11.2: Vinted Integration - Listing

```
Implement automated Vinted listing:

1. **Listing Service** (server/src/services/vintedService.ts):
   - listItemOnVinted function:
     - Accepts Item data
     - Formats for Vinted API
     - Uploads photos to Vinted
     - Creates listing
     - Returns Vinted listing ID and URL
     - Updates Item record

2. **Photo Upload**:
   - Download from Cloudinary
   - Upload to Vinted
   - Handle Vinted photo requirements

3. **Listing Data Mapping**:
   - Title → Vinted title
   - Description → Vinted description
     - Brand → Vinted brand
   - Size → Vinted size
   - Category → Vinted category_id
   - Condition → Vinted status_id
   - Price → Vinted price

4. **Backend Routes** (routes/reusse.ts):
   - POST /api/reusse/items/:id/list-on-vinted
     - Lists item on Vinted
     - Updates item status to LISTED
     - Stores Vinted listing ID

5. **Frontend Interface**:
   - "List on Vinted" button on items
   - Bulk list multiple items
   - Preview before listing
   - Edit listing details

6. **Components**:
   - VintedListButton.tsx: List action
   - VintedPreview.tsx: Preview listing
   - VintedBulkList.tsx: Bulk listing

7. **Error Handling**:
   - Vinted API errors
   - Photo upload failures
   - Retry mechanism

Include listing analytics (views, likes).
```

### Prompt 11.3: Photo Optimization

```
Implement automatic photo optimization:

1. **Photo Service** (server/src/services/photoService.ts):
   - optimizePhoto function:
     - Resize to optimal dimensions (1200x1600)
     - Compress while maintaining quality
     - Adjust brightness/contrast
     - Remove background (optional)
     - Add watermark (optional)
   
   - batchOptimize function:
     - Process multiple photos
     - Parallel processing

2. **Image Processing**:
   - Use Sharp library
   - Auto-rotate based on EXIF
   - Crop to standard aspect ratio
   - Enhance colors

3. **Backend Routes** (routes/photos.ts):
   - POST /api/photos/optimize
     - Accepts photo URL or upload
     - Returns optimized photo URL
   
   - POST /api/photos/batch-optimize
     - Accepts array of photos
     - Returns optimized URLs

4. **Frontend Integration**:
   - Automatic optimization on upload
   - Before/after preview
   - Manual optimization trigger
   - Batch optimize all item photos

5. **Components**:
   - PhotoOptimizer.tsx: Optimization interface
   - BeforeAfter.tsx: Comparison view
   - OptimizationSettings.tsx: Adjust settings

6. **Settings**:
   - Auto-optimize on upload (toggle)
   - Quality level (high/medium/low)
   - Background removal (on/off)
   - Watermark (on/off)

Include cost estimation for processing.
```

### Prompt 11.4: Republishing System

```
Create automated republishing for unsold items:

1. **Republishing Service** (server/src/services/republishService.ts):
   - shouldRepublish function:
     - Checks if item has been listed for X days
     - Checks if item has low views
     - Returns boolean
   
   - republishItem function:
     - Updates listing on Vinted
     - Bumps to top of search
     - Updates timestamp
     - Logs republish action

2. **Republishing Rules**:
   - Republish after 7 days if no views
   - Republish after 14 days if <10 views
   - Republish after 21 days regardless
   - Maximum 3 republishes per item

3. **Scheduled Job** (server/src/jobs/republishJob.ts):
   - Runs daily
   - Finds items needing republishing
   - Republishes automatically
   - Sends summary to Reusse

4. **Backend Routes** (routes/reusse.ts):
   - POST /api/reusse/items/:id/republish
     - Manual republish trigger
   
   - GET /api/reusse/republish-queue
     - Items scheduled for republishing

5. **Frontend Interface**:
   - Republish schedule display
   - Manual republish button
   - Republish history
   - Performance after republish

6. **Components**:
   - RepublishQueue.tsx: Upcoming republishes
   - RepublishButton.tsx: Manual trigger
   - RepublishHistory.tsx: Past republishes

7. **Analytics**:
   - Track republish effectiveness
   - Views before/after
   - Optimize republish timing

Include A/B testing for republish strategies.
```

### Prompt 11.5: Sales Analytics

```
Create comprehensive sales analytics:

1. **Analytics Service** (server/src/services/analyticsService.ts):
   - calculateSalesMetrics function:
     - Total sales
     - Average sale price
     - Sell-through rate
     - Time to sell
     - Best performing categories
     - Best performing brands
   
   - generateReport function:
     - Period-based reports
     - Comparison to previous period
     - Trends and insights

2. **Backend Routes** (routes/analytics.ts):
   - GET /api/analytics/sales
     - Query params: startDate, endDate, groupBy
     - Returns sales data
   
   - GET /api/analytics/performance
     - Reusse performance metrics
   
   - GET /api/analytics/insights
     - AI-generated insights

3. **Frontend Page** (client/src/pages/reusse/Analytics.tsx):
   - Page title: "Statistiques de vente"
   - Date range selector
   - Key metrics cards:
     - Total sales
     - Total revenue
     - Average sale price
     - Sell-through rate
     - Average time to sell
   
   - Charts:
     - Sales over time (line)
     - Sales by category (pie)
     - Sales by brand (bar)
     - Price distribution (histogram)
   
   - Top performers:
     - Best selling items
     - Best selling brands
     - Best selling categories
   
   - Insights:
     - "Your evening dresses sell 2x faster than average"
     - "Items priced at 30-50€ have highest sell-through"
     - "Listing on Wednesdays gets 30% more views"

4. **Components**:
   - AnalyticsChart.tsx: Chart wrapper
   - MetricCard.tsx: Metric display
   - InsightCard.tsx: Insight display
   - PerformanceTable.tsx: Top performers

5. **Export**:
   - Export charts as images
   - Export data as CSV
   - Generate PDF report

Include benchmarking against platform averages.
```

### Prompt 11.6: Buyer Inquiry Management

```
Create system for managing buyer inquiries from platforms:

1. **Database Model**:
   - BuyerInquiry model:
     - id, itemId, reusseId
     - platform (Vinted, etc.)
     - buyerName, buyerMessage
     - response, respondedAt
     - status (PENDING, RESPONDED, CONVERTED, LOST)
     - createdAt

2. **Backend Routes** (routes/reusse.ts):
   - GET /api/reusse/inquiries
     - Returns buyer inquiries
     - Filter: status, item, platform
   
   - POST /api/reusse/inquiries
     - Create inquiry manually
   
   - PUT /api/reusse/inquiries/:id
     - Update inquiry
     - Add response
     - Update status

3. **Frontend Page** (client/src/pages/reusse/BuyerInquiries.tsx):
   - Page title: "Questions des acheteurs"
   - Tabs: Pending, Responded, All
   - Inquiry cards:
     - Item details
     - Buyer question
     - Platform
     - Date
     - Response field
     - Quick replies
     - Mark as responded

4. **Quick Replies**:
   - Template responses:
     - "Oui, l'article est toujours disponible"
     - "Les mesures sont..."
     - "Je peux faire un envoi groupé"
     - Custom templates

5. **Components**:
   - InquiryCard.tsx: Inquiry display
   - ResponseEditor.tsx: Response interface
   - QuickReplySelector.tsx: Template selector

6. **Notifications**:
   - New inquiry notification
   - Reminder if not responded in 24h

Include conversion tracking (inquiry → sale).
```

---

## PHASE 12: HIGH VALUE FEATURES - PART 3

### Prompt 12.1: Early Withdrawal Feature

```
Implement early withdrawal with fee:

1. **Backend Route** (routes/payments.ts):
   - POST /api/payments/early-withdrawal
     - Checks pending earnings
     - Deducts 2€ fee
     - Creates payout
     - Updates transactions to PAID
     - Sends confirmation

2. **Controller** (controllers/paymentController.ts):
   - processEarlyWithdrawal function:
     - Validates minimum amount (10€)
     - Calculates fee
     - Creates Stripe payout
     - Creates fee transaction
     - Sends notification

3. **Frontend Component** (client/src/components/payments/EarlyWithdrawal.tsx):
   - Shows pending earnings
   - Shows fee (2€)
   - Shows net amount
   - Confirmation dialog
   - "Withdraw Now" button

4. **Restrictions**:
   - Minimum 10€ to withdraw
   - Maximum 1 withdrawal per week
   - Stripe account must be active

5. **Components**:
   - WithdrawalButton.tsx: Trigger withdrawal
   - WithdrawalConfirmation.tsx: Confirm dialog
   - WithdrawalSuccess.tsx: Success message

Include withdrawal history.
```

### Prompt 12.2: Reusse Subscription Tiers

```
Enhance subscription system with all tiers:

1. **Subscription Tiers** (defined in code):
   ```
   FREE: 0-2 active requests, 0€/month (first 2 orders)
   TIER_1: 1-2 active, 4€/month
   TIER_2: 3-5 active, 6€/month
   TIER_3: 6-9 active, 10€/month
   TIER_4: 10-19 active, 15€/month
   TIER_5: 20+ active, 20€/month
   ```

2. **Tier Benefits**:
   - All tiers include:
     - Platform access
     - Client matching
     - Payment processing
     - Insurance coverage
     - Community access
     - Training resources
     - Fiscal hotline
     - Quarterly tax bulletins

3. **Frontend Page** (client/src/pages/reusse/SubscriptionPlans.tsx):
   - Pricing table
   - Current tier highlighted
   - Upgrade/downgrade options
   - Feature comparison
   - FAQ about subscriptions

4. **Auto-upgrade/downgrade**:
   - Automatically adjust tier based on active requests
   - Prorate charges
   - Notify Reusse of tier change

5. **Components**:
   - PricingTable.tsx: All tiers display
   - TierCard.tsx: Individual tier
   - UpgradeButton.tsx: Upgrade CTA

Include grandfathered pricing for early users.
```

### Prompt 12.3: Automatic Billing

```
Implement automated monthly billing:

1. **Billing Service** (server/src/services/billingService.ts):
   - processMonthlyBilling function:
     - Gets all active Reusses
     - Calculates current tier
     - Creates Stripe charge
     - Creates Transaction record
     - Sends invoice
   
   - handleFailedPayment function:
     - Retry 3 times
     - Email notifications
     - Suspend after 3 failures
   
   - prorateBilling function:
     - Calculate prorated amount for tier changes
     - Credit/charge difference

2. **Scheduled Job** (server/src/jobs/billingJob.ts):
   - Runs on 1st of each month
   - Processes all subscriptions
   - Handles failures
   - Generates reports

3. **Backend Routes** (routes/subscriptions.ts):
   - GET /api/subscriptions/billing-history
     - Returns past invoices
   
   - GET /api/subscriptions/next-bill
     - Shows next billing amount and date

4. **Frontend Display**:
   - Next billing date
   - Next billing amount
   - Billing history
   - Download invoices

5. **Failed Payment Flow**:
   - Email: "Payment failed, please update card"
   - Retry in 3 days
   - Second email after 2nd failure
   - Suspend account after 3rd failure
   - Reactivate on successful payment

6. **Components**:
   - BillingHistory.tsx: Past invoices
   - NextBill.tsx: Upcoming charge
   - PaymentMethodUpdate.tsx: Update card

Include grace period and reactivation.
```

### Prompt 12.4: Invoice Generation

```
Create professional invoice generation:

1. **Invoice Service** (server/src/services/invoiceService.ts):
   - generateInvoice function:
     - Creates PDF invoice
     - Includes all required legal info
     - Unique invoice number
     - Company details
     - User details
     - Line items
     - Tax breakdown
     - Total amount
   
   - getInvoiceNumber function:
     - Format: INV-2026-001234
     - Sequential numbering
     - Stored in database

2. **Invoice Template**:
   - Professional design
   - Reusses branding
   - Clear layout
   - All legal requirements (French law)
   - QR code for verification

3. **Backend Routes** (routes/invoices.ts):
   - GET /api/invoices/:id
     - Returns invoice PDF
   
   - GET /api/invoices/download/:id
     - Downloads invoice
   
   - POST /api/invoices/send/:id
     - Emails invoice to user

4. **Frontend Components**:
   - InvoiceList.tsx: List of invoices
   - InvoicePreview.tsx: PDF preview
   - DownloadButton.tsx: Download invoice

5. **Auto-generation**:
   - Generate on payment completion
   - Generate on subscription charge
   - Generate on payout
   - Email automatically

6. **Storage**:
   - Store PDFs in cloud storage
   - Keep for 10 years (legal requirement)

Include VAT handling if applicable.
```

### Prompt 12.5: Tax Documentation

```
Create tax documentation for VDI Reusses:

1. **Tax Service** (server/src/services/taxService.ts):
   - generateQuarterlyBulletin function:
     - Calculates quarterly earnings
     - Generates pre-deduction bulletin
     - For VDI status compliance
   
   - generateAnnualSummary function:
     - Annual earnings summary
     - For tax declaration

2. **Backend Routes** (routes/tax.ts):
   - GET /api/tax/quarterly-bulletin
     - Query param: quarter, year
     - Returns PDF bulletin
   
   - GET /api/tax/annual-summary
     - Query param: year
     - Returns PDF summary

3. **Frontend Page** (client/src/pages/reusse/TaxDocuments.tsx):
   - Page title: "Documents fiscaux"
   - Quarterly bulletins:
     - Q1, Q2, Q3, Q4 for each year
     - Download buttons
   - Annual summaries:
     - Year selector
     - Download button
   - Tax information:
     - VDI status explanation
     - Tax obligations
     - Link to fiscal hotline

4. **Automated Generation**:
   - Generate quarterly bulletins automatically
   - Email to Reusse
   - Store in database

5. **Components**:
   - TaxDocumentList.tsx: Document list
   - QuarterlyBulletin.tsx: Bulletin display
   - TaxInfo.tsx: Information section

Include disclaimer about consulting tax professional.
```

### Prompt 12.6: Push Notifications

```
Implement push notifications for mobile/web:

1. **Push Service** (server/src/services/pushService.ts):
   - sendPushNotification function:
     - Uses Firebase Cloud Messaging or similar
     - Accepts: userId, title, body, data
     - Sends to all user's devices
   
   - registerDevice function:
     - Stores device token
     - Links to user

2. **Database Model**:
   - DeviceToken model:
     - id, userId, token, platform (web/ios/android)
     - createdAt, lastUsedAt

3. **Backend Routes** (routes/push.ts):
   - POST /api/push/register
     - Registers device token
   
   - POST /api/push/unregister
     - Removes device token

4. **Frontend Integration**:
   - Request notification permission
   - Register service worker (web)
   - Store device token
   - Handle incoming notifications

5. **Notification Types**:
   - New request available
   - Request accepted
   - New message
   - Item sold
   - Payment received
   - Meeting reminder

6. **User Preferences**:
   - Enable/disable push notifications
   - Choose which types to receive

7. **Components**:
   - PushPermissionRequest.tsx: Request permission
   - NotificationSettings.tsx: Preferences

Include notification sound and badge.
```

---

## PHASE 13: TESTING & REFINEMENT

### Prompt 13.1: Unit Testing Setup

```
Set up comprehensive unit testing:

1. **Testing Framework**:
   - Jest for backend
   - React Testing Library for frontend
   - Supertest for API testing

2. **Backend Tests** (server/src/__tests__/):
   - Test utilities (password, jwt, validation)
   - Test services (matching, commission, etc.)
   - Test controllers
   - Mock database with Prisma mock
   - Mock external services (Stripe, SendGrid)

3. **Frontend Tests** (client/src/__tests__/):
   - Test components
   - Test hooks
   - Test services
   - Mock API calls
   - Mock authentication

4. **Test Coverage**:
   - Aim for 80%+ coverage
   - Critical paths: 100% coverage
   - Generate coverage reports

5. **CI/CD Integration**:
   - Run tests on every commit
   - Block merge if tests fail
   - Coverage reports in PR

Create test files for all critical functions.
```

### Prompt 13.2: Integration Testing

```
Create integration tests for critical flows:

1. **Test Scenarios**:
   - Complete seller journey:
     - Register → Create request → Match with Reusse → Meeting → Items listed → Sale → Payment
   
   - Complete Reusse journey:
     - Register → Get approved → Accept request → Add items → Propose prices → Record sale → Get paid
   
   - Payment flows:
     - Service fee payment
     - Commission calculation
     - Payout processing
     - Subscription billing

2. **API Integration Tests** (server/src/__tests__/integration/):
   - Test complete API flows
   - Use test database
   - Seed test data
   - Clean up after tests

3. **E2E Tests** (optional, run locally):
   - Playwright or Cypress
   - Test critical user flows
   - Visual regression testing

4. **Test Data**:
   - Create seed data for testing
   - Test users (seller, reusse, admin)
   - Test requests
   - Test items

Include performance testing for key endpoints.
```

### Prompt 13.3: Bug Fixes & Refinement

```
Systematic bug fixing and refinement:

1. **Bug Tracking**:
   - Create issues for all known bugs
   - Prioritize by severity
   - Assign to phases

2. **Common Issues to Check**:
   - Form validation edge cases
   - Error handling
   - Loading states
   - Empty states
   - Mobile responsiveness
   - Cross-browser compatibility
   - Accessibility (WCAG 2.1)

3. **Performance Optimization**:
   - Database query optimization
   - Image lazy loading
   - Code splitting
   - Caching strategies
   - API response times

4. **Security Audit**:
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
   - Rate limiting
   - Input validation
   - Authentication security

5. **UX Refinement**:
   - Improve error messages
   - Add helpful tooltips
   - Improve loading indicators
   - Add success confirmations
   - Smooth transitions

Create checklist for final review.
```

### Prompt 13.4: Documentation

```
Create comprehensive documentation:

1. **User Documentation**:
   - Getting started guide (sellers)
   - Getting started guide (Reusses)
   - FAQ (comprehensive)
   - Video tutorials
   - Troubleshooting guide

2. **Developer Documentation**:
   - README with setup instructions
   - API documentation (Swagger/OpenAPI)
   - Database schema documentation
   - Architecture overview
   - Deployment guide
   - Environment variables guide

3. **Admin Documentation**:
   - Admin panel guide
   - User management procedures
   - Payment management procedures
   - Dispute resolution guide
   - Emergency procedures

4. **Code Documentation**:
   - JSDoc comments
   - Function documentation
   - Complex logic explanation
   - API endpoint documentation

Include onboarding materials for new team members.
```

---

## DEPLOYMENT & LAUNCH

### Final Prompt: Production Deployment

```
Prepare for production deployment on Replit:

1. **Environment Setup**:
   - Production environment variables
   - Production database
   - Production Stripe keys
   - Production email service
   - Production cloud storage

2. **Security Checklist**:
   - All secrets in Replit Secrets
   - HTTPS enforced
   - CORS configured
   - Rate limiting active
   - SQL injection prevention verified
   - XSS prevention verified
   - Authentication secure

3. **Performance**:
   - Database indexes created
   - Caching configured
   - Image optimization active
   - Code minified
   - Gzip compression enabled

4. **Monitoring**:
   - Error logging (Sentry or similar)
   - Performance monitoring
   - Uptime monitoring
   - Database monitoring

5. **Backup**:
   - Database backup strategy
   - Automated daily backups
   - Backup restoration tested

6. **Launch Checklist**:
   - All tests passing
   - Documentation complete
   - Admin account created
   - Test transactions successful
   - Email sending working
   - Payment processing working
   - Mobile responsive verified
   - Cross-browser tested

7. **Post-Launch**:
   - Monitor error logs
   - Monitor performance
   - Collect user feedback
   - Plan iteration 2

Deploy to production and monitor closely for first 48 hours.
```

---

## SUMMARY

This comprehensive prompt set covers:
- **39 MVP features** across 9 phases
- **28 High Value features** across 3 additional phases
- Complete technical implementation
- Testing and refinement
- Production deployment

**Total Timeline**: Approximately 26-28 weeks with Replit AI assistance

**Key Success Factors**:
1. Execute prompts sequentially
2. Test each feature before moving on
3. Commit code regularly
4. Document as you build
5. Get user feedback early and often

**Next Steps**:
1. Set up Replit project
2. Start with Phase 1, Prompt 1.1
3. Work through systematically
4. Adapt prompts based on Replit's responses
5. Launch MVP, then add High Value features
