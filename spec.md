# Backend — Technical Specification

This document describes the architecture, data layer, authentication, and API behavior of this Express.js backend. It is the single source of truth for how the system is structured and what each area is responsible for.

---

## 1. Project purpose

The backend supports an e-commerce style application: product catalog management, user accounts with role-based access, checkout that accepts line items (aligned with a **client-side shopping cart**), and order lifecycle management with delivery fee rules.

---

## 2. Repository layout (folders and files)

Below is the **application** structure (excluding `node_modules` and other generated artifacts). Paths are relative to the project root.

```
backend/
├── .env                    # Local secrets (MongoDB URI, JWT secret, Cloudinary) — do not commit real values
├── .gitignore
├── index.js                # Express app bootstrap, middleware, route mounting, server listen
├── package.json
├── package-lock.json
├── vercel.json             # Vercel serverless deployment: builds `index.js`, routes all traffic to it
│
├── .vscode/
│   └── settings.json       # Editor/workspace settings
│
├── config/
│   ├── connectDB.js        # Mongoose connection to MongoDB (`process.env.uri`)
│   └── cloudinary.js       # Cloudinary SDK configuration (image hosting for products)
│
├── controlles/             # Request handlers (business logic layer; note: folder name spelling)
│   ├── ordercontrolles.js  # Orders: create, list, detail, status update, delete; delivery config
│   ├── productcontrolles.js # Products: CRUD; image upload to Cloudinary
│   └── usercontrolles.js   # Users: register, login, JWT issue, profile, admin user list, update
│
├── middlewares/
│   ├── emailvalidator.js   # Email format check (used on registration)
│   ├── isAuth.js           # JWT verification; loads `req.user` (password excluded)
│   ├── isAdmin.js          # Ensures `req.user.role === "admin"`
│   └── passwordvalidator.js # Password strength rules (length, upper, lower, digit, symbol)
│
├── models/                 # Mongoose schemas
│   ├── order.js            # Order document: customer fields, embedded line items, totals, status
│   ├── product.js          # Product: name, SKU, price, images, category, stock, etc.
│   └── user.js             # User: email, hashed password, name, role (`admin` | `client`)
│
├── routes/                 # Express routers; mount paths defined in `index.js`
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js
│
└── utils/
    ├── multer.js           # Multer with memory storage (for Cloudinary upload on serverless)
    └── photo_2026-03-26_19-39-42.jpg  # Static asset (not referenced by code in this repo)
```

**Runtime dependency tree (conceptual):**

- `index.js` → `config/connectDB`, `routes/*`, `cors`, `express.json`, static `/uploads`
- Routes → `controlles/*` + `middlewares/*` + `utils/multer` (products)

---

## 3. MongoDB database setup

| Aspect | Implementation |
|--------|----------------|
| **Driver / ODM** | [Mongoose](https://mongoosejs.com/) (`mongoose` in `package.json`) |
| **Connection** | `config/connectDB.js` calls `mongoose.connect(process.env.uri)` |
| **Configuration** | Connection string must be provided as environment variable `uri` (e.g. MongoDB Atlas URI) |
| **Failure behavior** | If `uri` is missing, connection throws. `index.js` exits the process if DB connection fails on startup |
| **Collections** | Implicit from models: typically `users`, `products`, `orders` (Mongoose pluralization rules apply) |

**Schemas (summary):**

- **User** (`models/user.js`): unique email, bcrypt-hashed password, optional name, `role` enum default `client`.
- **Product** (`models/product.js`): catalog fields including `img` (array of URL strings), `category` enum, `stock`, timestamps.
- **Order** (`models/order.js`): customer shipping info, embedded `items` (product snapshot: id, name, price, quantity, image), monetary fields, `status` enum, optional `userId` reference.

---

## 4. User authentication (JWT)

| Aspect | Implementation |
|--------|----------------|
| **Registration** | `POST /user/register` — email validation, password rules, bcrypt hash, rejects client-set `role` |
| **Login** | `POST /user/login` — bcrypt compare; on success returns **JWT** signed with `process.env.secretKey` and payload `{ _id }` |
| **Protected routes** | `middlewares/isAuth.js`: expects `Authorization` header; parses **Bearer** token (`split(" ")[1]`); `jwt.verify(token, process.env.secretKey)`; attaches `req.user` |
| **Authorization** | `middlewares/isAdmin.js`: requires `req.user.role === "admin"` after `Auth` |

**Client usage:** Send header `Authorization: Bearer <token>` for protected endpoints.

---

## 5. Product API (add, update, delete, read)

Base path: **`/product`** (see `routes/productRoutes.js`).

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/product/` | No | — | List all products |
| GET | `/product/:id` | Yes (`Auth`) | Any authenticated user | Get one product by ID |
| POST | `/product/` | Yes + `isAdmin` | Admin | Create product; **multipart** field `files` (up to 10 images); body fields for product data; images uploaded to Cloudinary, URLs stored in `img` |
| PATCH | `/product/:id` | Yes + `isAdmin` | Admin | Update product; optional new `files`; supports `keepImgs` to retain existing image URLs |
| DELETE | `/product/:id` | Yes + `isAdmin` | Admin | Delete product |

**Image pipeline:** `utils/multer.js` uses **memory storage** (required for serverless); `controlles/productcontrolles.js` streams buffers to Cloudinary (`config/cloudinary.js`), folder `jeunes-toys`.

---

## 6. Shopping cart functionality

This backend **does not** expose a dedicated `/cart` resource or a persisted cart collection.

**Intended pattern:**

1. **Cart state** is maintained on the **client** (e.g. browser `localStorage`, session storage, or frontend state).
2. **Checkout** sends the cart contents to the server as the **`items` array** on order creation (see §7).

Each order line item is a snapshot: `productId`, `name`, `price`, `quantity`, `img`, matching `order.js` subdocuments. That design supports checkout without requiring a server-side cart database.

---

## 7. Order processing functionality

Base path: **`/order`** (see `routes/orderRoutes.js`).

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/order/` | No | — | Create order from body: `customerName`, `phone`, `wilaya`, `commune`, `items[]`, optional `note`. Computes `subtotal`, `deliveryFee`, `total`. Controller can set `userId` from `req.user` when present — **currently** this route does not use `Auth`, so `userId` stays unset unless you add optional JWT middleware |
| GET | `/order/config` | No | — | Returns `{ freeDeliveryThreshold, deliveryFee }` for frontend parity |
| GET | `/order/` | Yes + `isAdmin` | Admin | List all orders (newest first) |
| GET | `/order/:id` | Yes + `isAdmin` | Admin | Get one order |
| PATCH | `/order/:id` | Yes + `isAdmin` | Admin | Update `status`: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| DELETE | `/order/:id` | Yes + `isAdmin` | Admin | Delete order |

To associate orders with logged-in users, mount optional or required `Auth` on `POST /order/` so `req.user` is populated before `CreateOrder` runs.

**Business rules (order controller):** Flat delivery fee below a subtotal threshold; free delivery at or above threshold (values defined in `controlles/ordercontrolles.js`).

---

## 8. User routes (supplementary)

Base path: **`/user`**.

| Method | Path | Notes |
|--------|------|--------|
| POST | `/user/register` | Public |
| POST | `/user/login` | Returns JWT |
| GET | `/user/getcurrentuser` | Requires `Auth` |
| GET | `/user/` | `Auth` + `isAdmin` — list users |
| PATCH | `/user/:id` | `Auth` — update user (consider tightening to admin or self-only in production) |

---

## 9. Cross-cutting concerns

- **CORS:** Configured in `index.js` with `origin: '*'` and `credentials: true` (review for production if using cookies).
- **Static files:** `/uploads` mapped to local `uploads` folder; product images use Cloudinary instead for primary storage.
- **Deployment:** `vercel.json` routes all requests to the Node entrypoint; memory-based multer aligns with serverless constraints.
- **404:** Unmatched routes return JSON `{ message: "Route not found" }`.

---

## 10. Environment variables (reference)

| Variable | Used by |
|----------|---------|
| `uri` | MongoDB connection (`connectDB.js`) |
| `secretKey` | JWT sign/verify (`usercontrolles`, `isAuth`) |
| `PORT` | Server port (default `5000`) |
| `CLOUDINARY_NAME`, `CLOUDINARY_APIKEY`, `CLOUDINARY_APISECRET` | Cloudinary (`cloudinary.js`) |

---

## 11. Known implementation notes

- `index.js` invokes `connectDB()` once at load and again inside `startServer()`; consider deduplicating to a single awaited connection for clarity.
- Folder name `controlles` is a typo of “controllers”; kept as-is to match imports.
