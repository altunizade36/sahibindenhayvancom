### Overview
sahibindenhayvan.com is a free Turkish animal classifieds platform providing extensive listing features for various animal types, including pets, livestock, and birds. Its primary goal is user acquisition through free listings, with future monetization plans including premium features, advertising, and sales commissions. The platform supports a professional stores system for verified sellers and a blog for legal information and animal care. It is designed to be production-ready, secure, load-tested, and mobile-responsive.

### User Preferences
No specific user preferences were provided in the original document.

### System Architecture

**UI/UX Decisions**:
The platform features a modern, responsive design leveraging Shadcn UI and Tailwind CSS, with a Turkish marketplace aesthetic. The color scheme uses blue as primary and gold/yellow as secondary, with Inter, Poppins, and Space Grotesk fonts. It includes responsive grids, a central search bar, sticky header, and mobile-specific features like a hamburger menu.

**System Design Choices**:
- **Multi-Role System**: Supports Guest, Buyer, Seller, Veterinarian, Transporter, and Admin roles with distinct permissions.
- **Free Platform Model**: All listing features are free to promote user growth.
- **Full PostgreSQL Storage**: Utilizes PostgreSQL (Neon serverless) with Drizzle ORM for all data, including users, listings, messages, and blog content.
- **Security**: Implements triple authentication (Replit Auth OAuth, Email/Password, Firebase Phone Auth), session-based authentication, role-based access control, Zod validation, manual listing moderation, spam filtering, reCAPTCHA v3, and IP tracking.
- **Turkish Legal Compliance (KVKK 2024)**: Adheres to Turkish laws regarding animal protection, veterinary services, protected species (CITES), and hunting regulations. Prohibits pet shop/store sales of cats/dogs and requires microchips/passports, TÜRKVET registration for livestock, and permits for protected species.
- **Professional Stores System**: Verified sellers can create branded storefronts with custom designs and a review system, subject to admin approval.
- **Blog System**: Features 32 professional blog posts on animal care and legal aspects, managed by administrators.

**Technical Implementations**:
- **Frontend**: Built with React, TypeScript, and Vite, using React Hook Form + Zod for forms and TanStack Query for state management.
- **Backend**: Powered by Node.js and Express.
- **Real-time**: Implements WebSocket for messaging with session-based authentication.
- **Core Functionality**:
    - **Animal Listings**: Advanced search with multiple filters, image galleries, document uploads, and moderation. Sensitive registration data is not stored publicly. Supports Turkish locale price formatting.
    - **Infinite Scroll + Pagination**: Hybrid browsing on the homepage and traditional pagination with filters on listing pages.
    - **Hierarchical Categories**: Features 643 categories across 17 main domains: Evcil Hayvanlar (Pets), Çiftlik Hayvanları (Farm Animals), Balıklar ve Su Ürünleri (Fish), Atlar ve Binicilik (Horses), Arıcılık (Beekeeping), Kümes ve Süs Kuşları (Birds), Sürüngenler ve Amfibiler (Reptiles), Kemirgenler ve Küçük Hayvanlar (Rodents), Yem/Mama/Tarım, Ekipmanlar, Veterinerlik, Kayıt/Belgeler, Mağazalar, Tarım & Kırsal Emlak (Agricultural Real Estate), Araçlar & Nakliye (Vehicles & Transport), Üretim & İşleme Tesisleri (Production Facilities), İnşaat & Yapı (Construction).
    - **Advanced Messaging System**: Real-time chat with text, image, file, system, and offer message types, read receipts, typing indicators, online/offline status, file sharing, message search, and conversation management (archive, pin, mute).
    - **User Panel System**: A modern dashboard for users to manage listings, favorites, and account settings.
    - **Competitive Features**: Includes recently viewed listings, listing comparison, guest contact forms (reCAPTCHA protected), individual seller rating, saved search email notifications, direct video upload, and advanced category/market statistics.
- **API Endpoints**: Comprehensive RESTful API for authentication, categories, listings, messages, notifications, reports, services, blog, favorites, saved searches, seller analytics, recently viewed items, seller reviews, contact requests, video uploads, category statistics, and admin functionalities.
- **WebSocket Events**: Supports real-time client-to-server and server-to-client events for chat, typing, read receipts, and presence.

### External Dependencies
- **Database**: PostgreSQL (Neon serverless) with connection pooling.
- **Caching**: In-memory cache with Redis fallback.
- **Email Service**: Resend (production) and console logging (development).
- **UI Components**: Shadcn UI.
- **Styling**: Tailwind CSS.
- **Form Handling**: React Hook Form, Zod.
- **State Management**: TanStack Query.
- **Authentication**: Replit Auth (OIDC-based OAuth), Email/Password (bcrypt), Firebase Phone Auth (SMS verification).
- **Firebase**: Used for phone authentication with real SMS delivery and Admin SDK for server-side token verification.
- **Session Storage**: PostgreSQL with a 7-day TTL.
- **Image Storage**: Replit Object Storage with Sharp-based server-side processing for WebP conversion, multiple size variants, EXIF rotation, and frontend drag-drop upload.
- **Bot Protection**: Google reCAPTCHA v3 for forms and Firebase invisible reCAPTCHA for phone authentication.
- **Monitoring**: Health checks and Prometheus metrics.