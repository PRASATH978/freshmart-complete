
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer
from apps.products.models import Product, Offer


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item_id = request.data.get('item_id')
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response(CartSerializer(cart).data)

    def patch(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))
        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            if quantity <= 0:
                item.delete()
            else:
                item.quantity = quantity
                item.save()
        except CartItem.DoesNotExist:
            pass
        return Response(CartSerializer(cart).data)


class ApplyCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        coupon = request.data.get('coupon_code', '').upper()
        cart, _ = Cart.objects.get_or_create(user=request.user)
        total = cart.total
        offer = Offer.objects.filter(coupon_code__iexact=coupon, is_active=True).first()
        if not offer:
            return Response({'error': 'Invalid coupon code'}, status=400)
        if total < offer.min_order_amount:
            return Response({'error': f'Minimum order amount is ₹{offer.min_order_amount}'}, status=400)
        discount = round(total * offer.discount_percent / 100, 2)
        return Response({
            'valid': True,
            'discount': discount,
            'offer_title': offer.title,
            'discount_percent': offer.discount_percent,
        })


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Order.objects.all().order_by('-created_at')
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs
        return Order.objects.filter(user=user).order_by('-created_at')

    def create(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        subtotal = cart.total
        delivery_charge = 0 if subtotal >= 500 else 40
        discount = float(request.data.get('discount_amount', 0))
        total = float(subtotal) + delivery_charge - discount

        order = Order.objects.create(
            user=request.user,
            delivery_address=request.data.get('delivery_address', request.user.address),
            delivery_city=request.data.get('delivery_city', ''),
            delivery_pincode=request.data.get('delivery_pincode', ''),
            payment_method=request.data.get('payment_method', 'cod'),
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            discount_amount=discount,
            total=total,
            coupon_applied=request.data.get('coupon_applied', ''),
            notes=request.data.get('notes', ''),
            estimated_delivery=timezone.now() + timedelta(hours=2),
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                price=item.product.discounted_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )

        OrderStatusHistory.objects.create(
            order=order, status='pending',
            note='Order placed', changed_by=request.user
        )

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'delivery']:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')
        delivery_boy_id = request.data.get('delivery_boy')

        if new_status:
            order.status = new_status
            if delivery_boy_id:
                order.delivery_boy_id = delivery_boy_id
            order.save()
            OrderStatusHistory.objects.create(
                order=order, status=new_status,
                note=request.data.get('note', ''),
                changed_by=request.user
            )

        return Response(OrderSerializer(order).data)


class AdminOrderStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        from django.db.models import Sum, Count
        from django.utils import timezone
        today = timezone.now().date()
        orders = Order.objects.all()
        return Response({
            'total_orders': orders.count(),
            'pending_orders': orders.filter(status='pending').count(),
            'delivered_orders': orders.filter(status='delivered').count(),
            'cancelled_orders': orders.filter(status='cancelled').count(),
            'today_orders': orders.filter(created_at__date=today).count(),
            'today_revenue': orders.filter(
                created_at__date=today, status='delivered'
            ).aggregate(total=Sum('total'))['total'] or 0,
            'total_revenue': orders.filter(status='delivered').aggregate(
                total=Sum('total'))['total'] or 0,
            'orders_by_status': list(orders.values('status').annotate(count=Count('id'))),
        })



class AdminPaymentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)

        payments = Payment.objects.select_related(
            'order',
            'order__user'
        ).order_by('-created_at')

        status_filter = request.GET.get('status')

        if status_filter:
            payments = payments.filter(status=status_filter)

        serializer = AdminPaymentSerializer(payments, many=True)

        return Response(serializer.data)