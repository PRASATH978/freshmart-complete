from django.contrib import admin
from django.urls import path, include
from apps.products.views import clear_images  # ← add this import
from apps.products.views import clear_images, debug_storage

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/delivery/', include('apps.delivery.urls')),
    path('clear-images/', clear_images),  # ← add this line
    path('debug-storage/', debug_storage), 
]