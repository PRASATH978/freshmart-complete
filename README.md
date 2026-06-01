# 🥦 FreshMart — Complete Full Stack Vegetable Shop

A complete online vegetable shop with **Django backend**, **React web frontend**, and **React Native mobile app**.

---

## 🏗️ Project Structure

```
freshmart-complete/
├── backend/          ← Django REST API
├── frontend/         ← React Web App
├── mobile/           ← React Native (Expo) Mobile App
└── README.md
```

---

## 👤 Demo Accounts

| Role     | Username   | Password  |
|----------|------------|-----------|
| Admin    | admin      | admin123  |
| Customer | customer   | pass123   |
| Delivery | delivery   | pass123   |

**Coupon Codes:** `FRESH20` (20% off) • `VEGGIE10` (10% off)

---

## 🚀 SETUP GUIDE

### ─── STEP 1: Backend (Django) ───

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations users
python manage.py makemigrations products
python manage.py makemigrations orders
python manage.py makemigrations delivery
python manage.py migrate

# Create demo data
python manage.py shell < seed_data.py

# Start server (for web frontend)
python manage.py runserver

# Start server (for mobile app — exposes to your phone)
python manage.py runserver 0.0.0.0:8000
```

Django runs at: http://127.0.0.1:8000
Django Admin: http://127.0.0.1:8000/admin

---

### ─── STEP 2: Frontend (React Web) ───

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

React runs at: http://localhost:3000

| Interface     | URL                          |
|---------------|------------------------------|
| Customer Shop | http://localhost:3000        |
| Admin Panel   | http://localhost:3000/admin  |
| Delivery App  | http://localhost:3000/delivery |

---

### ─── STEP 3: Mobile App (Expo) ───

```bash
cd mobile
npm install
```

Find your PC's WiFi IP:
- Windows: run `ipconfig` → look for IPv4 Address under WiFi
- Mac/Linux: run `ifconfig`

Update `mobile/src/api/index.js` line 4:
```javascript
const API_BASE = 'http://YOUR_WIFI_IP:8000/api';
// Example: 'http://192.168.1.5:8000/api'
```

Make sure Django is running with `0.0.0.0:8000` (not 127.0.0.1), then:

```bash
npx expo start --clear
```

Install **Expo Go** on your phone and scan the QR code.
Your phone and PC must be on the same WiFi.

---

## 💳 Razorpay Payment Setup

1. Go to razorpay.com → Sign Up → Settings → API Keys
2. Generate Test Key
3. Open `backend/veggieshop/settings.py` and update:

```python
RAZORPAY_KEY_ID = 'rzp_test_YOUR_KEY_ID'
RAZORPAY_KEY_SECRET = 'YOUR_KEY_SECRET'
```

**Test Card:** 4111 1111 1111 1111 | Any future date | Any CVV | OTP: 1234
**Test UPI:** success@razorpay

---

## 📱 Build Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo (create account at expo.dev)
eas login

cd mobile

# Initialize
eas build:configure

# Build APK (takes 10-15 min, builds in cloud)
eas build -p android --profile preview
```

Download link appears when done. Install on any Android phone!

---

## 🌐 API Endpoints

```
POST /api/auth/login/           Login
POST /api/auth/register/        Register
GET  /api/auth/profile/         My Profile

GET  /api/products/             List products
GET  /api/products/categories/  Categories
GET  /api/products/offers/      Active offers

GET  /api/orders/cart/          Get cart
POST /api/orders/cart/          Add to cart
POST /api/orders/               Place order
GET  /api/orders/               My orders

POST /api/orders/payment/create/   Create Razorpay order
POST /api/orders/payment/verify/   Verify payment
GET  /api/orders/admin/stats/      Admin stats
GET  /api/orders/admin/payments/   Payment list

GET  /api/delivery/my-deliveries/  Assigned deliveries
PATCH /api/delivery/orders/{id}/status/  Update status
```

---

## 🛠️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Django 4.2 + DRF + SimpleJWT       |
| Database | SQLite (dev) / PostgreSQL (prod)    |
| Frontend | React 18 + React Router 6           |
| Mobile   | React Native + Expo 52              |
| Payment  | Razorpay                            |
| Charts   | Recharts                            |

---

## ✅ Features

### Customer
- Browse products by category, search, filter
- Product details with ratings & reviews
- Cart with coupon codes & free delivery
- Checkout with COD or Razorpay (UPI/Card/NetBanking)
- Real-time order tracking with progress bar
- Offers & deals page

### Admin
- Dashboard with live revenue charts
- Product & category CRUD with stock alerts
- Order management — assign delivery boys
- Payment tracking with Razorpay IDs
- User management by role
- Offer & coupon management

### Delivery Boy
- Mobile-optimized delivery interface
- View assigned orders with customer details
- One-tap Start Delivery & Mark Delivered
- Direct call to customer
- Delivery history & stats

---

## 🔧 Common Issues

**Django: ModuleNotFoundError**
→ Activate virtual environment: `venv\Scripts\activate`

**React: Port 3000 in use**
→ Run on different port: `PORT=3001 npm start`

**Mobile: Network request failed**
→ Update API_BASE in `mobile/src/api/index.js` with your WiFi IP
→ Run Django with `0.0.0.0:8000` not `127.0.0.1:8000`

**Django admin: AttributeError with Python 3.14**
→ Use Python 3.11 or 3.12 instead
