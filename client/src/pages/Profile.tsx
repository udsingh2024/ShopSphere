import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setCredentials, clearCredentials } from '../store/authSlice';
import api from '../services/api';
import { 
  User as UserIcon, 
  Settings, 
  Lock, 
  Smartphone, 
  Trash2, 
  Camera, 
  CheckCircle, 
  ShoppingBag, 
  Heart,
  Calendar,
  AlertCircle,
  LogOut,
  MapPin,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Validation schemas for Profile forms
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

type ProfileInputs = z.infer<typeof profileSchema>;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
const passwordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().regex(passwordRegex, {
    message: 'New password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#)',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordInputs = z.infer<typeof passwordSchema>;

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'password' | 'sessions'>('overview');
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || '',
      country: user?.address?.country || '',
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm<PasswordInputs>({
    resolver: zodResolver(passwordSchema),
  });

  // Query: Sessions list
  const { data: sessions, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const res = await api.get('/auth/sessions');
      return res.data.sessions;
    },
    enabled: activeTab === 'sessions',
  });

  // Mutation: Revoke Session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/auth/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
      setFormSuccess('Device session successfully revoked');
    }
  });

  // Mutation: Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/auth/account');
    },
    onSuccess: () => {
      dispatch(clearCredentials());
      navigate('/');
    }
  });

  // Profile update submission
  const onProfileSubmit = async (data: ProfileInputs) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      const response = await api.put('/auth/profile', data);
      dispatch(setCredentials({ user: response.data.user, accessToken: api.defaults.headers.common.Authorization?.toString().split(' ')[1] || '' }));
      setFormSuccess('Profile details updated successfully!');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update profile information.');
    }
  };

  // Password change submission
  const onPasswordSubmit = async (data: PasswordInputs) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      await api.put('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      setFormSuccess('Password changed successfully! Other devices have been logged out.');
      resetPasswordForm();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to change password. Double check credentials.');
    }
  };

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.put('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (user) {
        dispatch(setCredentials({ 
          user: { ...user, avatar: res.data.avatar }, 
          accessToken: api.defaults.headers.common.Authorization?.toString().split(' ')[1] || '' 
        }));
      }
      setFormSuccess('Avatar uploaded successfully!');
    } catch (err: any) {
      setAvatarUploadError(err.response?.data?.message || 'Avatar upload failed.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const triggerAvatarInput = () => {
    fileInputRef.current?.click();
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long' }) : 'July 2026';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 text-xs antialiased font-semibold">
      {/* HEADER HERO AREA */}
      <div className="relative rounded-3xl overflow-hidden bg-card border border-border/40 shadow-xs premium-glow">
        <div className="h-36 bg-gradient-to-r from-violet-600/20 via-[#070709] to-indigo-600/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex gap-5 items-center relative -mt-16 sm:-mt-20">
            {/* Avatar block */}
            <div className="relative group cursor-pointer" onClick={triggerAvatarInput}>
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-card object-cover bg-background shadow-lg" />
              ) : (
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-4 border-card bg-foreground text-background text-3xl font-black shadow-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
              {avatarUploading ? (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            
            <div className="pt-2 sm:pt-4 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-wider">{user?.name}</h1>
              <p className="text-[9px] text-primary uppercase font-bold tracking-widest bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded-full w-fit">{user?.role} Profile Account</p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-center text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground uppercase font-black text-[8px] tracking-widest block">Purchased</span>
              <span className="text-base font-black text-foreground flex items-center justify-center gap-1.5 font-mono">
                <ShoppingBag className="h-4 w-4 text-foreground/80" />
                <span>3</span>
              </span>
            </div>
            <div className="space-y-1 border-l border-border/40 pl-8">
              <span className="text-muted-foreground uppercase font-black text-[8px] tracking-widest block">Collection</span>
              <span className="text-base font-black text-foreground flex items-center justify-center gap-1.5 font-mono">
                <Heart className="h-4 w-4 text-foreground/80" />
                <span>5</span>
              </span>
            </div>
            <div className="space-y-1 border-l border-border/40 pl-8 text-left">
              <span className="text-muted-foreground uppercase font-black text-[8px] tracking-widest block">Joined</span>
              <span className="text-xs font-black text-foreground flex items-center gap-1.5 mt-1 font-mono">
                <Calendar className="h-4 w-4 text-foreground/80" />
                <span>{memberSince}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK CARDS */}
      <AnimatePresence>
        {avatarUploadError && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{avatarUploadError}</span>
          </motion.div>
        )}
        {formError && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        )}
        {formSuccess && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 p-3.5 text-xs font-bold text-emerald-500 border border-emerald-500/20">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{formSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Tab options sidebar */}
        <div className="md:col-span-3 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none bg-card/45 p-1 rounded-2xl border border-border/40">
          <button
            onClick={() => { setActiveTab('overview'); setFormSuccess(null); setFormError(null); }}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap w-full text-left uppercase tracking-wider ${
              activeTab === 'overview' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Overview Details</span>
          </button>
          <button
            onClick={() => { setActiveTab('edit'); setFormSuccess(null); setFormError(null); }}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap w-full text-left uppercase tracking-wider ${
              activeTab === 'edit' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => { setActiveTab('password'); setFormSuccess(null); setFormError(null); }}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap w-full text-left uppercase tracking-wider ${
              activeTab === 'password' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Access Lock</span>
          </button>
          <button
            onClick={() => { setActiveTab('sessions'); setFormSuccess(null); setFormError(null); }}
            className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap w-full text-left uppercase tracking-wider ${
              activeTab === 'sessions' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Session Audit</span>
          </button>
        </div>

        {/* Tab View Container */}
        <div className="md:col-span-9 bg-card border border-border/40 rounded-3xl p-6 shadow-xs min-h-[350px] glassmorphism">
          <AnimatePresence mode="wait">
            
            {/* 1. OVERVIEW VIEW */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-xs"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Overview Details</h3>
                  <p className="text-muted-foreground text-xs font-medium">Verify your registered account values and authentication flags.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-border/40 bg-secondary/10 p-4 rounded-2xl space-y-1">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Registered Email</span>
                    <p className="font-extrabold text-foreground text-sm">{user?.email}</p>
                  </div>
                  <div className="border border-border/40 bg-secondary/10 p-4 rounded-2xl space-y-1">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Identity Verified</span>
                    <p className="font-extrabold text-emerald-500 text-sm flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      <span>{user?.emailVerified ? 'Email Verification Verified' : 'Unverified Identity'}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wide">Activity Logs</h4>
                  <div className="space-y-2 font-mono text-[9px]">
                    <div className="flex justify-between items-center bg-secondary/15 border border-border/40 p-3 rounded-xl">
                      <span>Logged in successfully from Chrome PC</span>
                      <span className="text-muted-foreground font-semibold">Just now</span>
                    </div>
                    <div className="flex justify-between items-center bg-secondary/15 border border-border/40 p-3 rounded-xl">
                      <span>Sync session configuration</span>
                      <span className="text-muted-foreground font-semibold">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. EDIT PROFILE VIEW */}
            {activeTab === 'edit' && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-xs"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Demographic Details</h3>
                  <p className="text-muted-foreground text-xs font-medium">Update name, phone number, and mailing address.</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        {...registerProfile('name')}
                        className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                      />
                      {profileErrors.name && <p className="text-xs text-destructive">{profileErrors.name.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Phone Number</label>
                      <input
                        type="text"
                        {...registerProfile('phone')}
                        className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-5 mt-4 space-y-4">
                    <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-foreground/80" />
                      <span>Address Information</span>
                    </h4>

                    <div className="space-y-1">
                      <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Street Address</label>
                      <input
                        type="text"
                        {...registerProfile('street')}
                        className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">City</label>
                        <input
                          type="text"
                          {...registerProfile('city')}
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">State / Province</label>
                        <input
                          type="text"
                          {...registerProfile('state')}
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Zip / Postal Code</label>
                        <input
                          type="text"
                          {...registerProfile('zipCode')}
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Country</label>
                        <input
                          type="text"
                          {...registerProfile('country')}
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-foreground text-background px-6 py-3 font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer text-xs"
                  >
                    Save Profile Details
                  </button>
                </form>
              </motion.div>
            )}

            {/* 3. CHANGE PASSWORD VIEW */}
            {activeTab === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-xs"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Change Password</h3>
                  <p className="text-muted-foreground text-xs font-medium">Configure a strong password. Changing password logouts other devices.</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Current Password</label>
                    <input
                      type="password"
                      required
                      {...registerPassword('oldPassword')}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                    />
                    {passwordErrors.oldPassword && <p className="text-xs text-destructive">{passwordErrors.oldPassword.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">New Password</label>
                    <input
                      type="password"
                      required
                      {...registerPassword('newPassword')}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                    />
                    {passwordErrors.newPassword && <p className="text-xs text-destructive leading-relaxed">{passwordErrors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      {...registerPassword('confirmPassword')}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                    />
                    {passwordErrors.confirmPassword && <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-foreground text-background px-6 py-3 font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer text-xs"
                  >
                    Change Password
                  </button>
                </form>
              </motion.div>
            )}

            {/* 4. SESSIONS MANAGER VIEW */}
            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-xs"
              >
                <div className="flex justify-between items-center border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Session Audit Log</h3>
                    <p className="text-muted-foreground text-xs font-medium">Review active device connections and terminate unrecognized devices.</p>
                  </div>
                  <button
                    onClick={() => refetchSessions()}
                    className="px-4 py-2 hover:bg-secondary border border-border/60 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-4">
                  {sessions?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border border-border/40 p-4.5 rounded-2xl bg-secondary/5">
                      <div className="flex gap-3 items-center">
                        <div className="rounded-xl border border-foreground/10 bg-secondary p-2.5 text-foreground shadow-xs">
                          <Smartphone className="h-5 w-5 stroke-[1.5]" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-foreground flex items-center gap-2">
                            <span>{s.deviceInfo}</span>
                            {s.isCurrent && (
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[8px] font-black text-emerald-500 uppercase tracking-wider">
                                Current Device
                              </span>
                            )}
                          </p>
                          <p className="text-muted-foreground text-[10px] font-medium">
                            IP Address: <span className="font-mono text-foreground font-bold">{s.ipAddress}</span> &bull; Active: {new Date(s.lastActive).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {!s.isCurrent && (
                        <button
                          onClick={() => revokeSessionMutation.mutate(s.id)}
                          className="flex items-center gap-1.5 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 p-2.5 px-3.5 rounded-xl font-bold transition-all cursor-pointer text-[10px]"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Account termination block */}
                <div className="border-t border-destructive/20 pt-6 mt-8 space-y-4 bg-destructive/5 p-5 rounded-2xl border border-destructive/10">
                  <div className="space-y-1">
                    <h4 className="font-black text-destructive text-sm uppercase tracking-wide">Danger Zone</h4>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                      Deleting your account will erase all transactional files, wishlist logs, and login session history. This action is irreversible.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-1.5 bg-destructive hover:bg-destructive/95 text-white font-bold py-3 px-5 rounded-xl shadow-md cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-card border border-border/50 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex gap-3.5 items-start text-xs text-foreground">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Confirm Account Erasure</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  This action permanently closes your ShopSphere account. A confirmation email will be sent to your email, and you will be immediately logged out.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-border/60 px-5 py-2.5 font-bold hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  deleteAccountMutation.mutate();
                }}
                className="rounded-xl bg-destructive px-5 py-2.5 font-bold text-white hover:bg-destructive/95 shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
