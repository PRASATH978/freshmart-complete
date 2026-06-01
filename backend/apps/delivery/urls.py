from django.urls import path
from . import views

urlpatterns = [
    path('my-deliveries/', views.MyDeliveriesView.as_view()),
    path('orders/<int:order_id>/status/', views.UpdateDeliveryStatusView.as_view()),
    path('profile/', views.DeliveryProfileView.as_view()),
    path('stats/', views.DeliveryStatsView.as_view()),
]
