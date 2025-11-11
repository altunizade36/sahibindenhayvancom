# sahibindenhayvan.com - FREE Turkish Animal Classifieds Platform

## Project Overview
A completely FREE Turkish animal classifieds platform (no listing fees, no auction fees, no streaming fees) featuring Agora.io live streaming with real-time chat, auctions, multi-role dashboards, extensive animal categorization, blog system, veterinary services, and transportation services. Platform prioritizes user acquisition over monetization.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (in-memory storage for MVP)
- **Real-time**: WebSocket for chat and auctions
- **Live Streaming**: Agora.io
- **UI Components**: Shadcn UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query
- **Authentication**: JWT

## Key Features

### Multi-Role System
- **Guest**: Browse listings, watch live streams, view auctions
- **Buyer**: All guest features + favorites, messaging, bidding
- **Seller**: Create listings, start live streams, create auctions
- **Veterinarian**: Write blog posts, offer vet services
- **Transporter**: Offer transportation services
- **Admin**: Full platform management

### Core Functionality
1. **Animal Listings**
   - Categories: Pets, Livestock, Birds, Fish, Horses, Beekeeping
   - Rich filters: price, location, breed, age, health status
   - Premium and urgent listings
   - Image galleries and documents (vaccination, pedigree)

2. **Live Streaming** (Agora.io)
   - Sellers can showcase animals live
   - Real-time chat during streams
   - Link listings to streams
   - Viewer count tracking

3. **Auction System**
   - Real-time bidding via WebSocket
   - Countdown timers
   - Buy-now option
   - Bid history and notifications

4. **Messaging**
   - Real-time chat between buyers and sellers
   - WebSocket-powered conversations
   - Listing-specific threads

5. **Services**
   - Veterinary services with reviews and ratings
   - Transportation services for animal delivery
   - Service provider profiles

6. **Blog System**
   - Animal care articles
   - Veterinary advice
   - Nutrition and training guides

## Project Structure

### Backend (`server/`)
- `index.ts`: Express app setup
- `routes.ts`: All API routes and WebSocket handling
- `storage.ts`: In-memory storage implementation
- `db.ts`: Database connection (for future PostgreSQL migration)

### Frontend (`client/src/`)
- `pages/`: Route components (home, login, register, etc.)
- `components/`: Reusable UI components
  - `navbar.tsx`: Main navigation with user menu
  - `listing-card.tsx`: Animal listing cards
  - `search-bar.tsx`: Search with category filter
  - `category-grid.tsx`: Category navigation
- `lib/`: Utilities
  - `auth.tsx`: Authentication context and hooks
  - `queryClient.ts`: TanStack Query setup

### Shared (`shared/`)
- `schema.ts`: Drizzle ORM schema and Zod validation schemas

## Database Schema

### Core Tables
- **users**: User accounts with role-based access (NO wallet fields)
- **categories**: Hierarchical animal categories
- **listings**: Animal listings with images and details (FREE to create)
- **auctions**: Auction configurations (FREE to create)
- **bids**: Auction bid history
- **live_streams**: Live streaming sessions (FREE to start)
- **stream_chat_messages**: Real-time chat during streams
- **stream_viewers**: Active viewer tracking
- **stream_bans**: Banned users from streams
- **stream_mutes**: Muted users in stream chat
- **messages**: Chat messages
- **blog_posts**: Blog articles
- **vet_services**: Veterinary service offerings
- **transport_services**: Transportation services
- **reviews**: Service reviews
- **favorites**: User favorites

### REMOVED Tables (Payment Infrastructure Deleted)
- ~~transactions~~ - Deleted (no payment tracking)
- ~~walletBalance field in users~~ - Removed
- ~~stripeCustomerId field in users~~ - Removed

## API Endpoints

### Authentication
- `POST /api/auth/register`: User registration
- `POST /api/auth/login`: User login
- `GET /api/auth/me`: Get current user
- `PATCH /api/auth/profile`: Update profile

### Listings
- `GET /api/listings`: List all listings (with filters)
- `GET /api/listings/:id`: Get listing details
- `POST /api/listings`: Create listing
- `PATCH /api/listings/:id`: Update listing
- `DELETE /api/listings/:id`: Delete listing

### Auctions
- `GET /api/auctions`: List auctions
- `GET /api/auctions/:id`: Get auction details
- `POST /api/auctions`: Create auction
- `GET /api/auctions/:id/bids`: Get bid history

### Live Streams
- `GET /api/streams`: List streams
- `GET /api/streams/:id`: Get stream details
- `POST /api/streams`: Create stream
- `PATCH /api/streams/:id`: Update stream
- `POST /api/streams/:id/token`: Generate Agora token

### Messages
- `GET /api/messages/conversations`: Get user conversations
- `GET /api/messages/:userId`: Get messages with user
- `POST /api/messages`: Send message

### Services
- `GET /api/vet-services`: List vet services
- `POST /api/vet-services`: Create vet service
- `GET /api/transport-services`: List transport services
- `POST /api/transport-services`: Create transport service

### Blog
- `GET /api/blog`: List blog posts
- `GET /api/blog/:slug`: Get blog post
- `POST /api/blog`: Create blog post

### Favorites
- `GET /api/favorites`: Get user favorites
- `POST /api/favorites`: Add favorite
- `DELETE /api/favorites/:listingId`: Remove favorite

## WebSocket Events

### Client → Server
- `chat`: Send chat message
- `bid`: Place auction bid
- `stream_chat`: Send live stream chat message

### Server → Client
- `chat`: Receive chat message
- `chat_sent`: Message sent confirmation
- `new_bid`: New bid notification
- `stream_message`: Live stream chat message

## Environment Variables
- `SESSION_SECRET`: JWT secret key
- `AGORA_APP_ID`: Agora.io application ID
- `AGORA_APP_CERTIFICATE`: Agora.io app certificate
- `DATABASE_URL`: PostgreSQL connection (for future use)

## Design System

### Colors (Turkish Marketplace Theme)
- **Primary**: Blue (#0066CC) - Trust and reliability
- **Secondary**: Gold/Yellow - Premium features
- **Accent**: Light blue/cyan - Interactive elements
- **Destructive**: Red - Urgent listings, live indicators

### Typography
- Primary: Inter (UI, body text)
- Headings: Poppins (hero, titles)
- Accent: Space Grotesk (pricing, stats)

### Layout Patterns
- Listing cards: 4-column grid (responsive)
- Category tiles: 6-column grid
- Blog posts: 3-column grid
- Search bar: Prominent center position
- Sticky header navigation

## Security Features

### Critical Security Implementations
✅ **JWT Authentication**: Mandatory SESSION_SECRET environment variable - application fails fast if missing
✅ **Password Security**: All user responses sanitized to remove password hashes before sending to client
✅ **Privilege Escalation Prevention**: Profile updates whitelist only safe fields (fullName, phone, city, district, bio, avatar) - role changes blocked
✅ **Agora Validation**: Live streaming token endpoint validates credentials and returns controlled error if missing
✅ **JWT Token Expiry**: All tokens expire after 7 days
✅ **Password Hashing**: bcrypt with salt rounds for secure password storage

### Security Audit Trail
- 2025-01-11: Removed hard-coded JWT fallback secret (critical fix)
- 2025-01-11: Added password sanitization across all user-returning endpoints
- 2025-01-11: Implemented profile update field whitelist to prevent role escalation
- 2025-01-11: Added Agora credential validation with controlled error responses

## Free Platform Architecture (Nov 11, 2025)

### What Changed
**MAJOR PIVOT: Completely FREE platform**
- ❌ Removed all payment infrastructure (Stripe, iyzico)
- ❌ Deleted wallet system (balance tracking, transactions)
- ❌ Removed listing fees (was 50₺ base + 50₺ premium + 25₺ urgent)
- ❌ Removed auction entry fees
- ❌ Deleted /cuzdan (wallet) page
- ✅ Users can now create unlimited listings, auctions, and streams FOR FREE

### Why Free?
**User acquisition strategy** - Build a large user base first, implement monetization later through:
- Premium features (future)
- Advertising (future)
- Commission on successful sales (future)

## Development Status

### Completed ✅
✅ **Database schema design** (all tables: users, listings, categories, auctions, live_streams, bids, messages, blog_posts, services, reviews, favorites)
✅ **Storage interface** with full CRUD operations for all entities
✅ **Authentication system** (JWT, multi-role) with security hardening
  - Mandatory SESSION_SECRET environment variable
  - Password sanitization across all endpoints
  - Privilege escalation prevention (whitelisted profile fields)
✅ **API routes** (listings, auctions, streams, blog, services, favorites, categories)
  - Full REST API with proper error handling
  - Query parameter support for filtering
✅ **WebSocket server** (real-time chat and auction bidding)
✅ **Agora.io integration** (live streaming token generation with credential validation)
✅ **Theme colors** (Turkish marketplace aesthetics - blue primary, gold accents)
✅ **Core UI components** (Navbar with user menu, ListingCard, SearchBar with category filter, CategoryGrid)
✅ **Homepage** with hero section, search bar, categories grid, featured listings sections
✅ **Authentication pages** (login at /giris, register at /kayit)
  - Form validation with Zod
  - Auto-login after registration
  - Secure password handling
✅ **TanStack Query setup** with proper query parameter serialization
✅ **End-to-end testing** - Registration and login flow verified

### In Progress
🚧 Additional pages (listings list, listing detail, live streams, auctions)
🚧 Dashboard implementation
🚧 Blog system frontend
🚧 Service listings frontend

### Planned
⏳ Object storage integration for images
⏳ Email notifications
⏳ Payment integration
⏳ Admin panel
⏳ Mobile responsive optimizations
⏳ SEO optimization

## Turkish Language Features
- All UI text in Turkish
- Turkish date formats (DD.MM.YYYY)
- Turkish Lira (₺) currency formatting
- Turkish locale for date-fns
- Phone number format: (0XXX) XXX XX XX
- Address hierarchy: İl (Province) → İlçe (District)

## Running the Project
```bash
npm run dev
```
Starts both Express server and Vite dev server on port 5000.

## Testing
- Use `/giris` for login page
- Use `/kayit` for registration page
- Homepage at `/` shows categories, search, and featured listings

## Notes
- Currently using in-memory storage for MVP
- Ready for PostgreSQL migration (schema defined with Drizzle ORM)
- WebSocket connection requires JWT token in query params
- Agora tokens expire after 1 hour
- All images stored via Replit Object Storage (configured)
