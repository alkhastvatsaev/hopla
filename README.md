# Hopla

Hopla is a mobile-first marketplace prototype for neighborhood grocery and parcel delivery in Strasbourg. A customer composes a request, chooses an address and payment method, and follows the mission while an authenticated driver can claim and complete it.

**Live demo:** [hopla-one.vercel.app](https://hopla-one.vercel.app)

The product UI is in French because it targets Strasbourg; the engineering documentation is in English.

![Hopla customer home screen on desktop](docs/screenshots/home-desktop.png)

<details>
<summary>Mobile view</summary>

![Hopla customer home screen on mobile](docs/screenshots/home-mobile.png)

</details>

## Case study

### Problem

Small local errands are often too irregular for traditional delivery catalogs. Hopla explores a two-sided flow where the customer describes what is needed and a nearby independent driver accepts the mission.

### Implemented experience

- Grocery-list and direct-parcel request flows
- Local price catalog, fee estimate, tips, cash and Stripe test checkout
- Address search, browser geolocation, OpenStreetMap/Leaflet maps and navigation links
- Firebase email/password authentication and driver onboarding
- Driver mission list, filters, map view, atomic mission claiming and status progression
- Tracking, in-mission chat, proof-of-delivery upload, ratings and support chat
- Installable PWA metadata

Some UI elements use estimates or simulations: catalog prices are static, trip distance is generated client-side, receipt scanning is mocked, and earnings are presentation-only. This is a portfolio prototype, not an operating delivery service.

## Architecture

Hopla uses the Next.js 16 App Router and TypeScript.

- `app/` contains pages, components and route handlers.
- Firebase Authentication identifies drivers.
- Cloud Firestore stores jobs, profiles, chat messages, ratings and support threads.
- Firebase Storage stores onboarding and delivery images.
- `/api/checkout` calculates a server-owned quote and creates a Stripe PaymentIntent.
- `/api/jobs` verifies successful card PaymentIntents before creating paid jobs. Authenticated driver updates carry a Firebase ID token; job claiming uses a Firestore transaction.
- Nominatim supplies Strasbourg-focused geocoding; Leaflet renders maps.

Firebase web configuration is intentionally public. Authorization belongs in deployed Firestore and Storage Security Rules, not in API-key secrecy. Stripe secret keys remain server-only.

## Security and product boundaries

The repository now prevents browser-selected Stripe amounts, rejects live Stripe keys unless explicitly enabled, verifies card payments before persisting paid jobs, authenticates driver state changes, removes the unauthenticated bulk-delete and email-relay endpoints, and avoids returning provider error details.

Important limitations remain:

- Stripe webhooks, durable idempotency and refund/dispute workflows are not implemented. Keep `STRIPE_LIVE_PAYMENTS_ENABLED=false`.
- Firebase Security Rules are managed outside this repository and must be reviewed before using real customer data. Several realtime features intentionally use the Firebase client SDK.
- Driver identity is verified, but roles, admin authorization and marketplace compliance/KYC are not production-ready.
- Addresses, chat and uploaded images are personal data; retention, moderation and deletion controls are not implemented.
- Rate limiting and abuse protection should be added at the edge and Firebase Rules layers.

## Local setup

Requirements: Node.js 22 and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). Create a Firebase web app with Authentication, Firestore and Storage enabled, then fill in the `NEXT_PUBLIC_FIREBASE_*` values. Use Stripe **test** keys only. No real credentials belong in the repository.

## Environment variables

See [`.env.example`](.env.example) for the complete safe template:

- `NEXT_PUBLIC_FIREBASE_*`: Firebase web app identifiers
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable test key
- `STRIPE_SECRET_KEY`: server-only Stripe test secret
- `STRIPE_LIVE_PAYMENTS_ENABLED`: explicit live-payment safety gate; leave `false`
- `NEXT_PUBLIC_BASE_URL`: local or deployed application URL

## Quality

```bash
npm run lint
npm run typecheck
npm test
npm run build
# or run all checks
npm run check
```

Vitest covers server-side quote rules and abuse limits. GitHub Actions runs lint, type checking, tests and a production build on pushes and pull requests. Dependabot monitors npm and GitHub Actions dependencies.

## Roadmap

1. Version Firestore/Storage Rules and test them with the Firebase emulator.
2. Move all job mutations behind Firebase Admin and role-based server authorization.
3. Add Stripe webhooks, idempotent order finalization and refunds.
4. Replace simulated distance and receipt scanning with routed distance and validated receipts.
5. Add end-to-end tests, accessibility checks, observability and data-retention controls.

## Author

Built by [Alkhast Vatsaev](https://alkhastvatsaev.dev) — junior Full Stack JavaScript/TypeScript developer ([portfolio](https://alkhastvatsaev.dev), [FR](https://alkhastvatsaev.dev/fr/developpeur-full-stack)).
