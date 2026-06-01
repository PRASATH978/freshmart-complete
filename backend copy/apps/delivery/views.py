from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from apps.orders.models import Order, OrderStatusHistory
from apps.orders.serializers import OrderSerializer
from .models import DeliveryBoyProfile


class DeliveryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryBoyProfile
        fields = '__all__'


class MyDeliveriesView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'delivery':
            return Order.objects.none()
        status_filter = self.request.query_params.get('status')
        qs = Order.objects.filter(delivery_boy=user).order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class UpdateDeliveryStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, order_id):
        if request.user.role not in ['delivery', 'admin']:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            order = Order.objects.get(id=order_id, delivery_boy=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        new_status = request.data.get('status')
        if new_status not in ['out_for_delivery', 'delivered']:
            return Response({'error': 'Invalid status'}, status=400)

        order.status = new_status
        order.save()
        OrderStatusHistory.objects.create(
            order=order, status=new_status,
            note=request.data.get('note', ''),
            changed_by=request.user
        )
        if new_status == 'delivered':
            profile, _ = DeliveryBoyProfile.objects.get_or_create(user=request.user)
            profile.total_deliveries += 1
            profile.save()

        return Response(OrderSerializer(order).data)


class DeliveryProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DeliveryProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = DeliveryBoyProfile.objects.get_or_create(user=self.request.user)
        return profile


class DeliveryStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'delivery':
            return Response({'error': 'Forbidden'}, status=403)
        orders = Order.objects.filter(delivery_boy=request.user)
        return Response({
            'total_assigned': orders.count(),
            'delivered': orders.filter(status='delivered').count(),
            'pending': orders.filter(status__in=['out_for_delivery', 'confirmed']).count(),
        })
