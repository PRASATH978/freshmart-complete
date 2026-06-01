import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);


// Multipart API for file uploads
const apiForm = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'multipart/form-data' },
});
apiForm.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  getUsers: (role) => api.get(`/auth/users/${role ? `?role=${role}` : ''}`),
  getAddresses: () => api.get('/auth/addresses/'),
  addAddress: (data) => api.post('/auth/addresses/', data),
};

export const productAPI = {
  getCategories: () => api.get('/products/categories/'),
  createCategory: (data) => api.post('/products/categories/', data),
  updateCategory: (id, data) => api.patch(`/products/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/products/categories/${id}/`),
  getProducts: (params) => api.get('/products/', { params }),
  getProduct: (id) => api.get(`/products/${id}/`),
  createProduct: (data) => api.post('/products/', data),
  updateProduct: (id, data) => api.patch(`/products/${id}/`, data),
  deleteProduct: (id) => api.delete(`/products/${id}/`),
  getOffers: () => api.get('/products/offers/'),
  createOffer: (data) => api.post('/products/offers/', data),
  updateOffer: (id, data) => api.patch(`/products/offers/${id}/`, data),
  deleteOffer: (id) => api.delete(`/products/offers/${id}/`),
  getReviews: (productId) => api.get(`/products/${productId}/reviews/`),
  addReview: (productId, data) => api.post(`/products/${productId}/reviews/`, data),
  getAdminStats: () => api.get('/products/admin/stats/'),
  createProductForm: (data) => apiForm.post('/products/', data),
  updateProductForm: (id, data) => apiForm.patch(`/products/${id}/`, data),
};

export const orderAPI = {
  getCart: () => api.get('/orders/cart/'),
  addToCart: (data) => api.post('/orders/cart/', data),
  updateCartItem: (data) => api.patch('/orders/cart/', data),
  removeCartItem: (data) => api.delete('/orders/cart/', { data }),
  applyCoupon: (code) => api.post('/orders/cart/apply-coupon/', { coupon_code: code }),
  getOrders: (params) => api.get('/orders/', { params }),
  getOrder: (id) => api.get(`/orders/${id}/`),
  createOrder: (data) => api.post('/orders/', data),
  updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
  getAdminStats: () => api.get('/orders/admin/stats/'),
  getAdminPayments: (params) => api.get('/orders/admin/payments/', { params }),
  getPaymentStats: () => api.get('/orders/admin/payment-stats/'),
  // Add these to orderAPI object
  // Add these to orderAPI object
  createRazorpayOrder: (data) => api.post('/orders/payment/create/', data),
  verifyPayment: (data) => api.post('/orders/payment/verify/', data),
  paymentFailed: (data) => api.post('/orders/payment/failed/', data),
getPaymentStatus: (orderId) => api.get(`/orders/payment/${orderId}/status/`),
};

export const deliveryAPI = {
  getMyDeliveries: (params) => api.get('/delivery/my-deliveries/', { params }),
  updateDeliveryStatus: (orderId, data) => api.patch(`/delivery/orders/${orderId}/status/`, data),
  getProfile: () => api.get('/delivery/profile/'),
  updateProfile: (data) => api.patch('/delivery/profile/', data),
  getStats: () => api.get('/delivery/stats/'),
};

export default api;
