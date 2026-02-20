# Hopla — Improvements / Upgrade Pack

This document preserves all UX/product improvements discussed and (for some) already implemented in the working tree, so you can safely roll back to a known-good commit and re-apply changes later.

## How to use after `git checkout <good_commit>`

- This repo can be restored by re-implementing improvements in phases.
- Re-apply Phase 1 first (low risk, high value), then Phase 2.

---

## Phase 1 (High ROI, Low Risk)

### 1) Structured chat “Quick Actions”
- **Goal**: Reduce friction and support load by providing one-tap messages.
- **Where**:
  - `app/components/JobChat.tsx`
- **What**:
  - Add quick action buttons above input.
  - Different sets for `role="client"` and `role="driver"`.

### 2) Proof of Delivery (real photo)
- **Goal**: Increase trust + reduce disputes.
- **Where**:
  - New component: `app/components/ProofOfDelivery.tsx`
  - Used from: `app/jobs/page.tsx` (driver flow)
  - Display on: `app/tracking/[id]/page.tsx` (client sees the photo)
- **Data**:
  - Upload to Firebase Storage path like `delivery-proofs/<jobId>_<timestamp>.jpg`
  - Store URL on job document: `deliveryProofUrl`

### 3) Delivery Rating (stars + tags)
- **Goal**: Build quality loop + driver retention.
- **Where**:
  - New component: `app/components/DeliveryRating.tsx`
  - Integrated into: `app/tracking/[id]/page.tsx`
- **Data**:
  - New Firestore collection: `ratings`
  - Fields:
    - `jobId`, `raterRole`, `rating`, `tags`, `comment`, `createdAt`

### 4) Pricing breakdown (transparent fees)
- **Goal**: Improve trust and reduce “surprise” costs.
- **Where**:
  - `app/tracking/[id]/page.tsx`
- **What**:
  - Display:
    - basket estimate
    - delivery fee
    - tip
    - total

### 5) Driver job filters + distance + navigation deep link
- **Goal**: Improve driver UX: faster decisions and job selection.
- **Where**:
  - `app/jobs/page.tsx`
- **What**:
  - Filters:
    - type: `courses` / `colis`
    - payment: `card` / `cash`
    - sort: `recent` / `reward` / `distance` (requires geolocation)
  - Geolocation distance badge per job.
  - “Navigation” button -> opens Apple Maps on iOS, Google Maps on Android/Desktop.

### 6) Optional: “Map view” for available jobs
- **Goal**: Driver sees jobs visually.
- **Where**:
  - New component: `app/components/DriverMap.tsx`
  - Used from: `app/jobs/page.tsx` as a `dynamic()` import with `ssr:false`.

---

## Phase 2 (Bigger impact, More work)

### 2.1) Firebase Auth (MVP)
- **Goal**: Security + identity.
- **Where**:
  - `app/lib/firebase.ts`: export `auth = getAuth(app)`
  - New provider: `app/components/AuthProvider.tsx`
  - New route: `app/auth/page.tsx`
  - Guards: `app/components/RouteGuards.tsx`
  - Wrap in layout: `app/layout.tsx` (wrap children in `AuthProvider`)
- **Guards**:
  - `/jobs` requires login.
  - `/admin/support` requires login + allowlist env var: `NEXT_PUBLIC_ADMIN_EMAILS`.

### 2.2) Driver onboarding + job assignment ownership
- **Goal**: Real driver identity, show only “my jobs”.
- **Where**:
  - New component: `app/components/DriverOnboarding.tsx`
  - Update `app/jobs/page.tsx`:
    - Load profile from Firestore `users/{uid}`
    - Prompt onboarding if missing `displayName`
    - On accept job: write `driverId`, `driverName`, `driverPhotoUrl`
    - Filter “active jobs” by `driverId === currentUser.uid`
- **Data**:
  - New Firestore collection/doc path: `users/{uid}`
  - Fields: `role: 'driver'`, `displayName`, `photoURL`, timestamps

### 2.3) Notifications
- **MVP**: email on status changes (accepted, delivering, completed)
- **Later**: push notifications (web push / native)

### 2.4) Real driver GPS tracking (replace simulation)
- **Goal**: Real-time map tracking.
- **What**:
  - Driver periodically updates location to Firestore (`jobs/{id}.driverCoords` or `driver_locations/{driverId}`)
  - Client subscribes (onSnapshot) to show live marker.

---

## Environment variables (reference)

### Required client-side
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Required server-side
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`

### Optional / feature flags
- `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated)
- `NEXT_PUBLIC_BASE_URL`

---

## Notes

- If you roll back to a commit where local dev worked, keep it as the “base”.
- Re-apply improvements one by one and test after each phase.
- If you see dev logs spamming, it’s often repeated compilation or repeated failing requests (e.g. missing files referenced by metadata).
