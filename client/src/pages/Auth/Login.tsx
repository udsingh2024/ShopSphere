import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/store';
import { setCredentials } from '../../store/authSlice';
import api from '../../services/api';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean(),
});

type LoginInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInputs) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data;
      dispatch(setCredentials({ user, accessToken }));
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // Simulate/mock a decoded Google Credential Token payload for full backend registration test
      const payloadObj = {
        sub: `google_user_${Date.now()}`,
        email: 'google.user@gmail.com',
        name: 'Google Customer',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80',
      };
      // Base64 encode the payload to match JWT structure
      const payloadBase64 = btoa(JSON.stringify(payloadObj));
      const mockGoogleToken = `header.${payloadBase64}.signature`;

      const response = await api.post('/auth/google', { token: mockGoogleToken });
      const { user, accessToken } = response.data;
      dispatch(setCredentials({ user, accessToken }));
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Google Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs antialiased font-semibold">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black tracking-wider text-foreground uppercase">Sign In</h2>
        <p className="text-[10px] text-muted-foreground font-medium">
          Welcome back to ShopSphere. Sign in to check your order logs.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive border border-destructive/20 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1">
          <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
            <input
              type="email"
              {...register('email')}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Password</label>
            <Link to="/auth/forgot-password" className="text-[8px] font-black text-foreground/80 hover:underline uppercase tracking-wider">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-10 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4 stroke-[1.5]" /> : <Eye className="h-4 w-4 stroke-[1.5]" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Remember Me Check */}
        <div className="flex items-center gap-2 py-1">
          <input
            id="rememberMe"
            type="checkbox"
            {...register('rememberMe')}
            className="h-3.5 w-3.5 rounded border-border/60 bg-background text-foreground focus:ring-0 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-[10px] font-bold text-muted-foreground select-none cursor-pointer">
            Keep me logged in for 7 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-foreground text-background py-3 text-center text-xs font-bold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer uppercase tracking-wider"
        >
          {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
        </button>
      </form>

      {/* Separator */}
      <div className="relative flex items-center justify-center my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40"></div>
        </div>
        <span className="relative bg-card px-3 text-[8px] uppercase font-black text-muted-foreground tracking-widest">Or continue with</span>
      </div>

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-2.5 text-xs font-bold hover:bg-secondary/40 transition-all cursor-pointer uppercase tracking-wider"
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.842.95 15.08 0 12 0 7.33 0 3.298 2.69 1.34 6.627l3.927 3.138z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.275c0-.818-.073-1.636-.218-2.436H12v4.618h6.473a5.53 5.53 0 0 1-2.4 3.636l3.755 2.91c2.19-2.02 3.663-4.99 3.663-8.728z"
          />
          <path
            fill="#FBBC05"
            d="M5.266 14.235a7.1 7.1 0 0 1 0-4.47l-3.926-3.14a11.96 11.96 0 0 0 0 10.748l3.926-3.138z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.755-2.91c-1.04.7-2.38 1.11-4.205 1.11-3.218 0-5.945-2.17-6.918-5.1.002.002-3.926 3.138-3.926 3.138C3.298 21.31 7.33 24 12 24z"
          />
        </svg>
        <span>Google Account</span>
      </button>

      <div className="text-center pt-2">
        <p className="text-[10px] text-muted-foreground font-medium">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="font-bold text-foreground hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
