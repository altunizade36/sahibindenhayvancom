# sahibindenhayvan.com - Turkish Animal Classifieds Platform

## Project Overview
A comprehensive Turkish animal classifieds platform featuring live streaming, real-time auctions, multi-role dashboards, extensive animal categorization, blog system, veterinary services, and transportation services.

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
- **users**: User accounts with role-based access
- **categories**: Hierarchical animal categories
- **listings**: Animal listings with images and details
- **auctions**: Auction configurations
- **bids**: Auction bid history
- **live_streams**: Live streaming sessions
- **messages**: Chat messages
- **blog_posts**: Blog articles
- **vet_services**: Veterinary service offerings
- **transport_services**: Transportation services
- **reviews**: Service reviews
- **favorites**: User favorites

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

## Development Status

### Completed
✅ Database schema design (all tables)
✅ Storage interface with full CRUD operations
✅ Authentication system (JWT, multi-role)
✅ API routes (listings, auctions, streams, blog, services)
✅ WebSocket server (chat, bidding)
✅ Agora.io integration (token generation)
✅ Theme colors (Turkish marketplace aesthetics)
✅ Core UI components (Navbar, ListingCard, SearchBar, CategoryGrid)
✅ Homepage with search and categories
✅ Authentication pages (login, register)

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
