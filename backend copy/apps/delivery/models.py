from django.db import models


class DeliveryBoyProfile(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='delivery_profile')
    vehicle_type = models.CharField(max_length=50, default='Bike')
    vehicle_number = models.CharField(max_length=20, blank=True)
    is_available = models.BooleanField(default=True)
    current_location = models.CharField(max_length=200, blank=True)
    total_deliveries = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)

    def __str__(self):
        return f"Delivery: {self.user.username}"
