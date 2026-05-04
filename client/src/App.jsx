import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute  from './components/layout/ProtectedRoute';
import AdminRoute      from './components/layout/AdminRoute';
import Navbar          from './components/layout/Navbar';
import ChatWidget      from './components/chat/ChatWidget';

// Customer pages
import Home        from './pages/customer/Home';
import QuotePage   from './pages/customer/QuotePage';
import BookingPage from './pages/customer/BookingPage';
import TrackPage   from './pages/customer/TrackPage';
import Dashboard   from './pages/customer/Dashboard';

// Auth pages
import LoginPage      from './pages/auth/LoginPage';
import RegisterPage   from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

// Admin pages
import AdminLayout    from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings  from './pages/admin/AdminBookings';
import AdminQuotes    from './pages/admin/AdminQuotes';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminLeads     from './pages/admin/AdminLeads';

function CustomerLayout({ children }) {
  return <><Navbar />{children}<ChatWidget /></>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public — no login needed */}
        <Route path="/"        element={<CustomerLayout><Home /></CustomerLayout>} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected — must be logged in */}
        <Route path="/quote" element={
          <ProtectedRoute><CustomerLayout><QuotePage /></CustomerLayout></ProtectedRoute>
        } />
        <Route path="/book" element={
          <ProtectedRoute><CustomerLayout><BookingPage /></CustomerLayout></ProtectedRoute>
        } />
        <Route path="/track" element={
          <ProtectedRoute><CustomerLayout><TrackPage /></CustomerLayout></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><CustomerLayout><Dashboard /></CustomerLayout></ProtectedRoute>
        } />

        {/* Admin — must be admin role */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index          element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="quotes"   element={<AdminQuotes />} />
          <Route path="users"    element={<AdminUsers />} />
          <Route path="leads"    element={<AdminLeads />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
