# Design Guidelines: sahibindenhayvan.com

## Design Approach

**Hybrid Reference Strategy**: Drawing from established Turkish marketplace patterns (Sahibinden.com) combined with modern social commerce aesthetics (Instagram shopping, Airbnb listings) and streaming platforms (Twitch/YouTube Live).

**Core Principle**: Build trust through clarity, showcase animals beautifully, and make transactions effortless.

## Typography System

**Font Families** (via Google Fonts):
- Primary: Inter (UI, body text, forms)
- Headings: Poppins (hero sections, page titles)
- Accent: Space Grotesk (pricing, stats, CTAs)

**Scale**:
- Hero: 4xl/5xl (48-64px)
- Page Titles: 3xl (36px)
- Section Headers: 2xl (24px)
- Card Titles: lg (18px)
- Body: base (16px)
- Captions/Meta: sm (14px)
- Labels: xs (12px)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 3, 4, 6, 8, 12, 16, 24
- Tight spacing: 2-3 (form elements, compact lists)
- Standard spacing: 4-6 (card padding, button groups)
- Section spacing: 12-16 (between content blocks)
- Page sections: 24 (vertical rhythm between major sections)

**Grid Structure**:
- Listing cards: 4 columns desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Category tiles: 3-4 columns (grid-cols-2 lg:grid-cols-4)
- Blog posts: 3 columns (grid-cols-1 md:grid-cols-3)
- Dashboard panels: 2 columns for stats/metrics

**Container Max-Widths**:
- Full-width sections: max-w-7xl
- Content sections: max-w-6xl
- Forms/dashboards: max-w-5xl
- Blog articles: max-w-3xl

## Component Library

### Navigation
**Top Navbar**:
- Fixed position with subtle shadow/border
- Logo left, main menu center, auth/CTA buttons right
- Search bar prominent center position with autocomplete dropdown
- Category mega-menu on hover (visual grid of categories with icons)
- Mobile: Hamburger menu with slide-in drawer

**Footer**:
- 4-column layout: Categories, Services, Legal, Contact
- Newsletter signup with inline form
- Social icons with hover lift effect
- Copyright and trust badges (SSL, payment partners)

### Listing Cards
**Standard Card** (used throughout listings, favorites):
- Image: 4:3 aspect ratio with rounded corners
- Image overlay badges: "Premium", "Canlı Yayın", "Açık Artırma", "Acil"
- Title: bold, 2-line truncation
- Price: large, accent font
- Location + time posted: subtle gray text
- Seller info: small avatar + name + verification badge
- Hover: subtle lift shadow, scale 1.02

**Featured Card** (homepage spotlight):
- Larger image (16:9)
- More padding
- Stronger shadow
- Badge cluster top-right

### Live Streaming Components
**Live Stream Card**:
- 16:9 video thumbnail with red "LIVE" pill badge
- Viewer count with eye icon
- Streamer avatar overlay bottom-left
- Stream title + category tag
- Linked listing preview (if applicable)

**Live Room Interface**:
- Video player: 70% width, 16:9 aspect ratio
- Right sidebar (30%): Live chat with message list, input at bottom
- Below video: Stream info, linked listing card, streamer profile
- Auction controls (if active): sticky bottom bar with current price, bid input, countdown

### Auction Components
**Auction Timer**: Large countdown display with urgency colors (green > yellow > red as time decreases)
**Bid History Panel**: Scrollable list with user avatars, amounts, timestamps
**Bid Input**: Large number input + "Teklif Ver" button (disabled if below minimum)

### Forms
**Multi-Step Listing Form**:
- Progress stepper at top (5 steps with icons)
- Right sidebar: Live preview card showing how listing will appear
- Form sections with clear headings and helper text
- Image upload: Drag-drop zone + grid preview with reorder functionality
- Location: Dropdown selects (İl, İlçe) + optional map picker

**Search/Filter Panel**:
- Collapsible sections for each filter group
- Range sliders for price, age
- Checkboxes with counts (e.g., "Aşılı (234)")
- "Filtreleri Temizle" link
- Sticky on scroll for desktop

### Dashboards
**Dashboard Layout**:
- Left sidebar: Navigation menu with icons + labels
- Main content: Cards for stats, tables for listings/orders
- Stat cards: 2x2 or 3-column grid with icons, large numbers, trend indicators

**Data Tables**:
- Zebra striping
- Sortable columns (arrows)
- Action buttons/dropdowns right column
- Pagination bottom-center

### Blog Components
**Blog Card**:
- Featured image (16:9)
- Category tag
- Title (2-line max)
- Excerpt (3-line max)
- Author avatar + name + read time
- Hover: image subtle zoom

**Article Page**:
- Wide hero image (21:9)
- Centered content with max-w-3xl
- Sidebar: Author bio, related posts, categories
- Rich typography with proper heading hierarchy

## Interactions & States

**Buttons**:
- Primary: Solid fills with rounded corners (rounded-lg)
- Secondary: Outlined with hover fill
- Destructive: Red for delete/reject actions
- Ghost: Text only with hover background
- Sizes: xs, sm, base, lg, xl
- Icons: Leading or trailing with proper spacing

**Links**: Underline on hover, color shift

**Hover States**: Subtle scale (1.02), shadow elevation, color brightening

**Loading States**: Skeleton screens for cards, spinners for buttons/forms

**Empty States**: Illustrations + encouraging text + CTA

**Animations**: Use sparingly
- Card hover: transform 200ms ease
- Menu transitions: 150ms ease-out
- Modal/drawer entry: slide + fade 300ms
- NO scroll animations, parallax, or continuous motion

## Images

**Hero Section** (Homepage):
- Full-width background image: Happy animals in natural settings (family with pets, farm animals)
- Overlay gradient: dark overlay for text readability
- Centered search bar + category quick links overlaid

**Category Pages**: Each category has a representative banner image (e.g., dogs for "Köpekler", fish tank for "Akvaryum")

**Listing Photos**: User-uploaded, require at least 3 images, first is cover

**Blog Featured Images**: Editorial photos related to article topics

**Placeholder Images**: Use service like Unsplash API for animal photos in demos

## Turkish UI Patterns

- Use Turkish date formats (DD.MM.YYYY)
- Currency: "₺" symbol for Turkish Lira
- Phone masks: (0XXX) XXX XX XX
- Address fields: İl (Province) > İlçe (District) hierarchy
- Formal tone for official communications, friendly for marketing copy
- Trust indicators prominently displayed (verified seller badges, secure payment icons)

## Accessibility

- Form labels always visible (not placeholder-only)
- Sufficient color contrast (WCAG AA minimum)
- Focus indicators on all interactive elements
- Alt text for all animal images
- Keyboard navigation for all features
- ARIA labels for icon-only buttons