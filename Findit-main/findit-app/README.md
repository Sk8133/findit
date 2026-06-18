# 🔍 FindIt — Lost & Found Platform

A full-stack Lost & Found web application with Express backend REST API and a polished SPA frontend.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Seed demo data (optional but recommended)
```bash
node backend/seed.js
```

### 3. Start the server
```bash
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🔑 Demo Credentials
| Email | Password |
|-------|----------|
| demo@findit.com | demo123 |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login & get JWT token |
| GET  | `/api/auth/me` | Get current user |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/items` | Browse all items (with filters) |
| GET    | `/api/items/stats` | Dashboard statistics |
| GET    | `/api/items/:id` | Get single item |
| POST   | `/api/items` | Create new report |
| PUT    | `/api/items/:id` | Update item details |
| PATCH  | `/api/items/:id/status` | Update status only |
| POST   | `/api/items/:id/update` | Add timeline note |
| DELETE | `/api/items/:id` | Delete item |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/users/profile` | Get profile |
| PUT    | `/api/users/profile` | Update profile |

### Query Filters for GET /api/items
- `?type=lost` or `?type=found`
- `?category=Electronics`
- `?status=pending`
- `?colour=Black`
- `?q=wallet` (search query)
- `?userId=u_demo` (my items)

---

## 🏗️ Project Structure

```
findit-app/
├── backend/
│   ├── server.js         ← Express server entry point
│   ├── db.js             ← JSON file database helpers
│   ├── seed.js           ← Demo data seeder
│   ├── middleware/
│   │   └── auth.js       ← JWT middleware
│   ├── routes/
│   │   ├── auth.js       ← Auth routes
│   │   ├── items.js      ← Items CRUD routes
│   │   └── users.js      ← User routes
│   └── data/
│       ├── users.json    ← User store
│       └── items.json    ← Items store
└── frontend/
    └── public/
        ├── index.html    ← Entry point
        ├── styles.css    ← Complete design system
        ├── api.js        ← API client
        └── app.js        ← SPA router + all page renderers
```

---

## ✨ Features

- **Authentication** — Register, login, JWT-based sessions
- **Report Lost Items** — Full form with image upload, location, reward
- **Report Found Items** — Item details, current custody location
- **Browse & Search** — Filter by type, category, status, colour
- **Grid / List View** — Toggle between layouts
- **Item Detail Page** — Full info, contact, activity timeline
- **Edit Items** — Update any field, change photo, quick status buttons
- **My Reports** — Tab-filtered view of your items
- **Status Tracking** — Lost → Found → Pending → Returned
- **Timeline Updates** — Owners can post progress notes
- **Dashboard** — Stats overview, recent lost/found, my reports table

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Auth**: bcryptjs + JSON Web Tokens
- **Database**: JSON flat-file (no setup required)
- **Frontend**: Vanilla JS SPA + CSS custom properties
- **Fonts**: Outfit + Space Grotesk (Google Fonts)
