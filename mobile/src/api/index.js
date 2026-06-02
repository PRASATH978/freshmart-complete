import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://freshmart-complete-2.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Add token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = await AsyncStorage.getItem('refresh_token');

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh/`,
            { refresh }
          );

          await AsyncStorage.setItem('access_token', data.access);

          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (e) {
          await AsyncStorage.clear();
        }
      }
    }

    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  getUsers: (role) => api.get(`/auth/users/${role ? `?role=${role}` : ''}`),
};

export const productAPI = {
  getCategories: () => api.get('/products/categories/'),
  getProducts: (params) => api.get('/products/', { params }),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.patch(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
  getOffers: () => api.get('/products/offers/'),
  createOffer: (data) => api.post('/products/offers/', data),
  updateOffer: (id, data) => api.patch(`/products/offers/${id}/`, data),
  deleteOffer: (id) => api.delete(`/products/offers/${id}/`),
  getReviews: (id) => api.get(`/products/${id}/reviews/`),
  addReview: (id, data) => api.post(`/products/${id}/reviews/`, data),
  getAdminStats: () => api.get('/products/admin/stats/'),
};

export const orderAPI = {
  getCart: () => api.get('/orders/cart/'),
  addToCart: (data) => api.post('/orders/cart/', data),
  updateCartItem: (data) => api.patch('/orders/cart/', data),
  removeCartItem: (data) => api.delete('/orders/cart/', { data }),
  applyCoupon: (code) => api.post('/orders/cart/apply-coupon/', { coupon_code: code }),
  getOrders: (params) => api.get('/orders/', { params }),
  createOrder: (data) => api.post('/orders/', data),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
  getAdminStats: () => api.get('/orders/admin/stats/'),
  createRazorpayOrder: (data) => api.post('/orders/payment/create/', data),
  verifyPayment: (data) => api.post('/orders/payment/verify/', data),
  paymentFailed: (data) => api.post('/orders/payment/failed/', data),
  getAdminPayments: (params) => api.get('/orders/admin/payments/', { params }),
  getPaymentStats: () => api.get('/orders/admin/payment-stats/'),
};

export const deliveryAPI = {
  getMyDeliveries: (params) => api.get('/delivery/my-deliveries/', { params }),
  updateDeliveryStatus: (id, data) => api.patch(`/delivery/orders/${id}/status/`, data),
  getProfile: () => api.get('/delivery/profile/'),
  updateProfile: (data) => api.patch('/delivery/profile/', data),
  getStats: () => api.get('/delivery/stats/'),
};

export default api;