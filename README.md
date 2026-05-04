# 🚛 MoveEasy — Full Stack MERN Moving Company App

A production-ready MERN stack application for a US moving company with AI-powered chat, quote generation, booking management, move tracking, and a full admin dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, CSS Modules, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| AI | Groq API (llama-3.3-70b-versatile) — FREE |
| Auth | JWT (JSON Web Tokens) + bcrypt |
| Build | Vite |

---

## Project Structure

```
moveeasy/
├── server/                    # Express API
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, profile
│   │   ├── quoteController.js # Quote creation & retrieval
│   │   ├── bookingController.js # Booking CRUD
│   │   ├── chatController.js  # Anthropic API proxy (SECURE)
│   │   └── adminController.js # Admin dashboard data
│   ├── middleware/
│   │   └── auth.js            # JWT protect + role guard
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Quote.js           # Quote schema (auto-pricing)
│   │   ├── Booking.js         # Booking + tracking history
│   │   └── ChatSession.js     # Chat session + lead capture
│   ├── routes/
│   │   ├── auth.js
│   │   ├── quotes.js
│   │   ├── bookings.js
│   │   ├── tracking.js
│   │   ├── chat.js
│   │   └── admin.js
│   ├── .env.example           # ← Copy to .env and fill in
│   └── index.js               # Entry point
│
└── client/                    # React App (Vite)
    └── src/
        ├── components/
        │   ├── chat/
        │   │   ├── ChatWidget.jsx      # Floating AI chat widget
        │   │   └── ChatWidget.module.css
        │   └── layout/
        │       ├── Navbar.jsx
        │       ├── Navbar.module.css
        │       ├── ProtectedRoute.jsx
        │       └── AdminRoute.jsx
        ├── context/
        │   └── AuthContext.jsx         # Global auth state
        ├── pages/
        │   ├── customer/
        │   │   ├── Home.jsx            # Full landing page
        │   │   ├── QuotePage.jsx       # Quote form + results
        │   │   ├── BookingPage.jsx     # Booking form
        │   │   ├── TrackPage.jsx       # Live tracking
        │   │   └── Dashboard.jsx       # Customer portal
        │   ├── auth/
        │   │   ├── LoginPage.jsx
        │   │   └── RegisterPage.jsx
        │   └── admin/
        │       ├── AdminLayout.jsx     # Sidebar layout
        │       ├── AdminDashboard.jsx  # Stats + charts
        │       ├── AdminBookings.jsx   # Bookings table + update
        │       ├── AdminQuotes.jsx     # Quotes table
        │       ├── AdminUsers.jsx      # Users table
        │       └── AdminLeads.jsx      # Chat leads + transcripts
        ├── services/
        │   └── api.js                  # Axios instance + all API calls
        ├── App.jsx                     # Routes
        ├── main.jsx
        └── index.css                  # Global styles + CSS vars
```

---

## Quick Start

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install all sub-dependencies
npm run install:all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/moveeasy
JWT_SECRET=change_this_to_a_long_random_string_in_production
JWT_EXPIRES_IN=7d
GROQ_API_KEY=sk-ant-your-anthropic-key-here
CLIENT_URL=http://localhost:5173
```

### 3. Create First Admin User

After starting the server, register normally via `/register`, then update your user in MongoDB Atlas:

```js
// In MongoDB Atlas Data Explorer or mongosh:
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

### 4. Run in Development

```bash
# From root — runs both server (port 5000) and client (port 5173)
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health check**: http://localhost:5000/api/health

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | JWT | Get profile |

### Quotes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/quotes | Optional | Create quote (auto-priced) |
| GET | /api/quotes/my | JWT | My quotes |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/bookings | Optional | Create booking |
| GET | /api/bookings/my | JWT | My bookings |
| GET | /api/bookings/ref/:ref | — | Get by reference |

### Tracking
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/tracking/:ref | — | Public tracking |

### Chat (Secure Proxy)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/chat | — | Send message → Claude |

### Admin (Admin JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/admin/stats | Dashboard stats + charts |
| GET | /api/admin/bookings | All bookings (paginated, filterable) |
| PATCH | /api/admin/bookings/:id | Update status + tracking |
| GET | /api/admin/quotes | All quotes (paginated) |
| GET | /api/admin/users | All customers |
| GET | /api/admin/leads | Chat session leads |

---

## Production Deployment

### Option A — Render (Free/Paid)

1. Push to GitHub
2. Create a Web Service on render.com → connect repo → root: `server/`
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Add all env vars in Render dashboard

For frontend — create a Static Site:
- Root: `client/`
- Build: `npm install && npm run build`
- Publish: `dist`

### Option B — Railway

```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option C — VPS (Ubuntu)

```bash
# Install PM2
npm i -g pm2

# Build frontend
cd client && npm run build

# Start backend with PM2
cd ../server
pm2 start index.js --name moveeasy-api
pm2 save

# Serve frontend with nginx
# Point nginx root to client/dist
```

---

## Security Features

- ✅ **API key never exposed to client** — all Claude calls go through `/api/chat` proxy
- ✅ **JWT authentication** with 7-day expiry
- ✅ **Bcrypt password hashing** (12 rounds)
- ✅ **Rate limiting** — 100 req/15min globally, 20 req/min on chat
- ✅ **Helmet.js** security headers
- ✅ **CORS** restricted to your client URL
- ✅ **Input validation** with express-validator
- ✅ **Role-based access** (customer vs admin)
- ✅ **Message history capped** at 20 messages to control token costs

---

## Customization

### Update pricing model
Edit `server/models/Quote.js` → `pre('save')` hook — adjust base rates per home size.

### Change AI system prompt
Edit `server/controllers/chatController.js` → `SYSTEM_PROMPT` constant.

### Add more services
Extend the `services` enum in `server/models/Quote.js` and add UI options in `client/src/pages/customer/QuotePage.jsx`.

### Brand colors
All colors use CSS variables in `client/src/index.css` — change once, applies everywhere.

---

## License

MIT — use freely for your business.
