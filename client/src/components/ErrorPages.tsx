import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, WifiOff, Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. 404 Not Found
export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 text-xs antialiased font-semibold">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md bg-card border border-border/40 p-8 rounded-3xl shadow-xs space-y-6 flex flex-col items-center glassmorphism premium-glow"
      >
        <div className="rounded-2xl bg-foreground/5 border border-foreground/10 p-4 text-foreground/80">
          <AlertCircle className="h-7 w-7 stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-foreground uppercase tracking-wider">Sphere Not Found</h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto font-medium">
            The page coordinate you requested does not exist or has been relocated to another category directory.
          </p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 bg-foreground text-background font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-xs uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
      </motion.div>
    </div>
  );
};

// 2. 500 Server Error
export const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 text-xs antialiased font-semibold">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md bg-card border border-border/40 p-8 rounded-3xl shadow-xs space-y-6 flex flex-col items-center glassmorphism premium-glow"
      >
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-destructive">
          <AlertTriangle className="h-7 w-7 stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-foreground uppercase tracking-wider">Database Error</h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto font-medium">
            Our API server encountered a local index connection failure. Please confirm local database and daemon processes are active.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-foreground text-background font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
        >
          Reload Session
        </button>
      </motion.div>
    </div>
  );
};

// 3. Maintenance Page
export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 text-xs antialiased font-semibold">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md bg-card border border-border/40 p-8 rounded-3xl shadow-xs space-y-6 flex flex-col items-center glassmorphism premium-glow"
      >
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-500">
          <Settings className="h-7 w-7 animate-spin stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-foreground uppercase tracking-wider">Scheduled Maintenance</h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto font-medium">
            ShopSphere vector search engines are undergoing index caching. Check back shortly for luxury visual results.
          </p>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider bg-secondary px-3 py-1 rounded-full border border-border/40">Estimated Uptime: 15 minutes</span>
      </motion.div>
    </div>
  );
};

// 4. Offline Page
export const OfflinePage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 text-xs antialiased font-semibold">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md bg-card border border-border/40 p-8 rounded-3xl shadow-xs space-y-6 flex flex-col items-center glassmorphism premium-glow"
      >
        <div className="rounded-2xl bg-secondary border border-border/60 p-4 text-muted-foreground">
          <WifiOff className="h-7 w-7 animate-pulse stroke-[1.5]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-black text-foreground uppercase tracking-wider">Connection Terminated</h2>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto font-medium">
            You are currently offline. Check your router configuration or local Wi-Fi connectivity switches.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-foreground text-background font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
        >
          Check Connectivity
        </button>
      </motion.div>
    </div>
  );
};
