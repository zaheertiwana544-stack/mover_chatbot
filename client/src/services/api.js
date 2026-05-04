import axios from 'axios';

/**
 * Axios instance.
 * withCredentials: true — sends the httpOnly cookie on every request.
 * No Authorization header, no localStorage token. Completely cookie-based.
 */
const api = axios.create({
  baseURL:         '/api',
  timeout:         15000,
  withCredentials: true,    // critical: sends httpOnly cookie cross-origin
  headers:         { 'Content-Type': 'application/json' }
});

// On 401 — clear local user state and redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Don't redirect if already on login pages
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  getMe:    ()     => api.get('/auth/me'),
  updateMe: (data) => api.patch('/auth/me', data),
};

// ── Quotes ──
export const quotesAPI = {
  create:     (data) => api.post('/quotes', data),
  getCatalog: ()     => api.get('/quotes/catalog'),
  getMy:      ()     => api.get('/quotes/my'),
  getById:    (id)   => api.get(`/quotes/${id}`),
};

// ── Bookings ──
export const bookingsAPI = {
  create:   (data) => api.post('/bookings', data),
  getMy:    ()     => api.get('/bookings/my'),
  getByRef: (ref)  => api.get(`/bookings/ref/${ref}`),
};

// ── Tracking ──
export const trackingAPI = {
  track: (ref) => api.get(`/tracking/${ref}`),
};

// ── Chat ──
export const chatAPI = {
  send: (messages, sessionId) => api.post('/chat', { messages, sessionId }),
};

// ── Admin ──
export const adminAPI = {
  getStats:      ()       => api.get('/admin/stats'),
  getBookings:   (params) => api.get('/admin/bookings', { params }),
  updateBooking: (id, d)  => api.patch(`/admin/bookings/${id}`, d),
  getQuotes:     (params) => api.get('/admin/quotes', { params }),
  getUsers:      ()       => api.get('/admin/users'),
  getLeads:      ()       => api.get('/admin/leads'),
};

export default api;
