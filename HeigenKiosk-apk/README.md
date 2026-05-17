# Heigen Studio Kiosk APK — React Native App

Expo (React Native) kiosk booking app aligned with **HeigenKiosk**: same screens and **Django REST API** (`src/constants/api.js` + `src/api/client.js`), packaged as an Android APK.

---

## 📁 Project Structure

```
HeigenKiosk-apk/
├── app/
│   ├── index.js              ← Kiosk booking flow (customer-facing)
│   └── admin.js              ← Staff booking queue (admin-facing)
├── src/
│   ├── api/
│   │   └── client.js         ← Django REST client (same contract as HeigenKiosk)
│   ├── constants/
│   │   ├── api.js            ← Base URL + endpoint constants
│   │   └── theme.js          ← Design tokens (colors, spacing, typography)
│   ├── components/
│   │   └── ui.js             ← Shared primitive components
│   ├── hooks/
│   │   └── useApi.js         ← Data fetching hooks
│   └── screens/
│       ├── KioskApp.js         ← Root orchestrator (step wizard)
│       ├── CategoryScreen.js   ← Step 1: choose category
│       ├── PackageScreen.js    ← Step 2: choose package (+ popular from data)
│       ├── AddonsScreen.js     ← Step 3: add-ons (+ popular from bookings)
│       ├── CustomerFormModal.js  ← Customer info collection
│       ├── BookingSummaryModal.js ← Review before submit
│       ├── ConfirmationScreen.js  ← Success state (auto-resets in 4s)
│       └── AdminBookingQueue.js   ← Staff queue: Pending → Ongoing → Done
├── shared_package_data.js    ← Admin web helpers (Django REST, same as HeigenKiosk)
├── package-api.js            ← Updated admin category page (with Refresh AI btn)
├── app.json
├── babel.config.js
└── package.json
```

---

## 🚀 Setup

### 0. Verify requirements

- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+
- Expo via `npx expo ...` (no global install required)
- Django **Snaplytics** backend running and reachable from the device/emulator (same API as **HeigenKiosk**)

Quick version check:

```bash
node -v
npm -v
```

### 1. Install dependencies

```bash
cd HeigenKiosk-apk
npm install
```

### 2. Configure API base URL

Same env vars as **HeigenKiosk** (`src/constants/api.js`):

- Optional **`HeigenKiosk-apk/.env`** (gitignored) with either:
  - **`EXPO_PUBLIC_API_BASE_URL`** — full base including path, e.g. `http://192.168.1.50:8000/api`, or
  - **`EXPO_PUBLIC_API_HOST`** — host only; port defaults to `8000` and path to `/api`.

**Physical phone APK:** you must set **`EXPO_PUBLIC_API_BASE_URL`** (or host) to a URL the **phone can reach** (LAN IP or HTTPS of your deployed Django), **not** `localhost` / `10.0.2.2`.

### 3. Start the app

```bash
cd HeigenKiosk-apk
npx expo start
```

---

## 📱 Booking Flow (Customer Kiosk)

```
Category → Package → Add-ons → [Customer Form Modal] → [Summary Modal] → Confirmation
```

1. **Category Screen** — Fetches categories dynamically from `GET /api/packages/` (derived by unique `category` field)
2. **Package Screen** — Fetches packages for the selected category. The **most-booked** package (computed from booking counts) is highlighted as "Most Booked Package"
3. **Add-ons Screen** — Fetches add-ons. **Most-selected** add-ons (computed from `BookingAddon` records) float to the top as "Frequently Added"
4. **Customer Form** — Collects name, email, phone, optional preferred date, and consent
5. **Summary** — Review with total price breakdown
6. **Confirm** → Creates/finds customer via `POST /api/customers/`, then creates booking via `POST /api/customers/{id}/bookings/` with `session_status: "Pending"`
7. **Confirmation** — Auto-resets to home after 4 seconds

---

## 👥 Admin Booking Queue

Located at `app/admin.js`. Staff can:

| Action | Result |
|--------|--------|
| Tap a Pending booking → "Accept" | `PATCH /api/bookings/{id}/status/` → `"Ongoing"` |
| Tap an Ongoing booking → "Mark Done" | `PATCH /api/bookings/{id}/status/` → `"BOOKED"` |
| Tap any → "Cancel" | `PATCH /api/bookings/{id}/status/` → `"Cancelled"` |
| **Refresh AI** button | Re-queries the recommender; popular choices update from latest booking data |

Pull-to-refresh updates the queue in real time.

---

## 🤖 Recommender Integration

### How popularity is computed

The app **doesn't cache** popularity — it computes it **live from bookings** every time a screen loads:

- **Popular package**: counts `Booking` rows per package within the selected category → top by count
- **Popular add-ons**: counts `BookingAddon.addon_quantity` grouped by `addon_id` → top 3

This means **as soon as a booking is completed, the next customer sees updated recommendations automatically** — no manual refresh needed for the kiosk.

### Admin "Refresh AI" button

The button in the admin queue header (`package-api.js`) calls `refreshRecommender()` in `shared_package_data.js`, which uses the Django API (same behavior as **HeigenKiosk**). If you later add a dedicated refresh endpoint, wire it in there:

```python
# endpoints/urls.py
path('recommendations/refresh/', refresh_recommender_cache, name='refresh-recommender'),
```

Update `refreshRecommender()` in `shared_package_data.js` to hit that instead.

---

## 🔌 Backend (Django REST)

The kiosk uses the same **Django REST** endpoints as **HeigenKiosk** (`/packages/`, `/addons/`, `/customers/`, `/bookings/`, `/recommendations/`, etc.). Run `python manage.py runserver` (or your deployment) and point the app at that base URL.

---

## 🧪 JDBC pooler POC (optional)

`app/pooler-poc` + native Android module remain for experiments; the main kiosk flow does **not** use them.

## 🎨 Design System

The app mirrors the web kiosk's visual design:

- **Accent color**: `#d97706` (amber)
- **Popular items**: gradient border cards with ★ headers
- **Sticky bottom panel**: package + addons + total on add-ons screen
- **Step indicator**: amber circles matching web version
- **Modals**: slide-up bottom sheets with drag handle

---

## 📦 Requirements

### Runtime requirements

- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+
- Expo CLI via `npx expo ...`
- Django API reachable from the machine that runs Expo or builds the APK (`EXPO_PUBLIC_API_*` in `.env` when needed)

### Project dependencies

Dependencies are defined in `package.json`. Key packages:

- `expo` `~51.0.0`
- `expo-router` `~3.5.23`
- `react-native` `0.74.5`
- `react` / `react-dom` `18.2.0`
- `@react-native-async-storage/async-storage` `1.23.1`
- `@react-native-community/datetimepicker` `8.0.1`
- `react-native-safe-area-context` `4.10.5`
- `react-native-screens` `3.31.1`

Install with:

```bash
npm install
```

---

## 🗂 Admin Web App Updates

The `shared_package_data.js` file now shares the same standalone backend helpers as the APK. It exports:

- `getCategories()` — derived from packages
- `getPackagesByCategory(name)` — filtered packages
- `getAddonsByCategory(name)` — filtered add-ons
- `getCustomers()` / `getCustomer(id)`
- `getBookings()` / `getCustomerBookings(customerId)`
- `updateBookingStatus(bookingId, status)`
- `refreshRecommender()` — refreshes live popularity data

The `package-api.js` admin page now includes a **"✦ Refresh AI Recommendations"** button — add this to your admin HTML:

```html
<button id="refreshRecommenderBtn" onclick="refreshRecommenderData()">
  ✦ Refresh AI Recommendations
</button>
```
