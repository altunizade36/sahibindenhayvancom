### Overview
sahibindenhayvan.com is a completely FREE Turkish animal classifieds platform designed for comprehensive listing features with advanced search, filtering, and categorization. The primary goal is user acquisition by offering free listings for pets, livestock, birds, fish, horses, and beekeeping. Future plans include monetization through premium features, advertising, and sales commissions.

**Production Status (Nov 2025):**
- ✅ MVP Feature-Complete: All core features functional, load testing required before production deployment
- ✅ Full PostgreSQL Migration: Zero data loss on restart, Neon serverless Pool
- ✅ 20+ Database Indexes: Optimized query performance
- ✅ Security Hardening: Rate limiting, JWT auth, bcrypt passwords
- ✅ **Phase 1 Scalability Complete**: Redis distributed cache (Upstash), Node.js cluster mode, health checks, Prometheus metrics
- ✅ **Comprehensive Category System**: 459 hierarchical categories across 14 main domains with up to 3 depth levels (Nov 2025 update)
- ⚠️  Capacity Unknown: Load testing required to determine concurrent user limits
- 📋 Scale to 200k+ Users: Requires CDN, read replicas, advanced pooling - See `PRODUCTION_SCALABILITY.md`

### User Preferences
No specific user preferences were provided in the original document.

### System Architecture

**Design Decisions:**
- **UI/UX**: Utilizes Shadcn UI and Tailwind CSS for a modern, responsive design. Features a Turkish marketplace theme with Blue (#0066CC) as primary, Gold/Yellow as secondary, and Inter, Poppins, Space Grotesk fonts. Layouts include responsive grids for listings, categories, and blog posts, with a prominent central search bar and sticky header.
- **Multi-Role System**: Supports Guest, Buyer, Seller, Veterinarian, Transporter, and Admin roles, each with specific permissions and features.
- **Free Platform Model**: All listing, auction, and live streaming features are free to encourage user acquisition. Payment infrastructure has been entirely removed.
- **Full PostgreSQL Storage**: Complete migration to PostgreSQL (Neon serverless) with Drizzle ORM. All features (users, listings, messages, auctions, services, blog) use PostgreSQL with connection pooling.
- **Security**: Implements JWT authentication, password hashing with bcrypt, password sanitization, privilege escalation prevention via whitelisted profile fields, and secure WebSocket authentication using JWT tokens.

**Technical Implementations:**
- **Frontend**: React + TypeScript + Vite, with React Hook Form + Zod for forms, and TanStack Query for state management.
- **Backend**: Node.js + Express.
- **Real-time**: WebSocket for messaging and live stream chat.
- **Core Functionality**:
    - **Animal Listings**: Advanced search, filtering (price, location, breed, age, health), image galleries, document uploads.
    - **Hierarchical Categories**: 14 main categories with 800+ subcategories including:
        - Evcil Hayvanlar (Pets): Dogs, cats, birds, fish, rodents, reptiles, amphibians, exotic animals
        - Çiftlik Hayvanları (Farm): Cattle, sheep, goats, poultry, camels, beekeeping
        - Balıklar ve Su Ürünleri: Freshwater, saltwater, shellfish
        - Atlar ve Binicilik: Horse breeds, riding equipment, care
        - Arıcılık: Bee breeds, equipment, honey products
        - Kümes ve Süs Kuşları: Poultry, ornamental birds
        - Sürüngenler ve Amfibiler: Snakes, turtles, lizards, amphibians
        - Kemirgenler: Hamsters, rabbits, guinea pigs, chinchillas
        - Egzotik Hayvanlar: Exotic mammals, birds, insects
        - Plus: Feed/Food, Equipment, Veterinary Services, Documents, Stores
    - **Messaging**: Real-time chat between buyers and sellers, listing-specific threads.
    - **Services**: Veterinary and transportation service listings with profiles, reviews, and ratings.
    - **Blog System**: Animal care articles, veterinary advice, nutrition and training guides by veterinarians.
    - **Live Streaming**: Real-time video streaming with chat and viewer count tracking.
    - **User Profiles**: "My Listings" and "Favorites" tabs with management options.
    - **Comprehensive Pages**: Dedicated pages for listing lists, detail pages, profile management, real-time messaging, veterinary services, and transportation services.

**Key API Endpoints:**
- **Authentication**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/profile`
- **Listings**: `/api/listings` (CRUD operations)
- **Auctions**: `/api/auctions` (list, detail, create), `/api/auctions/:id/bids`
- **Live Streams**: `/api/streams` (list, detail, create, update), `/api/streams/:id/token`
- **Messages**: `/api/messages/conversations`, `/api/messages/:userId`, `/api/messages`
- **Services**: `/api/vet-services`, `/api/transport-services` (list, create)
- **Blog**: `/api/blog` (list, detail, create)
- **Favorites**: `/api/favorites` (list, add, remove)

**WebSocket Events:**
- **Client → Server**: `chat`, `bid`, `stream_chat`
- **Server → Client**: `chat`, `chat_sent`, `new_bid`, `stream_message`

### External Dependencies
- **Database**: PostgreSQL (Neon serverless) with connection pooling - Full migration complete
- **Caching**: Redis (Upstash) distributed cache - 169x performance improvement (categories: 24h TTL, blog: 1h, in-memory fallback)
- **Real-time Communication**: WebSocket
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **State Management**: TanStack Query
- **Authentication**: JSON Web Tokens (JWT)
- **Live Streaming**: Agora.io (for RTC token generation)
- **Password Hashing**: bcrypt
- **Image Storage**: Replit Object Storage (configured)
- **Monitoring**: Health checks (/health), Prometheus metrics (/metrics)