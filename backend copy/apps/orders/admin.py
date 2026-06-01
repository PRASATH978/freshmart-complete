from .models import Payment  # add to existing import
from django.contrib import admin


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'razorpay_order_id', 'razorpay_payment_id', 'amount', 'status', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['razorpay_order_id', 'razorpay_payment_id', 'order__id']
    readonly_fields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'created_at', 'updated_at']