# SynTrace — Inventory & Order Management System

A full-stack pharmaceutical inventory and order management system built for the hackathon recruitment challenge.

**Live Demo:** *(Add your Vercel URL here after deployment)*  
**Test Credentials:**
- Admin: `admin@asamedchem.com` / `Admin@123`
- Seller: `seller@asamedchem.com` / `Seller@123`

---

## Project Overview

SynTrace is a multi-role inventory and quotation/order management platform. Admins manage products, categories, and orders; Sellers browse the catalogue, select quantities in any supported unit, see real-time pricing, and place quotations.

### Features
- 🔐 Role-based authentication (Admin / Seller)
- 🧪 Product catalogue with CRUD (create, edit, deactivate, delete)
- 📂 Category management
- 📦 Inventory view with stock levels in base and display units
- ⚖️ Full unit conversion: g ↔ kg, mL ↔ L, ea
- 💰 Live price calculation in any unit (INR)
- 🛒 Cart-based ordering with per-item unit selection
- 🧾 Admin order view with full unit conversion details
- 👥 User management panel
- 🔔 Real-time Order Status Notifications (floating toast alerts + interactive bell badge dropdowns)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, Server Actions, file-based routing |
| Database | Neon PostgreSQL (serverless) | Scales to zero, Vercel-compatible, serverless-friendly |
| ORM | Drizzle ORM | Fully typed, lightweight, neon-http compatible |
| Auth | NextAuth.js v5 | JWT-based, Credentials provider, easy role extension |
| Styling | Vanilla CSS (design system) | Full control, no runtime overhead |
| Deployment | Vercel | Seamless Next.js deployment |

---

## System Design

```
Browser
  │
  ├── /login, /register  (public)
  ├── /admin/*  ──── Sidebar → AdminLayout (server auth check)
  │     ├── /dashboard   (stats, recent orders)
  │     ├── /products    (CRUD)
  │     ├── /categories  (CRUD)
  │     ├── /inventory   (stock view)
  │     ├── /orders      (all orders, status update)
  │     └── /users       (user list)
  └── /seller/*  ─── Sidebar → SellerLayout (server auth check)
        ├── /dashboard   (personal stats)
        ├── /products    (browse/search/filter, add to cart)
        ├── /cart        (review, place order)
        └── /orders      (my order history)

API Routes
  ├── /api/auth/[...nextauth]  — NextAuth handlers
  ├── /api/register            — Seller self-registration
  ├── /api/admin/products      — CRUD (admin only)
  ├── /api/admin/categories    — CRUD (admin only)
  ├── /api/admin/orders/[id]   — Status update (admin only)
  └── /api/seller/orders       — Place order (seller)

Database: Neon PostgreSQL
  users → orders → order_items → products → categories
```

**Authentication flow:** NextAuth v5 with JWT strategy. On login, the JWT callback injects `id` and `role` into the token. Middleware reads the JWT to enforce route access (`/admin/*` → admin only, `/seller/*` → seller only).

---

## Database Schema

### Enums
```sql
CREATE TYPE user_role AS ENUM ('admin', 'seller');
CREATE TYPE unit_dimension AS ENUM ('weight', 'volume', 'count');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'cancelled');
```

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default random |
| name | TEXT | |
| email | TEXT | UNIQUE |
| password_hash | TEXT | bcrypt, cost=12 |
| role | user_role | default 'seller' |
| created_at | TIMESTAMPTZ | |

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | TEXT | UNIQUE |
| description | TEXT | nullable |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| name | TEXT | |
| sku | TEXT | UNIQUE, nullable |
| description | TEXT | nullable |
| category_id | UUID | FK → categories |
| dimension | unit_dimension | 'weight', 'volume', or 'count' |
| base_unit | TEXT | 'g', 'mL', or 'ea' |
| stock_quantity | NUMERIC(20,6) | **in base unit** |
| price_per_base_unit | NUMERIC(20,6) | **INR per 1 base unit** |
| min_order_quantity | NUMERIC(20,6) | in base unit |
| is_active | BOOLEAN | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| order_number | TEXT | UNIQUE, human-readable |
| seller_id | UUID | FK → users |
| status | order_status | default 'pending' |
| notes | TEXT | |
| total_amount | NUMERIC(20,6) | INR total |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders CASCADE |
| product_id | UUID | FK → products |
| ordered_unit | TEXT | What seller chose (e.g. 'kg') |
| ordered_quantity | NUMERIC(20,6) | In ordered_unit |
| base_quantity | NUMERIC(20,6) | In base unit (for audit) |
| conversion_factor | NUMERIC(20,6) | e.g. 1000 for kg→g |
| unit_price_at_order | NUMERIC(20,6) | Snapshot of price/base at order time |
| line_total | NUMERIC(20,6) | base_quantity × unit_price_at_order |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, default random |
| user_id | UUID | FK → users, null for admin-wide alerts |
| message | TEXT | Alert message text |
| type | TEXT | "order_placed" or "order_status_updated" |
| is_read | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | |

---

## Unit Storage & Conversion Strategy

### Internal Representation
All quantities are stored in a **single canonical base unit per dimension**:

| Dimension | Base Unit | Supported Display Units |
|---|---|---|
| Weight | **g** (grams) | g, kg |
| Volume | **mL** (milliliters) | mL, L |
| Count | **ea** (each/unit) | ea |

### Conversion Factors
| Display Unit | → Base Unit | Factor |
|---|---|---|
| g | g | × 1 |
| kg | g | × 1,000 |
| mL | mL | × 1 |
| L | mL | × 1,000 |
| ea | ea | × 1 |

### Price Storage
- `price_per_base_unit` stores **INR per 1 base unit** (e.g., ₹2.50 per gram)
- To show price per kg: `price_per_g × 1000` = ₹2,500/kg
- **PostgreSQL type:** `NUMERIC(20,6)` — handles up to 14 integer digits and 6 decimal places, sufficient for:
  - Very cheap reagents: ₹0.001/g = ₹0.000001 scale
  - Very expensive reagents: ₹50,000/ea for HPLC columns
  - Large bulk orders: 100,000 kg = 100,000,000 g

### Quantity Storage
- **PostgreSQL type:** `NUMERIC(20,6)` — same precision as price, handles nanogram-scale to multi-ton

### Where Conversions Happen
All conversion logic lives in [`lib/conversions.ts`](./lib/conversions.ts):

1. **Before saving (POST /api/seller/orders):** `toBaseUnit(orderedQty, orderedUnit)` converts to base before inserting into `base_quantity`
2. **Before display (product cards):** `pricePerDisplayUnit(pricePerBase, displayUnit)` shows price in seller's chosen unit
3. **Line total calculation:** `calculateLineTotal(qty, displayUnit, pricePerBase)` = `toBaseUnit(qty, unit) × pricePerBase`
4. **Inventory page:** `fromBaseUnit(stockBase, largerUnit)` converts g→kg / mL→L for display

### Rounding
- All arithmetic uses JavaScript native 64-bit float for display (sufficient precision for INR)
- Database stores `NUMERIC(20,6)` — no floating point rounding errors in storage
- Price inputs accept up to 6 decimal places

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL project (free tier works)

### Steps

```bash
# 1. Clone and install
git clone <your-repo-url>
cd asamedchem
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Neon DATABASE_URL and AUTH_SECRET
# Generate AUTH_SECRET: openssl rand -base64 32

# 3. Push schema to Neon (creates all tables)
npm run db:push

# 4. Seed with demo data
npm run seed

# 5. Run dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables
```env
DATABASE_URL="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (any name, Postgres 18, closest region to your Vercel deployment)
3. From the project dashboard, copy the **Connection string** (Pooled connection)
4. Paste it as `DATABASE_URL` in `.env.local`
5. Run `npm run db:push` to create tables

---

## Vercel Deployment

```bash
# 1. Push to GitHub
git add -A
git commit -m "feat: initial implementation"
git push origin main

# 2. Go to vercel.com → New Project → Import your repo

# 3. In Vercel project settings → Environment Variables, add:
#    DATABASE_URL = (your Neon pooled connection string)
#    AUTH_SECRET  = (your 32-char secret)
#    NEXTAUTH_URL = (your Vercel URL, e.g. https://asamedchem.vercel.app)

# 4. Deploy → Vercel will run: npm run build && npm start
```

---

## How to Use

### Admin Panel
1. Log in as `admin@asamedchem.com` / `Admin@123`
2. **Dashboard**: See stats and recent orders
3. **Products**: Create/edit/delete products. Set dimension (weight/volume/count), base price in INR per base unit. Live price preview shows equivalent prices in all units.
4. **Categories**: Add/edit/delete product categories
5. **Inventory**: View all products with stock in base and display units, stock value, and low-stock warnings
6. **Orders**: Expand any order to see line items with ordered unit, base equivalent, conversion factor, and unit price snapshot. Update order status via dropdown.
7. **Users**: View all registered users and their order counts

### Seller Portal
1. Log in as `seller@asamedchem.com` / `Seller@123` (or register a new seller account)
2. **Dashboard**: See your order stats and recent orders
3. **Browse Products**: Search/filter by name, SKU, category, or dimension
   - Toggle between available units (e.g., g / kg for weight products)
   - Price updates in real-time for the selected unit
   - Enter quantity → see live total before adding to cart
4. **Cart**: Review items with quantity, base equivalent, and conversion details. Add order notes. Click "Place Order / Quotation"
5. **My Orders**: View all past orders with status, items, and unit details

### Unit Conversion Demo
Order 2 kg of Paracetamol USP (priced at ₹2.50/g):
- Select "kg" unit → price shows ₹2,500/kg
- Enter quantity: 2 kg
- Cart shows: base equivalent = 2,000 g, line total = ₹5,000
- Admin view shows: ordered_unit=kg, ordered_quantity=2, base_quantity=2000, conversion_factor=1000, unit_price=₹2.50/g, line_total=₹5,000 ✓

---

## Architecture Decisions

1. **No Prisma, using Drizzle ORM**: Drizzle's neon-http adapter is edge-compatible and works natively with Next.js App Router server components without connection pooling issues.
2. **JWT strategy (no DB session table)**: Reduces DB queries per request. Role is embedded in JWT.
3. **NUMERIC(20,6) for all monetary/quantity fields**: Avoids PostgreSQL `FLOAT` precision loss. 6 decimal places handles micro-pricing (e.g., ₹0.001/mg).
4. **Both ordered_unit and base_quantity stored**: Preserves seller intent AND enables admin verification without recalculation.
5. **Stock deducted immediately on order**: Simpler UX; admin can reverse by updating stock manually if order is cancelled.
6. **Cart in localStorage**: No server-side cart table needed; keeps backend simple while allowing multi-tab usage.
