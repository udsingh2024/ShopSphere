import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing.');
        return;
      }
      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    triggerVerification();
  }, [token]);

  return (
    <div className="space-y-6 text-center text-xs antialiased font-semibold">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-8 gap-4 select-none">
          <Loader2 className="h-9 w-9 text-foreground animate-spin" />
          <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-wider">
            {message}
          </p>
        </div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 gap-4"
        >
          <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 border border-emerald-500/20 select-none">
            <CheckCircle2 className="h-9 w-9 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">Email Verified!</h3>
            <p className="text-xs text-muted-foreground font-medium">{message}</p>
          </div>
          <Link
            to="/auth/login"
            className="mt-4 inline-block rounded-xl bg-foreground text-background px-6 py-3 text-xs font-bold hover:opacity-90 transition-all shadow-xs uppercase tracking-wider"
          >
            Sign In to ShopSphere
          </Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 gap-4"
        >
          <div className="rounded-full bg-destructive/10 p-3 text-destructive border border-destructive/20 select-none">
            <XCircle className="h-9 w-9 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wide">Verification Failed</h3>
            <p className="text-xs text-muted-foreground font-medium">{message}</p>
          </div>
          <Link
            to="/"
            className="mt-4 text-xs font-bold text-foreground hover:underline uppercase tracking-wider"
          >
            Return to Home
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default VerifyEmail;
