### Overview
sahibindenhayvan.com is a free Turkish animal classifieds platform offering comprehensive listing features with advanced search, filtering, and categorization for pets, livestock, birds, fish, horses, and beekeeping. The platform aims for user acquisition through free listings and plans future monetization via premium features, advertising, and sales commissions. It includes a robust professional stores system for verified sellers, a blog system for legal compliance and animal care information, and is production-ready, load-tested, and optimized for security and mobile responsiveness.

### User Preferences
No specific user preferences were provided in the original document.

### System Architecture

**Design Decisions:**
- **UI/UX**: Modern, responsive design using Shadcn UI and Tailwind CSS, featuring a Turkish marketplace theme with Blue as primary, Gold/Yellow as secondary, and Inter, Poppins, Space Grotesk fonts. Layouts include responsive grids, a central search bar, and sticky header. Includes dedicated mobile responsiveness features like a hamburger menu and touch-friendly UI.
- **Multi-Role System**: Supports Guest, Buyer, Seller, Veterinarian, Transporter, and Admin roles with specific permissions.
- **Free Platform Model**: All listing features are free to encourage user acquisition; payment infrastructure is removed.
- **Full PostgreSQL Storage**: Complete migration to PostgreSQL (Neon serverless) with Drizzle ORM for all data (users, listings, messages, stores, blog).
- **Security**: Triple authentication system (Replit Auth OAuth, Email/Password, Firebase Phone Auth with SMS), session-based authentication with PostgreSQL session store, role-based access control, Zod validation, manual listing moderation, spam filtering, reCAPTCHA v3, and IP tracking.
- **Firebase Phone Authentication**: Production-ready SMS verification using Firebase Auth. Supports Turkish phone numbers (+90), invisible reCAPTCHA for bot protection, and automatic user creation/login. Firebase Admin SDK verifies tokens server-side.
- **Professional Stores System**: Verified sellers can create branded storefronts with custom logos, banners, and color themes. Supports various store types like Petshop, Veterinary, etc., with a review system and admin approval workflow.
- **Blog System**: Features 32 professional blog posts covering various animal types, including legal disclaimers and citations from Turkish veterinary organizations. Admin-only CRUD for blog management.

**Technical Implementations:**
- **Frontend**: React + TypeScript + Vite, with React Hook Form + Zod for forms, and TanStack Query for state management.
- **Backend**: Node.js + Express.
- **Real-time**: WebSocket for messaging with session-based authentication (uses Replit Auth session cookies).
- **Core Functionality**:
    - **Animal Listings**: Advanced search with 6 filters (price, location, breed, age, health), image galleries, document uploads, and moderation.
    - **Hierarchical Categories**: 459 categories across 14 main domains (e.g., Pets, Farm Animals, Fish, Horses, Beekeeping).
    - **Messaging**: Real-time chat between buyers and sellers.
    - **Services**: Listings for veterinary and transportation services with profiles, reviews, and ratings.
    - **User Profiles**: "My Listings" and "Favorites" tabs.

**Key API Endpoints:**
- **Authentication**: `/api/login` (OAuth login), `/api/logout`, `/api/callback` (OAuth callback), `/api/auth/user` (get current user), `/api/auth/profile` (PATCH - update profile), `/api/auth/firebase/verify` (Firebase phone auth token verification)
- **Categories**: `/api/categories`, `/api/categories/tree`, `/api/categories/:slug`, `/api/categories/stats`
- **Listings**: `/api/listings` (CRUD, advanced search), `/api/listings/hot`, `/api/listings/:id/similar`
- **Messages**: `/api/messages/conversations`, `/api/messages/:userId`, `/api/messages`
- **Notifications**: `/api/notifications` (GET list, POST create), `/api/notifications/count` (unread count), `/api/notifications/:id/read` (PATCH mark read), `/api/notifications/read-all` (POST mark all read), `/api/notifications/:id` (DELETE)
- **Reports**: `/api/reports` (POST create report), `/api/reports/my` (GET user's reports), `/api/admin/reports` (GET all, PATCH update status)
- **Services**: `/api/vet-services`, `/api/transport-services`
- **Blog**: `/api/blog` (public read-only), `/api/admin/blog` (admin-only CRUD)
- **Favorites**: `/api/favorites`
- **Admin**: `/api/admin/stats`, `/api/admin/listings` (moderation), `/api/admin/listings/:id/status`, `/api/admin/reports` (report management)

**WebSocket Events:**
- **Client → Server**: `chat`
- **Server → Client**: `chat`, `chat_sent`

### External Dependencies
- **Database**: PostgreSQL (Neon serverless) with connection pooling.
- **Caching**: In-memory cache with Redis fallback.
- **Email Service**: Resend (production), console logging (development).
- **UI Components**: Shadcn UI.
- **Styling**: Tailwind CSS.
- **Form Handling**: React Hook Form, Zod.
- **State Management**: TanStack Query.
- **Authentication**: Triple auth system - Replit Auth (OIDC-based OAuth), Email/Password with bcrypt, Firebase Phone Auth with SMS verification.
- **Firebase**: Phone authentication with real SMS delivery (10,000 free SMS/month), Admin SDK for server-side token verification.
- **Session Storage**: PostgreSQL (sessions table) with 7-day TTL.
- **Image Storage**: Replit Object Storage with Sharp-based processing.
  - **Image Processing System**: Server-side image processing with Sharp library
    - Automatic WebP conversion for optimized file sizes
    - Multiple size variants: thumbnail (320px), medium (800px), large (1600px)
    - EXIF rotation handling
    - Stored in `listing_images` table with variant URLs
    - API endpoints: `/api/listing-images/upload`, `/api/listing-images/:listingId`, reorder and cover selection
  - **Frontend Upload**: Drag-drop interface with progress indicators, image reordering, cover photo selection
- **Bot Protection**: Google reCAPTCHA v3 for forms, Firebase invisible reCAPTCHA for phone auth.
- **Monitoring**: Health checks, Prometheus metrics.