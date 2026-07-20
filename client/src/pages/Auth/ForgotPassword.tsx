import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to request reset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs antialiased font-semibold">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black tracking-wider text-foreground uppercase">Recover password</h2>
        <p className="text-[10px] text-muted-foreground font-medium">
          Enter your email and we'll send a secure link to reset credentials.
        </p>
      </div>

      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wide">Reset link dispatched</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed font-medium">
              Please check your inbox. If the email doesn't arrive shortly, check your spam folder.
            </p>
          </div>
          <Link
            to="/auth/login"
            className="mt-2 text-xs font-bold text-foreground hover:underline uppercase tracking-wider"
          >
            Return to login screen
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-foreground text-background py-3 text-center text-xs font-bold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? 'Sending Request...' : 'Send Recovery Email'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link to="/auth/login" className="font-bold text-[10px] text-muted-foreground hover:text-foreground hover:underline uppercase tracking-wider">
              Back to Sign In
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;
