# Project Architecture: Hopla

## Overview

Hopla is a peer-to-peer community delivery application based in **Strasbourg, France**. It connects people who need groceries ("Courses") or parcels delivered ("Colis") with nearby delivery drivers ("Livreurs"). Users create an order, choose a payment method (Stripe card or cash on delivery), and track their delivery in real time on an interactive map.

The app targets a mobile-first audience and features a premium iOS/VisionOS-inspired glassmorphism design.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Vanilla CSS + CSS Variables | — |
| **Database** | Firebase Firestore | firebase 12.9.0 |
| **Payments** | Stripe | stripe 20.3.1, @stripe/react-stripe-js 5.6.0 |
| **Maps** | Leaflet + react-leaflet | leaflet 1.9.4, react-leaflet 5.0.0 |
| **Geocoding** | Nominatim (OpenStreetMap) | — |
| **Email** | Resend API | — |
| **Icons** | Lucide React | 0.564.0 |
| **Deployment** | Vercel | — |
| **Linter** | ESLint | 9.x |

---

## Directory Tree

```
hopla/
├── app/                          # Main application source (Next.js App Router)
│   ├── layout.tsx                # Root layout — HTML shell, global CSS, SupportChat
│   ├── page.tsx                  # Landing page — COMMANDER button + background map
│   ├── globals.css               # Design system — CSS variables, glassmorphism classes
│   ├── global-error.tsx          # Global error boundary (client-side)
│   │
│   ├── api/                      # Backend — Next.js API Routes
│   │   ├── checkout/route.ts     # POST — Create Stripe PaymentIntent
│   │   ├── jobs/route.ts         # GET / POST / PUT / DELETE — CRUD for jobs
│   │   ├── geocode/route.ts      # GET — Proxy to Nominatim for address search
│   │   └── send-email/route.ts   # POST — Send order confirmation email via Resend
│   │
│   ├── components/               # Shared UI components
│   │   ├── DeliveryRating.tsx    # Star rating + tags after delivery (Firestore)
│   │   ├── JobChat.tsx           # Real-time chat with quick actions (Firestore)
│   │   ├── ProofOfDelivery.tsx   # Camera capture + Firebase Storage upload
│   │   ├── StripePayment.tsx     # Stripe Elements payment form
│   │   ├── SupportChat.tsx       # Floating support chat widget (Firestore)
│   │   ├── TabBar.tsx            # Bottom navigation bar (Home / Explorer / Profil)
│   │   └── TrackingMap.tsx       # Leaflet map with driver/client markers
│   │
│   ├── lib/                      # Shared logic & services
│   │   ├── firebase.ts           # Firebase App init — exports `db` and `storage`
│   │   ├── firebaseService.ts    # Firestore CRUD — createJob, getJobs, updateJob, getJob
│   │   └── db.ts                 # Static pricing engine — ~200 item prices (Lidl/Auchan/Pharmacy)
│   │
│   ├── create-list/              # Order creation flow (multi-step wizard)
│   │   ├── page.tsx              # Main page — item selection, address, payment
│   │   └── error.tsx             # Route-level error boundary
│   │
│   ├── jobs/                     # Driver-facing job marketplace
│   │   └── page.tsx              # List of open jobs, accept/decline
│   │
│   ├── tracking/[id]/            # Order tracking (dynamic route)
│   │   ├── page.tsx              # Real-time order status + map + chat
│   │   └── error.tsx             # Route-level error boundary
│   │
│   ├── admin/support/            # Admin support dashboard
│   │   └── page.tsx              # View & respond to support chats
│   │
│   └── profile/                  # User profile (empty — placeholder)
│
├── public/                       # Static assets (SVGs: file, globe, next, vercel, window)
├── src/                          # ⚠️ LEGACY/UNUSED — scaffolded Next.js init artifact; ignore
├── db.json                       # Legacy mock data (not used in production; Firestore is primary)
├── firebase.json                 # Firebase project config
├── firestore.rules               # Firestore security rules (currently: allow all read/write)
├── next.config.ts                # Next.js config
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── eslint.config.mjs             # ESLint config
├── .env.local                    # Local environment variables (gitignored)
├── DEPLOYMENT_GUIDE.md           # Vercel deployment instructions
└── run.command                   # macOS double-click launch script
```

---

## Core Application Flow

### 1. Client Orders Something

```
Landing Page (/) → "COMMANDER" → /create-list (multi-step wizard)
  Step 1: Choose type (Courses or Colis)
  Step 2: Add items (with auto-price estimation from db.ts)
  Step 3: Set delivery address (geocoded via /api/geocode → Nominatim)
  Step 4: Choose payment method
    → "Carte Web": StripePayment component → /api/checkout → Stripe PaymentIntent
    → "Espèces":   handlePost() → /api/jobs (POST) → Firestore → redirect to /tracking/{id}
```

### 2. Driver Accepts a Job

```
/jobs → fetches GET /api/jobs → lists open jobs from Firestore
  Driver clicks "Accepter" → PUT /api/jobs { id, status: 'taken' }
  Anti-collision: server rejects if job.status !== 'open' (409 Conflict)
```

### 3. Order Tracking

```
/tracking/[id] → fetches GET /api/jobs?id={id}
  Displays real-time status (open → taken → delivering → delivered)
  Shows Leaflet map with driver position (simulated random movement)
  Includes JobChat for client ↔ driver messaging (Firestore real-time)
```

---

## API Routes

### `POST /api/checkout`
Creates a Stripe PaymentIntent with manual capture. Returns `clientSecret` for the frontend Stripe Elements form.
- **Input**: `{ amount: number, jobId: string }`
- **Output**: `{ clientSecret: string }`
- **Env**: `STRIPE_SECRET_KEY`

### `GET /api/jobs`
Returns all jobs ordered by timestamp (desc), or a single job if `?id=` is provided.

### `POST /api/jobs`
Creates a new job in Firestore. Payload includes items, location, coordinates, payment method, fees, etc.
- **Validation**: Requires `items` or `pickupLocation`.

### `PUT /api/jobs`
Updates a job. Includes anti-collision logic: rejects `status: 'taken'` if job is no longer `'open'`. Blocks address changes once a driver is assigned.

### `DELETE /api/jobs`
Cancels all jobs by setting their status to `'cancelled'`.

### `GET /api/geocode`
Server-side proxy to Nominatim OpenStreetMap API. Appends ", Strasbourg" to queries. Avoids CORS issues from client-side requests.
- **Input**: `?q=search+term`

### `POST /api/send-email`
Sends order confirmation email via the Resend API with a tracking link.
- **Env**: `RESEND_API_KEY`, `NEXT_PUBLIC_BASE_URL`

---

## Components

| Component | Description |
|---|---|
| `DeliveryRating.tsx` | Star rating (1–5) + tag selection + optional comment. Saves to Firestore `ratings` collection. Shown in the delivery-complete modal on the tracking page before the tip step. |
| `ProofOfDelivery.tsx` | Real camera capture (`<input type="file" capture>`) with preview. Uploads photo to Firebase Storage (`delivery-proofs/`), stores URL on the job document. Replaces the old simulated proof. |
| `StripePayment.tsx` | Wraps Stripe Elements. Fetches `clientSecret` from `/api/checkout`, renders `PaymentElement`, handles `confirmPayment`. Shows specific error UI if publishable key is missing. |
| `TrackingMap.tsx` | Leaflet map centered on Strasbourg. Shows client destination (green marker) and driver position (blue marker with simulated movement). Dynamically imported with `ssr: false`. |
| `JobChat.tsx` | Real-time chat between client and driver. Uses Firestore `onSnapshot` on `job_chats` collection. Includes **quick action buttons** contextual to role (client: "Merci !", "Je suis en bas", etc. / driver: "Je suis en route", "Je suis arrivé", etc.). |
| `SupportChat.tsx` | Floating support chat bubble (bottom-right, or top-right on tracking pages). Uses Firestore real-time sync. Generates a persistent anonymous `userId` via localStorage. |
| `TabBar.tsx` | Bottom navigation pill with 3 tabs: Home (ShoppingBag), Explorer (Search), Profil (User). Highlights active route. Glassmorphism style. |

---

## Shared Libraries (`app/lib/`)

### `firebase.ts`
Initializes the Firebase app using `NEXT_PUBLIC_FIREBASE_*` environment variables. Exports:
- `db` — Firestore instance
- `storage` — Firebase Storage instance

### `firebaseService.ts`
Firestore data layer with 4 functions:
- `createJob(jobData)` — Adds document to `jobs` collection, sets `timestamp` and default `status: 'open'`.
- `getJobs()` — Returns all jobs ordered by `timestamp` desc.
- `getJob(id)` — Returns a single job by document ID.
- `updateJob(id, updates)` — Updates fields on a job document.

### `db.ts`
Static `PRICE_DB` object mapping ~200 product names to prices in EUR. Covers categories: fresh products, dry goods, sweets, fruits & vegetables, drinks, hygiene, and pharmacy items. Used by `create-list/page.tsx` for real-time cost estimation as items are added.

---

## Environment Variables

### Required (server-side)

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `RESEND_API_KEY` | Resend email API key |

### Required (client-side, `NEXT_PUBLIC_` prefix)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Optional

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `NEXT_PUBLIC_BASE_URL` | Base URL for email tracking links |

### Where to set them
- **Local**: `.env.local` (gitignored)
- **Production**: Vercel Dashboard → Project Settings → Environment Variables

---

## Styling & Design System

The app uses a **glassmorphism** aesthetic inspired by iOS/VisionOS:

- **CSS Variables** in `globals.css`: colors, gradients, blur values, border radii
- **Key patterns**: `backdrop-filter: blur()`, translucent white backgrounds, rounded corners (16–40px), subtle shadows
- **Color palette**: Blue gradient (`#00C6FF → #0072FF`), green for success (`#34C759`), Apple gray (`#f5f5f7`, `#86868b`, `#1d1d1f`)
- **Dark mode**: Supported via `@media (prefers-color-scheme: dark)` overrides
- **Inline styles**: Most components use React inline `style` objects rather than CSS classes
- **Map tiles**: CARTO Voyager (light, modern look)

---

## Firestore Data Model

### Collection: `jobs`
| Field | Type | Description |
|---|---|---|
| `type` | string | `'courses'` or `'colis'` |
| `items` | array | List of items with name, quantity, price |
| `location` | string | Delivery address text |
| `locationCoords` | object | `{ lat, lng }` |
| `pickupLocation` | string | Pickup address (colis only) |
| `pickupCoords` | object | `{ lat, lng }` (colis only) |
| `reward` | number | Total reward for the driver |
| `deliveryFee` | number | Delivery fee |
| `tip` | number | Tip amount |
| `totalAmount` | number | Final total |
| `paymentMethod` | string | `'card'` or `'cash'` |
| `isPaid` | boolean | `true` if card payment completed |
| `status` | string | `'open'` → `'taken'` → `'delivering'` → `'delivered'` / `'cancelled'` |
| `timestamp` | number | `Date.now()` at creation |
| `user` | string | Client identifier |

### Collection: `messages` (used by JobChat & SupportChat)
| Field | Type | Description |
|---|---|---|
| `jobId` or `userId` | string | Links message to a job or support session |
| `text` | string | Message content |
| `sender` | string | `'client'`, `'driver'`, or `'support'` |
| `createdAt` | timestamp | Firestore server timestamp |

### Collection: `ratings`
| Field | Type | Description |
|---|---|---|
| `jobId` | string | Links rating to a job |
| `raterRole` | string | `'client'` or `'driver'` |
| `rating` | number | 1–5 star rating |
| `tags` | array | Selected tags (e.g. "Rapide", "Poli", "Soigneux") |
| `comment` | string or null | Optional free-text comment |
| `createdAt` | timestamp | Firestore server timestamp |

### Security Rules
Currently **open** (`allow read, write: if true`). Should be tightened before production.

---

## Deployment

- **Platform**: Vercel
- **URL**: `https://hopla-one.vercel.app/`
- **Build**: `npm run build` (Next.js production build)
- **Auto-deploy**: Push to GitHub triggers Vercel build
- **Environment variables**: Must be set in Vercel Dashboard (not committed to git)
- See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server (Turbopack) on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server locally |
| `npm run lint` | Run ESLint |
| `./run.command` | macOS shortcut to launch the dev server |

---

## Recent Features (Phase 1)

- **Rating system**: After delivery, clients rate drivers (1–5 stars + tags like "Rapide", "Poli"). Stored in Firestore `ratings` collection.
- **Proof of delivery**: Drivers take a real photo via camera, uploaded to Firebase Storage. Displayed on the client's tracking page.
- **Quick chat actions**: Predefined messages in JobChat (e.g. "Je suis en route", "Merci !") for faster communication.
- **Driver job filters**: Filter by type (courses/colis), payment method (card/cash), sort by recency/reward/distance.
- **Geolocation + distance**: Driver's browser location used to show distance to each job and enable distance sorting.
- **Navigation deep link**: "Navigate" button on active jobs opens Google Maps (Android) or Apple Maps (iOS) with directions.
- **Pricing breakdown**: Tracking page shows itemized cost: basket estimate, delivery fee, tip, total.

---

## Known Caveats

1. **`src/` directory**: Legacy artifact from initial `create-next-app`. Not used. Safe to delete.
2. **`db.json`**: Contains mock job data from early development. Not used in production (Firestore is the source of truth).
3. **Firestore rules**: Currently fully open. Must be secured before real production use.
4. **Driver position**: Simulated with random offsets in `TrackingMap.tsx`. No real GPS tracking yet.
5. **Authentication**: No auth system. Users are identified by random client IDs. Profile page is empty.
6. **Stripe API version**: Pinned to `"2023-10-16"` in `api/checkout/route.ts` to avoid SDK/API version mismatches.


## Future V2 Architecture Additions (In Progress)
1. **Smart Address Autocomplete**: Uses /api/geocode to suggest accurate addresses.
2. **Express Checkout**: Apple Pay / Google Pay directly within StripePayment.
3. **Live Socket Tracking**: Instant update mechanics on /tracking pages.

