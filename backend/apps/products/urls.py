from django.urls import path
from . import views


urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view()),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view()),
    path('', views.ProductListCreateView.as_view()),
    path('<int:pk>/', views.ProductDetailView.as_view()),
    path('<int:product_id>/reviews/', views.ReviewListCreateView.as_view()),
    path('offers/', views.OfferListCreateView.as_view()),
    path('offers/<int:pk>/', views.OfferDetailView.as_view()),
    path('admin/stats/', views.AdminProductStatsView.as_view()),
    path('debug-storage/', debug_storage),  # ← add this.
]
