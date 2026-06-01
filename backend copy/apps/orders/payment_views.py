import razorpay
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status, serializers

from .models import Order, Payment, OrderStatusHistory


# Razorpay client
client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


# =========================
# ADMIN PAYMENT STATS
# =========================
class AdminPaymentStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)

        today = timezone.now().date()

        paid_payments = Payment.objects.filter(status='paid')
        failed_payments = Payment.objects.filter(status='failed')

        total_collected = paid_payments.aggregate(
            total=Sum('amount')
        )['total'] or 0

        today_collected = paid_payments.filter(
            created_at__date=today
        ).aggregate(
            total=Sum('amount')
        )['total'] or 0

        total_cod = Order.objects.filter(payment_method='cod').count()

        return Response({
            'total_collected': float(total_collected),
            'today_collected': float(today_collected),
            'total_failed': failed_payments.count(),
            'total_online': paid_payments.count(),
            'total_cod': total_cod,
        })


# =========================
# ADMIN PAYMENTS LIST
# =========================
class AdminPaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    customer_name = serializers.CharField(source='order.user.username', read_only=True)
    payment_method = serializers.CharField(source='order.payment_method', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'order_id',
            'customer_name',
            'payment_method',
            'amount',
            'status',
            'razorpay_order_id',
            'razorpay_payment_id',
            'created_at',
        ]


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


# =========================
# CREATE RAZORPAY ORDER
# =========================
class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.payment_method == 'cod':
            return Response({'error': 'COD order does not require payment'}, status=400)

        amount_paise = int(float(order.total) * 100)

        try:
            razorpay_order = client.order.create({
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': f'order_{order.id}',
                'notes': {
                    'order_id': str(order.id),
                    'user': request.user.username,
                }
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'razorpay_order_id': razorpay_order['id'],
                'amount': order.total,
                'status': 'created',
            }
        )

        return Response({
            'razorpay_order_id': razorpay_order['id'],
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
            'amount': amount_paise,
            'currency': 'INR',
            'order_id': order.id,
            'customer_name': request.user.username,
            'customer_email': request.user.email,
            'customer_phone': getattr(request.user, 'phone', ''),
        })


# =========================
# VERIFY PAYMENT
# =========================
class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing payment details'}, status=400)

        # verify signature
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature,
            })
        except razorpay.errors.SignatureVerificationError:
            Payment.objects.filter(
                razorpay_order_id=razorpay_order_id
            ).update(status='failed')

            return Response({'error': 'Payment verification failed'}, status=400)

        try:
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)

            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'paid'
            payment.save()

            order = payment.order
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status='confirmed',
                note=f'Payment successful. Razorpay ID: {razorpay_payment_id}',
                changed_by=request.user
            )

            return Response({
                'success': True,
                'order_id': order.id,
                'payment_id': razorpay_payment_id,
            })

        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)


# =========================
# PAYMENT FAILED
# =========================
class PaymentFailedView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        error_description = request.data.get('error_description', 'Payment failed')

        Payment.objects.filter(
            razorpay_order_id=razorpay_order_id
        ).update(status='failed')

        return Response({
            'success': False,
            'message': error_description
        })


# =========================
# PAYMENT STATUS CHECK
# =========================
class PaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            payment = Payment.objects.get(order=order)

            return Response({
                'order_id': order.id,
                'payment_status': payment.status,
                'razorpay_payment_id': payment.razorpay_payment_id,
                'amount': payment.amount,
            })

        except (Order.DoesNotExist, Payment.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)