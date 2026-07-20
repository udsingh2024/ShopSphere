import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/store';
import { ShoppingBag } from 'lucide-react';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // If user is already logged in, redirect them away from auth screens to Home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070709] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-xs antialiased font-semibold">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-violet-600/10 via-[#070709] to-indigo-600/10 blur-[80px] pointer-events-none select-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none select-none" />

      <div className="w-full max-w-md space-y-8 bg-card border border-border/40 p-8 rounded-3xl shadow-2xl glassmorphism z-10 premium-glow">
        <div className="flex flex-col items-center select-none">
          <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-widest text-foreground uppercase">
            <ShoppingBag className="h-6 w-6 stroke-[2]" />
            <span>ShopSphere</span>
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
