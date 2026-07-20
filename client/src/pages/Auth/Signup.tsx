import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Enforce strict password rules on client
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().regex(passwordRegex, {
    message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
  }),
});

type SignupInputs = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInputs) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await api.post('/auth/register', data);
      setSuccessMsg(response.data.message || 'Registration successful! Please check your email.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs antialiased font-semibold">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black tracking-wider text-foreground uppercase">Create Account</h2>
        <p className="text-[10px] text-muted-foreground font-medium">
          Register to shop securely and track active sessions.
        </p>
      </div>

      {successMsg ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 gap-4 text-center"
        >
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wide">Verification Dispatched</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium">
              {successMsg}
            </p>
          </div>
          <Link
            to="/auth/login"
            className="mt-2 text-xs font-bold text-foreground hover:underline uppercase tracking-wider"
          >
            Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <>
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive border border-destructive/20 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
                <input
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

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
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
                />
              </div>
              {errors.password && <p className="text-[10px] text-destructive leading-relaxed font-semibold mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-foreground text-background py-3 text-center text-xs font-bold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link to="/auth/login" className="font-bold text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Signup;
