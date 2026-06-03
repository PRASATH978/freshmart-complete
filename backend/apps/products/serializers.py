from rest_framework import serializers
from .models import Category, Product, Offer, Review
from .models import Category, Product, Offer, Review, Wishlist

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = '__all__'

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['user']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.ReadOnlyField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    active_offer = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return 0

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_active_offer(self, obj):
        offer = obj.offers.filter(is_active=True).first()
        if offer:
            return {'title': offer.title, 'discount_percent': offer.discount_percent}
        return None


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data['product_id']
        wishlist, _ = Wishlist.objects.get_or_create(
            user=user, product_id=product_id
        )
        return wishlist