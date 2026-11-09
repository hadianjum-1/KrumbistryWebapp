# KRUMBISTRY Bake Shop — Luxury in Every Bite

A production-ready, full-stack bakery e-commerce and order-management platform built for **KRUMBISTRY Bake Shop**. Featuring an artisanal luxury storefront, real-time cart and order processing, bespoke celebration cake consultations, and a full-featured admin management dashboard.

---

## 1. Architectural Highlights

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **Backend:** Next.js Route Handlers, Zod validation, HMAC-SHA256 session tokens in HTTP-only cookies, bcryptjs password hashing.
- **Database & ORM:** Neon Serverless PostgreSQL with Prisma ORM (`@prisma/client` 6.19.3) supporting 11 normalized domain models.
- **Media Management:** Cloudinary SDK with signed server-side uploads, drag-and-drop uploader, and auto-optimization.
- **Transactional Email:** Nodemailer transporter with luxury branded HTML templates for customer invoices, consultation confirmations, and admin operational alerts.
- **SEO & Metadata:** Dynamic XML Sitemap (`/sitemap.xml`), robots exclusion (`/robots.txt`), OpenGraph meta, and semantic structured data.

---

## 2. Directory Structure

```text
├── prisma/
│   ├── schema.prisma            # 11 Models (Admin, Product, Category, Order, etc.)
│   └── seed.ts                  # Database seeding script
├── src/
│   ├── app/
│   │   ├── (public)/            # Storefront routes (/, /about, /menu, /custom-orders, /contact)
│   │   ├── admin/               # Admin Portal UI (/admin, /admin/products, /admin/orders, etc.)
│   │   ├── api/                 # Public & Admin REST endpoints
│   │   ├── sitemap.ts           # Dynamic XML sitemap generator
│   │   └── robots.ts            # Search engine crawler policies
│   ├── components/
│   │   ├── admin/               # Admin UI Shell, ProductForm, ImageUpload
│   │   ├── cart/                # Slide-out interactive Cart Drawer & Checkout
│   │   ├── layout/              # Storefront Header, Footer
│   │   └── ui/                  # Reusable luxury components
│   ├── context/                 # CartContext state with local storage persistence
│   ├── lib/                     # Auth engine, DB singleton, Cloudinary, Email, WhatsApp
│   ├── services/                # Decoupled business logic & DB fallback layers
│   └── types/                   # Strict TypeScript domain interfaces
```

---

## 3. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Admin Authentication
AUTH_SECRET="your-super-secret-hex-token-min-32-chars-long"

# Cloudinary Image Management
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Transactional Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="orders@krumbistry.com"
SMTP_PASS="your-app-password"
SMTP_FROM="KRUMBISTRY Bake Shop <orders@krumbistry.com>"
ADMIN_NOTIFICATION_EMAIL="admin@krumbistry.com"

# Public Application URL
NEXT_PUBLIC_APP_URL="https://krumbistry.com"
```

---

## 4. Local Development Quickstart

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Initialize Database (Once Neon credentials are added):**
   ```bash
   # Push database schema
   npx prisma db push

   # Seed default administrator, categories, signature catalog & settings
   npx prisma db seed
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the storefront.

---

## 5. Administration Portal

- **URL:** `http://localhost:3000/admin/login`
- **Default Seed Credentials:**
  - **Email:** `admin@krumbistry.com`
  - **Password:** `KrumbistryAdmin2026!`

### Admin Modules:
- **Operations Dashboard:** Live KPI revenue cards, queue counts, and recent order stream.
- **Catalog Management:** Create, edit, toggle availability, manage prices, and upload photography.
- **Categories:** Add and manage categories, sort order, and active menu visibility.
- **Order Fulfillment:** Inspect order items, change status (`PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `COMPLETED`), update payment, print receipts, and direct WhatsApp customer links.
- **Bespoke Cake Requests:** Review customer design briefs, inspect uploaded moodboard reference photos, input custom price quotes, and send instant WhatsApp quotes.
- **Customer Inquiries:** Centralized inbox for contact requests with one-click reply buttons.
- **Store Settings:** Live editor for business hours, delivery fees, free delivery thresholds, and announcement banner messages.

---

## 6. API Reference

### Public Storefront Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve catalog items with category/featured filters |
| `GET` | `/api/products/:slug` | Retrieve single product details by URL slug |
| `GET` | `/api/categories` | Retrieve all active bakery collections |
| `POST` | `/api/orders` | Place customer order & send confirmation emails |
| `POST` | `/api/custom-orders` | Submit bespoke celebration cake request |
| `POST` | `/api/inquiries` | Submit contact inquiry with honeypot spam protection |
| `POST` | `/api/newsletter` | Join confectionery subscriber circle |

### Admin Endpoints (Session Required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate admin & issue HTTP-only cookie |
| `POST` | `/api/admin/logout` | Clear admin session cookie |
| `GET` | `/api/admin/dashboard` | Aggregated sales, orders, and inquiry KPIs |
| `GET/POST`| `/api/admin/products` | List all or create a new bakery item |
| `PUT/DELETE`| `/api/admin/products/:id` | Update product or delete from catalog |
| `GET/POST`| `/api/admin/categories` | List or create categories |
| `GET/PATCH`| `/api/admin/orders/:id` | View order dossier & update fulfillment status |
| `GET/PATCH`| `/api/admin/custom-orders/:id`| Inspect bespoke request & issue quote |
| `GET/PUT` | `/api/admin/settings` | Read and update bakery configurations |
| `POST` | `/api/admin/upload` | Upload images directly to Cloudinary |

---

## 7. Verification & Production Build

- **Type Check:** `npx tsc --noEmit` (0 errors)
- **Lint Check:** `npm run lint` (0 errors)
- **Production Build:** `npm run build` (All 43 routes built and optimized)

---

## 8. Deployment Guide (Vercel + Neon)

1. **Push code to GitHub repository.**
2. **Import project into Vercel.**
3. **Configure Environment Variables** in Vercel project settings (`DATABASE_URL`, `AUTH_SECRET`, `CLOUDINARY_*`, `SMTP_*`).
4. **Deploy.** Vercel will automatically build all static pages and deploy the App Router handlers to serverless edge nodes.
