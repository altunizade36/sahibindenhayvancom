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
- **Security**: JWT authentication, bcrypt password hashing, role-based access control, Zod validation, email verification system, manual listing moderation, spam filtering, reCAPTCHA v3, and IP tracking.
- **Professional Stores System**: Verified sellers can create branded storefronts with custom logos, banners, and color themes. Supports various store types like Petshop, Veterinary, etc., with a review system and admin approval workflow.
- **Blog System**: Features 32 professional blog posts covering various animal types, including legal disclaimers and citations from Turkish veterinary organizations. Admin-only CRUD for blog management.

**Technical Implementations:**
- **Frontend**: React + TypeScript + Vite, with React Hook Form + Zod for forms, and TanStack Query for state management.
- **Backend**: Node.js + Express.
- **Real-time**: WebSocket for messaging.
- **Core Functionality**:
    - **Animal Listings**: Advanced search with 6 filters (price, location, breed, age, health), image galleries, document uploads, and moderation.
    - **Hierarchical Categories**: 459 categories across 14 main domains (e.g., Pets, Farm Animals, Fish, Horses, Beekeeping).
    - **Messaging**: Real-time chat between buyers and sellers.
    - **Services**: Listings for veterinary and transportation services with profiles, reviews, and ratings.
    - **User Profiles**: "My Listings" and "Favorites" tabs.

**Key API Endpoints:**
- **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/profile`
- **Categories**: `/api/categories`, `/api/categories/tree`, `/api/categories/:slug`, `/api/categories/stats`
- **Listings**: `/api/listings` (CRUD, advanced search), `/api/listings/hot`, `/api/listings/:id/similar`
- **Messages**: `/api/messages/conversations`, `/api/messages/:userId`, `/api/messages`
- **Services**: `/api/vet-services`, `/api/transport-services`
- **Blog**: `/api/blog` (public read-only), `/api/admin/blog` (admin-only CRUD)
- **Favorites**: `/api/favorites`
- **Admin**: `/api/admin/stats`, `/api/admin/listings` (moderation), `/api/admin/listings/:id/status`

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
- **Authentication**: JSON Web Tokens (JWT).
- **Password Hashing**: bcrypt.
- **Image Storage**: Replit Object Storage.
- **Bot Protection**: Google reCAPTCHA v3.
- **Monitoring**: Health checks, Prometheus metrics.