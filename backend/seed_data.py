"""
Run this to create demo data:
  python manage.py shell < seed_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veggieshop.settings')
django.setup()



from django.contrib.auth import get_user_model
from apps.products.models import Category, Product, Offer
from apps.delivery.models import DeliveryBoyProfile
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

print("Creating users...")
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@freshmart.com', 'admin123',
        role='admin', first_name='Admin', last_name='User')
    print("  Admin: admin / admin123")

if not User.objects.filter(username='customer').exists():
    User.objects.create_user('customer', 'customer@freshmart.com', 'pass123',
        role='customer', first_name='Ravi', last_name='Kumar',
        phone='9876543210', address='123 Main St, Salem')
    print("  Customer: customer / pass123")

if not User.objects.filter(username='delivery').exists():
    d = User.objects.create_user('delivery', 'delivery@freshmart.com', 'pass123',
        role='delivery', first_name='Siva', last_name='Ram', phone='9876543211')
    DeliveryBoyProfile.objects.create(user=d, vehicle_type='Bike', vehicle_number='TN01AB1234')
    print("  Delivery: delivery / pass123")

print("\nCreating categories and products...")
cats = {}
for name, desc in [
    ('Leafy Greens', 'Fresh spinach, lettuce, cabbage'),
    ('Root Vegetables', 'Carrots, beets, radish'),
    ('Fruits & Tomatoes', 'Tomatoes, cucumbers, capsicum'),
    ('Herbs & Spices', 'Coriander, mint, curry leaves'),
    ('Exotic Vegetables', 'Broccoli, baby corn, zucchini'),
]:
    cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
    cats[name] = cat

products_data = [
    ('Spinach', 'Leafy Greens', 25, 'bunch', 100, True),
    ('Cabbage', 'Leafy Greens', 30, 'kg', 80, False),
    ('Lettuce', 'Leafy Greens', 40, 'bunch', 50, True),
    ('Cauliflower', 'Leafy Greens', 35, 'piece', 60, False),
    ('Carrots', 'Root Vegetables', 35, 'kg', 120, True),
    ('Beetroot', 'Root Vegetables', 28, 'kg', 90, False),
    ('Radish', 'Root Vegetables', 20, 'bunch', 60, False),
    ('Onions', 'Root Vegetables', 30, 'kg', 200, True),
    ('Tomatoes', 'Fruits & Tomatoes', 40, 'kg', 150, True),
    ('Cucumber', 'Fruits & Tomatoes', 25, 'kg', 100, False),
    ('Capsicum', 'Fruits & Tomatoes', 60, 'kg', 70, True),
    ('Coriander', 'Herbs & Spices', 10, 'bunch', 200, False),
    ('Mint', 'Herbs & Spices', 10, 'bunch', 150, False),
    ('Ginger', 'Herbs & Spices', 90, 'kg', 40, False),
    ('Garlic', 'Herbs & Spices', 80, 'kg', 50, False),
    ('Broccoli', 'Exotic Vegetables', 80, 'piece', 40, True),
    ('Baby Corn', 'Exotic Vegetables', 55, 'kg', 35, True),
    ('Zucchini', 'Exotic Vegetables', 65, 'kg', 30, False),
    ('Beans', 'Exotic Vegetables', 50, 'kg', 80, False),
    ('Peas', 'Exotic Vegetables', 45, 'kg', 90, True),
]

for name, cat_name, price, unit, stock, featured in products_data:
    if not Product.objects.filter(name=name).exists():
        Product.objects.create(
            name=name, category=cats[cat_name], price=price, unit=unit,
            stock=stock, is_featured=featured, is_active=True,
            description=f'Fresh {name.lower()} sourced daily from local farms.'
        )

print(f"  Created {len(products_data)} products")

print("\nCreating offers...")
now = timezone.now()
if not Offer.objects.filter(coupon_code='FRESH20').exists():
    Offer.objects.create(
        title='Fresh20 — 20% Off Everything',
        description='Use code FRESH20 for 20% off on orders above ₹200',
        offer_type='flat', discount_percent=20, min_order_amount=200,
        coupon_code='FRESH20', is_active=True,
        start_date=now, end_date=now + timedelta(days=30)
    )

if not Offer.objects.filter(coupon_code='VEGGIE10').exists():
    Offer.objects.create(
        title='Veggie10 — Flat 10% Off',
        description='Get 10% off on your order, no minimum',
        offer_type='flat', discount_percent=10, min_order_amount=0,
        coupon_code='VEGGIE10', is_active=True,
        start_date=now, end_date=now + timedelta(days=60)
    )

print("  Created 2 offers")
print("\n✅ All seed data created successfully!")
print("\nDemo Accounts:")
print("  Admin    → admin    / admin123")
print("  Customer → customer / pass123")
print("  Delivery → delivery / pass123")
print("\nCoupon Codes:")
print("  FRESH20  → 20% off (min ₹200)")
print("  VEGGIE10 → 10% off (no min)")
