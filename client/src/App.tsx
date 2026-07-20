import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppDispatch } from './store/store';
import { setCredentials, clearCredentials, setLoading } from './store/authSlice';
import api from './services/api';

// Layouts
import RootLayout from './layouts/RootLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages (Lazy)
const Home = lazy(() => import('./pages/Home'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const VisualSearch = lazy(() => import('./pages/VisualSearch'));

// Auth Pages (Lazy)
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'));
const NotFoundPage = lazy(() => import('./components/ErrorPages').then(m => ({ default: m.NotFoundPage })));

// User Protected Pages (Lazy)
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const SupportChat = lazy(() => import('./pages/SupportChat'));

// Admin Protected Pages (Lazy)
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const ProductManagement = lazy(() => import('./pages/Admin/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/Admin/OrderManagement'));
const AdminSupportChat = lazy(() => import('./pages/Admin/AdminSupportChat'));

// Glassmorphic loader for code-splitted chunks loading transitions
const ChunkLoader: React.FC = () => (
  <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-xs antialiased font-semibold text-muted-foreground select-none relative overflow-hidden">
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none select-none z-0" />
    <div className="relative w-10 h-10 flex items-center justify-center z-10">
      <div className="absolute w-6 h-6 rounded-full border-t border-r border-foreground animate-spin" />
    </div>
    <span className="uppercase tracking-widest mt-4 opacity-50 text-[9px] z-10">Syncing Workspace...</span>
  </div>
);

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Try to restore user session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Attempt to rotate and retrieve new access token on reload
        const refreshResponse = await api.post('/auth/refresh');
        const { accessToken } = refreshResponse.data;

        // Fetch user details using this token
        const profileResponse = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        dispatch(
          setCredentials({
            user: profileResponse.data.user,
            accessToken,
          })
        );
      } catch (err) {
        // Session refresh failed, user is a guest
        dispatch(clearCredentials());
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Global event listener to catch expired session triggers from Axios interceptors
  useEffect(() => {
    const handleForcedLogout = () => {
      dispatch(clearCredentials());
      navigate('/auth/login');
    };

    window.addEventListener('auth:logout', handleForcedLogout);

    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
    };
  }, [dispatch, navigate]);

  return (
    <Suspense fallback={<ChunkLoader />}>
      <Routes>
        {/* PUBLIC CUSTOMER PATHS */}
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="visual-search" element={<VisualSearch />} />

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<SupportChat />} />
          </Route>
        </Route>

        {/* AUTHENTICATION PATHS */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="verify-email/:token" element={<VerifyEmail />} />
        </Route>

        {/* ADMIN PANEL PATHS */}
        <Route path="/admin" element={<ProtectedRoute adminOnly />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="support" element={<AdminSupportChat />} />
          </Route>
        </Route>

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;
