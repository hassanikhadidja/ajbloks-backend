# Backend API

Express.js REST API for an e-commerce style application: **MongoDB** persistence, **JWT** authentication, **product** management with Cloudinary image uploads, **checkout** that accepts cart line items, and **order** processing with admin workflows.

For a full technical breakdown (file-by-file responsibilities, API tables, cart vs. order design), see **[spec.md](./spec.md)**.

vercel app link https://backend-deploy-beige.vercel.app

---

## Features

| Area | Description |
|------|-------------|
| **MongoDB** | Data stored via Mongoose; connection string via `process.env.uri`. |
| **JWT authentication** | Register/login; Bearer token; protected routes load the current user. |
| **Products API** | List/get/add/update/delete products; admin-only writes; images via multipart upload to Cloudinary. |
| **Shopping cart** | No `/cart` API — the cart lives on the **client**; checkout sends `items` when creating an order (see [spec.md](./spec.md) §6). |
| **Orders** | Create order (public), delivery fee config endpoint, admin list/detail/status update/delete. |

---

## Project structure

```
backend/
├── index.js                 # App entry: DB, middleware, routes, listen
├── package.json
├── vercel.json              # Serverless deployment config
├── config/
│   ├── connectDB.js         # MongoDB (Mongoose)
│   └── cloudinary.js        # Image CDN config
├── controlles/
│   ├── ordercontrolles.js
│   ├── productcontrolles.js
│   └── usercontrolles.js
├── middlewares/
│   ├── emailvalidator.js
│   ├── isAuth.js            # JWT
│   ├── isAdmin.js
│   └── passwordvalidator.js
├── models/
│   ├── order.js
│   ├── product.js
│   └── user.js
├── routes/
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js
└── utils/
    └── multer.js            # Memory storage for uploads
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A [MongoDB](https://www.mongodb.com/) deployment (e.g. Atlas) and its connection URI
- A [Cloudinary](https://cloudinary.com/) account (for product images)

---

## Setup

1. **Clone** the repository and open the project folder.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables** — create a `.env` file in the project root (do not commit secrets):

   | Variable | Purpose |
   |----------|---------|
   | `uri` | MongoDB connection string |
   | `secretKey` | Secret for signing and verifying JWTs |
   | `PORT` | Optional; server port (defaults to `5000`) |
   | `CLOUDINARY_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_APIKEY` | Cloudinary API key |
   | `CLOUDINARY_APISECRET` | Cloudinary API secret |

4. **Run the server**

   ```bash
   npm start
   ```

   Or:

   ```bash
   npm run dev
   ```

   The app listens on `PORT` (default **5000**).

---

## API overview

Base URL example: `http://localhost:5000`

| Prefix | Purpose |
|--------|---------|
| `/product` | Products (GET public list; GET one / mutations require auth; admin for writes) |
| `/user` | Register, login, current user, admin user management |
| `/order` | Place orders, delivery config, admin order management |

Detailed method/path tables, payloads, and the **client-side cart → order** flow are documented in **[spec.md](./spec.md)**.

---

## Tech stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose
- **Auth:** JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcrypt`
- **Uploads:** `multer` (memory) + Cloudinary
- **CORS:** Enabled for browser clients

---

## Deployment

The repository includes `vercel.json` for Vercel. Ensure all environment variables from the table above are configured in the hosting dashboard. Multer is configured for **memory** storage so file uploads work in serverless environments.

---

## Documentation

- **[spec.md](./spec.md)** — Detailed specification: architecture, MongoDB, JWT, product endpoints, shopping cart pattern, order processing, environment reference.

---

## License

See `package.json` (`license` field).
