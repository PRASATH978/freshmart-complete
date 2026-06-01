from django.contrib import admin
from .models import DeliveryBoyProfile

@admin.register(DeliveryBoyProfile)
class DeliveryBoyProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'vehicle_type', 'vehicle_number', 'is_available', 'total_deliveries', 'rating']
    list_filter = ['is_available']
    list_editable = ['is_available']
