import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Password update failed. Token might be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs antialiased font-semibold">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black tracking-wider text-foreground uppercase">Choose new password</h2>
        <p className="text-[10px] text-muted-foreground font-medium">
          Provide your new password details below. Make sure it is secure.
        </p>
      </div>

      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wide">Password updated</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium">
              Your password has been changed. You can now log in using your new credentials.
            </p>
          </div>
          <Link
            to="/auth/login"
            className="mt-2 text-xs font-bold text-foreground hover:underline uppercase tracking-wider"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive border border-destructive/20 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 stroke-[1.5]" />
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border/60 bg-background/50 pl-11 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all font-semibold"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-foreground text-background py-3 text-center text-xs font-bold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
