import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_URL || ''}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });

// Stylists
export const getStylists = () => api.get('/stylists');
export const getStylist = (id) => api.get(`/stylists/${id}`);
export const createStylist = (data) => api.post('/stylists', data);
export const updateStylist = (id, data) => api.put(`/stylists/${id}`, data);
export const deleteStylist = (id) => api.delete(`/stylists/${id}`);

// Services
export const getServices = () => api.get('/services');
export const getService = (id) => api.get(`/services/${id}`);
export const createService = (data) => api.post('/services', data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const deleteService = (id) => api.delete(`/services/${id}`);

// Clients
export const getClients = () => api.get('/clients');
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Bookings
export const getBookings = () => api.get('/bookings');
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const createBooking = (data) => api.post('/bookings', data);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Waitlist
export const getWaitlist = () => api.get('/waitlist');
export const getWaitlistEntry = (id) => api.get(`/waitlist/${id}`);
export const createWaitlistEntry = (data) => api.post('/waitlist', data);
export const updateWaitlistEntry = (id, data) => api.put(`/waitlist/${id}`, data);
export const deleteWaitlistEntry = (id) => api.delete(`/waitlist/${id}`);

// AI Features
export const aiStylistMatch = (data) => api.post('/ai/stylist-match', data);
export const aiDurationPredict = (data) => api.post('/ai/duration-predict', data);
export const aiProductRecommend = (data) => api.post('/ai/product-recommend', data);
export const aiRebookSuggest = (data) => api.post('/ai/rebook-suggest', data);
export const aiWaitlistOptimize = () => api.post('/ai/waitlist-optimize');
export const aiRebookQueue = () => api.post('/ai/rebook-queue');
export const aiReminderMessage = (data) => api.post('/ai/reminder-message', data);

// Bookings extras
export const getBookingsByDate = (date) => api.get(`/bookings/calendar/${date}`);
export const submitBookingReview = (id, data) => api.post(`/bookings/${id}/review`, data);
export const createBookingFromRecommendation = (data) => api.post('/bookings/from-recommendation', data);

// Stylist commissions
export const getStylistCommissions = (id, params) => api.get(`/stylists/${id}/commissions`, { params });

export default api;
