from django.urls import path
from . import views
from . import payment_views

from .payment_views import (
    AdminPaymentStatsView,
    AdminPaymentsView,
)
urlpatterns = [
    path('cart/', views.CartView.as_view()),
    path('cart/apply-coupon/', views.ApplyCouponView.as_view()),

    path('', views.OrderListCreateView.as_view()),
    path('<int:pk>/', views.OrderDetailView.as_view()),

    path('admin/stats/', views.AdminOrderStatsView.as_view()),

    path('admin/payments/', AdminPaymentsView.as_view()),
    path('admin/payment-stats/', AdminPaymentStatsView.as_view()),

        # Razorpay Payment
    path('payment/create/', payment_views.CreateRazorpayOrderView.as_view()),
    path('payment/verify/', payment_views.VerifyPaymentView.as_view()),
    path('payment/failed/', payment_views.PaymentFailedView.as_view()),
    path('payment/<int:order_id>/status/', payment_views.PaymentStatusView.as_view()),
]
