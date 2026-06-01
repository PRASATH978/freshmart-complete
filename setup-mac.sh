#!/bin/bash
echo "================================================"
echo "   FreshMart - Complete Setup (Mac/Linux)"
echo "================================================"
echo ""

echo "[1/4] Setting up Django Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations users
python manage.py makemigrations products
python manage.py makemigrations orders
python manage.py makemigrations delivery
python manage.py migrate
python manage.py shell < seed_data.py
echo "Backend ready!"
cd ..

echo ""
echo "[2/4] Setting up React Frontend..."
cd frontend
npm install
echo "Frontend ready!"
cd ..

echo ""
echo "[3/4] Setting up Mobile App..."
cd mobile
npm install
echo "Mobile ready!"
cd ..

echo ""
echo "================================================"
echo " SETUP COMPLETE!"
echo "================================================"
echo ""
echo " Start Backend:"
echo "   cd backend && source venv/bin/activate"
echo "   python manage.py runserver 0.0.0.0:8000"
echo ""
echo " Start Frontend (new terminal):"
echo "   cd frontend && npm start"
echo ""
echo " Start Mobile (new terminal):"
echo "   cd mobile && npx expo start --clear"
echo ""
echo " Demo Accounts:"
echo "   Admin:    admin    / admin123"
echo "   Customer: customer / pass123"
echo "   Delivery: delivery / pass123"
echo "================================================"
