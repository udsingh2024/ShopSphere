import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/store';
import { clearCart } from '../store/cartSlice';
import api from '../services/api';
import { 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  MapPin, 
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Tag,
  Plus,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const addressSchema = z.object({
  street: z.string().min(2, { message: 'Street address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().min(2, { message: 'State/Province is required' }),
  zipCode: z.string().regex(/^[1-9][0-9]{5}$|^[0-9]{5}(-[0-9]{4})?$/, { 
    message: 'Invalid pin/postal code format (e.g. 560001 or 94103)' 
  }),
  country: z.string().min(2, { message: 'Country is required' }),
});

type AddressInputs = z.infer<typeof addressSchema>;

interface SavedAddress {
  _id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const Checkout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);

  // Connection & Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address variables
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Coupon variables
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Shipping & Step controls
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'priority' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');

  // Address creation form Hook
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressInputs>({
    resolver: zodResolver(addressSchema),
  });

  // Calculate pricing elements
  const subtotal = cartItems.reduce(
    (total, item) => total + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  );

  // Shipping fees
  const shippingFees = {
    standard: subtotal > 100 ? 0 : 10,
    priority: 10,
    express: 25,
  };

  const activeShippingFee = shippingFees[shippingMethod];

  // Coupon Discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount > 0 && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.discountType === 'flat') {
      discountAmount = appliedCoupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const tax = Math.round((subtotal - discountAmount) * 0.08 * 100) / 100;
  const total = Math.round((subtotal - discountAmount + activeShippingFee + tax) * 100) / 100;

  // Estimated Arrival Dates
  const getDeliveryDateString = (method: string) => {
    const date = new Date();
    if (method === 'express') date.setDate(date.getDate() + 1);
    else if (method === 'priority') date.setDate(date.getDate() + 3);
    else date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // 1. Fetch user addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        const addrList = res.data.addresses as SavedAddress[];
        setAddresses(addrList);
        
        // Auto-select default address
        const def = addrList.find((a) => a.isDefault);
        if (def) {
          setSelectedAddressId(def._id);
        } else if (addrList.length > 0) {
          setSelectedAddressId(addrList[0]._id);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err);
      }
    };
    fetchAddresses();
  }, []);

  // Razorpay dynamic script loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Add Address Action
  const onSaveNewAddress = async (data: AddressInputs) => {
    try {
      const res = await api.post('/addresses', data);
      const updated = res.data.addresses as SavedAddress[];
      setAddresses(updated);
      setIsAddingNewAddress(false);
      reset();

      // Select newly added address
      const added = updated[updated.length - 1];
      if (added) setSelectedAddressId(added._id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save address');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/addresses/${id}`);
      setAddresses(res.data.addresses);
      if (selectedAddressId === id) setSelectedAddressId('');
    } catch (err) {
      console.error('Delete address failed:', err);
    }
  };

  // Apply Coupon Action
  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;

    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.trim(),
        purchaseAmount: subtotal,
      });
      setAppliedCoupon(res.data);
      setCouponSuccess(`Coupon code applied: $${res.data.discountAmount.toFixed(2)} savings!`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Invalid Coupon Code');
    }
  };

  // Navigation Steps
  const nextStep = () => {
    if (step === 1 && !selectedAddressId) {
      setErrorMsg('Please select or add a shipping address to proceed');
      return;
    }
    setErrorMsg(null);
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Place Order submission
  const handleOrderSubmission = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const activeAddress = addresses.find((a) => a._id === selectedAddressId);
    if (!activeAddress) {
      setErrorMsg('Invalid shipping address selected');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Check if Cash on Delivery or Online Payment via Razorpay
      if (paymentMethod === 'cod') {
        const payload = {
          items: cartItems.map((item) => ({
            product: item.product._id,
            quantity: item.quantity,
          })),
          shippingAddress: {
            street: activeAddress.street,
            city: activeAddress.city,
            state: activeAddress.state,
            zipCode: activeAddress.zipCode,
            country: activeAddress.country,
          },
          shippingMethod,
          couponCode: appliedCoupon?.code || undefined,
        };

        const res = await api.post('/payments/verify', payload);
        dispatch(clearCart());
        setOrderSuccess(res.data.order._id);
        confetti({ particleCount: 150, spread: 80 });
      } else {
        // Online Payment via Razorpay
        // A. Create Razorpay order on backend
        const orderRes = await api.post('/payments/create-order', { amount: total });
        const { razorpayOrderId, amount: rzpAmount, currency, key } = orderRes.data;

        // B. Load Razorpay script
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          setErrorMsg('Failed to initialize Razorpay checkout sdk. Please check internet connection.');
          setIsSubmitting(false);
          return;
        }

        // C. Launch payment window options
        const options = {
          key,
          amount: rzpAmount,
          currency,
          name: 'ShopSphere Systems',
          description: `ShopSphere Checkout Order Total: $${total.toFixed(2)}`,
          order_id: razorpayOrderId,
          handler: async (response: any) => {
            try {
              const payload = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                items: cartItems.map((item) => ({
                  product: item.product._id,
                  quantity: item.quantity,
                })),
                shippingAddress: {
                  street: activeAddress.street,
                  city: activeAddress.city,
                  state: activeAddress.state,
                  zipCode: activeAddress.zipCode,
                  country: activeAddress.country,
                },
                shippingMethod,
                couponCode: appliedCoupon?.code || undefined,
              };

              const verifyRes = await api.post('/payments/verify', payload);
              dispatch(clearCart());
              setOrderSuccess(verifyRes.data.order._id);
              confetti({ particleCount: 200, spread: 100 });
            } catch (err: any) {
              setErrorMsg(err.response?.data?.message || 'Payment signature verification failed.');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#6366f1',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Fulfillment transaction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-6 text-xs">
        <div className="flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-5 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-16 w-16" />
          </div>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Order Dispatched!</h2>
        <p className="text-muted-foreground text-[11px] max-w-sm mx-auto leading-relaxed">
          Transaction successfully confirmed. Your invoice ID is <span className="font-mono font-bold text-foreground">{orderSuccess}</span>. A copy of the PDF invoice statement has been emailed to you.
        </p>
        <div className="flex justify-center gap-4 pt-4 text-xs font-bold">
          <Link
            to="/orders"
            className="rounded-xl bg-primary px-6 py-3.5 text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
          >
            Track Shipment Status
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-border bg-card px-6 py-3.5 hover:bg-secondary/40 transition-colors"
          >
            Continue Catalog Shop
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4 text-xs">
        <h2 className="text-lg font-bold">Your checkout cart is empty</h2>
        <p className="text-muted-foreground">Select items from our vector catalogs to continue.</p>
        <Link to="/" className="inline-block rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const stepsList = ['Addresses', 'Shipping Method', 'Payment Mode', 'Verify Details'];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 text-xs antialiased font-semibold">
      {/* 1. PROGRESS BAR / STEP INDICATOR */}
      <div className="relative max-w-xl mx-auto py-6">
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-border/40 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-foreground -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
        />
        <div className="relative z-10 flex justify-between">
          {stepsList.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum <= step;
            return (
              <div key={label} className="flex flex-col items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs transition-all duration-300 ${
                    stepNum === step 
                      ? 'bg-foreground text-background border-foreground ring-4 ring-foreground/10'
                      : isActive 
                        ? 'bg-foreground border-foreground text-background'
                        : 'bg-card border-border/60 text-muted-foreground'
                  }`}
                >
                  {stepNum}
                </div>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground/80'}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Secure Checkout Portal</h1>
        <p className="text-muted-foreground text-xs font-medium">Verify your logistic items, shipping paths, and secure transaction details.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-destructive/10 p-4 text-xs font-bold text-destructive border border-destructive/20 max-w-xl mx-auto">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-5xl mx-auto items-start">
        {/* LEFT COLUMN: STEPS PAGES */}
        <div className="lg:col-span-7 bg-card p-6 rounded-3xl border border-border/40 min-h-[380px] flex flex-col justify-between shadow-xs glassmorphism">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: ADDRESS MANAGEMENT */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <h2 className="text-xs font-black flex justify-between items-center border-b border-border/40 pb-3 uppercase tracking-wider text-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-foreground/80" />
                    <span>Select Shipping Destination</span>
                  </span>
                  {!isAddingNewAddress && (
                    <button
                      onClick={() => setIsAddingNewAddress(true)}
                      className="flex items-center gap-1 text-[9px] text-primary font-black hover:underline cursor-pointer uppercase tracking-wider"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add New</span>
                    </button>
                  )}
                </h2>

                {isAddingNewAddress ? (
                  <form onSubmit={handleSubmit(onSaveNewAddress)} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">Street Address</label>
                      <input
                        type="text"
                        {...register('street')}
                        placeholder="123 Corporate Lane, Suite 400"
                        className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                      />
                      {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">City</label>
                        <input
                          type="text"
                          {...register('city')}
                          placeholder="Bangalore"
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                        {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">State</label>
                        <input
                          type="text"
                          {...register('state')}
                          placeholder="Karnataka"
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                        {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">Postal / Zip Code</label>
                        <input
                          type="text"
                          {...register('zipCode')}
                          placeholder="560001"
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                        {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">Country</label>
                        <input
                          type="text"
                          {...register('country')}
                          placeholder="India"
                          className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                        />
                        {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-3 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="rounded-xl border border-border/60 px-4 py-2 hover:bg-secondary/40 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-foreground text-background px-4 py-2 font-bold hover:opacity-90"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                    {addresses.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground font-semibold">
                        No saved addresses found. Please add a shipping destination to proceed.
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddressId(addr._id)}
                          className={`flex justify-between items-start border p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                            selectedAddressId === addr._id
                              ? 'border-foreground bg-secondary/30 shadow-xs'
                              : 'border-border/60 hover:bg-secondary/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shipping_addr"
                              checked={selectedAddressId === addr._id}
                              onChange={() => setSelectedAddressId(addr._id)}
                              className="h-4 w-4 mt-0.5 text-foreground accent-foreground focus:ring-0"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground">{addr.street}</p>
                                {addr.isDefault && (
                                  <span className="rounded-full bg-foreground/10 border border-foreground/20 text-foreground text-[7px] px-2 py-0.5 font-bold font-mono">DEFAULT</span>
                                )}
                              </div>
                              <p className="text-muted-foreground text-[10px] font-medium">
                                {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteAddress(addr._id, e)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Delete Address"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: SHIPPING PLAN SELECTOR */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-black flex items-center gap-2 border-b border-border/40 pb-3 uppercase tracking-wider text-foreground">
                  <Truck className="h-4 w-4 text-foreground/80" />
                  <span>Choose Delivery Shipping Method</span>
                </h2>

                <div className="grid grid-cols-1 gap-3.5">
                  <label className={`flex justify-between items-center border p-4.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    shippingMethod === 'standard' ? 'border-foreground bg-secondary/30' : 'border-border/60 hover:bg-secondary/20'
                  }`}>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="radio" 
                        value="standard" 
                        checked={shippingMethod === 'standard'} 
                        onChange={() => setShippingMethod('standard')} 
                        className="h-4 w-4 text-foreground accent-foreground" 
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-foreground">Standard Delivery</p>
                          <span className="flex items-center gap-1 text-[8px] text-muted-foreground font-mono">
                            <Calendar className="h-3 w-3" />
                            {getDeliveryDateString('standard')}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">Arrives in 5-7 business days via basic postal channels</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-500 font-mono">
                      {subtotal > 100 ? 'FREE' : '$10.00'}
                    </span>
                  </label>

                  <label className={`flex justify-between items-center border p-4.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    shippingMethod === 'priority' ? 'border-foreground bg-secondary/30' : 'border-border/60 hover:bg-secondary/20'
                  }`}>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="radio" 
                        value="priority" 
                        checked={shippingMethod === 'priority'} 
                        onChange={() => setShippingMethod('priority')} 
                        className="h-4 w-4 text-foreground accent-foreground" 
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-foreground">Priority Express</p>
                          <span className="flex items-center gap-1 text-[8px] text-muted-foreground font-mono">
                            <Calendar className="h-3 w-3" />
                            {getDeliveryDateString('priority')}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">Arrives in 2-3 business days via priority logistics</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono">$10.00</span>
                  </label>

                  <label className={`flex justify-between items-center border p-4.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    shippingMethod === 'express' ? 'border-foreground bg-secondary/30' : 'border-border/60 hover:bg-secondary/20'
                  }`}>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="radio" 
                        value="express" 
                        checked={shippingMethod === 'express'} 
                        onChange={() => setShippingMethod('express')} 
                        className="h-4 w-4 text-foreground accent-foreground" 
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-foreground">Express Priority</p>
                          <span className="flex items-center gap-1 text-[8px] text-emerald-500 font-extrabold animate-pulse">
                            <Sparkles className="h-3 w-3" />
                            {getDeliveryDateString('express')}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium">Arrives in 24 hours guaranteed via priority carrier routes</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono">$25.00</span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT METHOD */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-black flex items-center gap-2 border-b border-border/40 pb-3 uppercase tracking-wider text-foreground">
                  <CreditCard className="h-4 w-4 text-foreground/80" />
                  <span>Choose Payment Method</span>
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex flex-col items-center gap-2 border p-5 rounded-2xl cursor-pointer text-center transition-all duration-300 ${
                    paymentMethod === 'online' ? 'border-foreground bg-secondary/30 shadow-xs' : 'border-border/60 hover:bg-secondary/20'
                  }`}>
                    <input 
                      type="radio" 
                      name="pay_mode" 
                      checked={paymentMethod === 'online'} 
                      onChange={() => setPaymentMethod('online')} 
                      className="hidden" 
                    />
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'online' ? 'text-foreground' : 'text-muted-foreground/60'}`} />
                    <span className="font-extrabold text-foreground">Razorpay Online</span>
                    <span className="text-[8px] text-muted-foreground/80 uppercase tracking-widest leading-none">Cards, UPI, Wallets</span>
                  </label>

                  <label className={`flex flex-col items-center gap-2 border p-5 rounded-2xl cursor-pointer text-center transition-all duration-300 ${
                    paymentMethod === 'cod' ? 'border-foreground bg-secondary/30 shadow-xs' : 'border-border/60 hover:bg-secondary/20'
                  }`}>
                    <input 
                      type="radio" 
                      name="pay_mode" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')} 
                      className="hidden" 
                    />
                    <ShoppingBag className={`h-6 w-6 ${paymentMethod === 'cod' ? 'text-foreground' : 'text-muted-foreground/60'}`} />
                    <span className="font-extrabold text-foreground">Cash On Delivery</span>
                    <span className="text-[8px] text-muted-foreground/80 uppercase tracking-widest leading-none">Pay on courier arrival</span>
                  </label>
                </div>

                <div className="border border-border/40 p-4 rounded-2xl bg-secondary/5 font-medium leading-relaxed text-muted-foreground">
                  {paymentMethod === 'online' ? (
                    <p>Secured via industry-standard PCI-compliant <strong>Razorpay gateway encryption</strong>. UPI handles instant mobile transactions. Cards support major bank accounts.</p>
                  ) : (
                    <p>An additional cash collection service of <strong>COD</strong> is handled by courier. Please ensure exact payment values are available on arrival date.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW DETAILS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-xs font-black flex items-center gap-2 border-b border-border/40 pb-3 uppercase tracking-wider text-foreground">
                  <ShieldCheck className="h-4 w-4 text-foreground/80" />
                  <span>Review Final Logistics</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-border/40 p-4 rounded-2xl bg-secondary/5 space-y-1">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">Shipping Destination</span>
                    <p className="font-bold text-foreground">
                      {addresses.find((a) => a._id === selectedAddressId)?.street}
                    </p>
                    <p className="text-muted-foreground text-[10px] font-medium">
                      {addresses.find((a) => a._id === selectedAddressId)?.city}, {addresses.find((a) => a._id === selectedAddressId)?.state} {addresses.find((a) => a._id === selectedAddressId)?.zipCode}
                    </p>
                  </div>

                  <div className="border border-border/40 p-4 rounded-2xl bg-secondary/5 space-y-1">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider">Billing Mode</span>
                    <p className="font-extrabold text-foreground uppercase tracking-wide">
                      {paymentMethod === 'online' ? 'Razorpay Online payment' : 'COD Payment on Delivery'}
                    </p>
                  </div>
                </div>

                <div className="border border-border/40 p-4 rounded-2xl flex justify-between items-center bg-secondary/5">
                  <div>
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Shipping Mode</span>
                    <p className="font-bold text-foreground capitalize mt-0.5">
                      {shippingMethod} Shipping Plan
                    </p>
                  </div>
                  <span className="font-extrabold text-foreground font-mono">
                    Estimated Arrival: {getDeliveryDateString(shippingMethod)}
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Action Steppers control footer */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-border/40 text-xs font-bold">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 border border-border/60 bg-card hover:bg-secondary/40 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 bg-foreground text-background px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOrderSubmission}
                disabled={isSubmitting}
                className="bg-foreground text-background px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-md cursor-pointer flex items-center gap-2 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>Authorize Transaction (${total.toFixed(2)})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TICKET ORDER SUMMARY */}
        <div className="lg:col-span-5 space-y-6">
          {/* Products Summary box */}
          <div className="bg-card p-6 rounded-3xl border border-border/40 space-y-6 shadow-sm glassmorphism">
            <h2 className="text-xs font-black flex items-center gap-2 border-b border-border/40 pb-3 uppercase tracking-wider text-foreground">
              <ShoppingBag className="h-4 w-4 text-foreground/80" />
              <span>Checkout Items ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
            </h2>

            {/* Cart products */}
            <div className="max-h-56 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {cartItems.map((item) => {
                const itemPrice = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
                return (
                  <div key={item.product._id} className="flex justify-between items-center gap-3 text-xs">
                    <div className="flex gap-2.5 items-center min-w-0">
                      <img src={item.product.images[0]?.url} alt="" className="h-9 w-9 object-cover rounded-lg border border-border/40 shrink-0 bg-background" />
                      <div className="truncate space-y-0.5">
                        <p className="font-extrabold text-foreground truncate uppercase text-[10px]">{item.product.title}</p>
                        <p className="text-muted-foreground text-[9px] font-semibold">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-foreground shrink-0 font-mono">${(itemPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Coupon codes selector */}
            <div className="border-t border-border/40 pt-4 space-y-2">
              <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Apply Promo Coupon</span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background/50 pl-9 pr-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary uppercase font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="rounded-xl border border-border/60 px-4 py-2 hover:bg-secondary/40 font-bold cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[10px] text-destructive font-semibold flex items-center gap-1"><AlertCircle className="h-3 w-3" />{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{couponSuccess}</p>}
            </div>

            {/* Pricing Details */}
            <div className="border-t border-border/40 pt-4 space-y-2 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive font-bold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Shipping Fees</span>
                <span className="font-mono">{activeShippingFee === 0 ? 'Free' : `$${activeShippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Tax (8% GST)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-border/40 pt-3 text-foreground uppercase tracking-wide">
                <span>Total Payable</span>
                <span className="font-mono text-base">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
