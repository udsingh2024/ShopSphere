import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import { Order } from '../types';
import { useAppDispatch } from '../store/store';
import { addToCart, toggleCart } from '../store/cartSlice';
import { 
  ShoppingBag, 
  Clock, 
  Package, 
  ArrowRight,
  Download,
  RotateCcw,
  Truck,
  MapPin,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const OrderHistory: React.FC = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const dispatch = useAppDispatch();
  const [expandedTracking, setExpandedTracking] = useState<Record<string, boolean>>({});

  // Fetch user orders
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders-my'],
    queryFn: async () => {
      const res = await api.get('/orders/my');
      return res.data.orders as Order[];
    },
  });

  // Listen for real-time status updates from Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ orderId, status }: { orderId: string; status: string }) => {
      console.log(`Order status update received: ${orderId} -> ${status}`);
      queryClient.invalidateQueries({ queryKey: ['orders-my'] });
    };

    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, [socket, queryClient]);

  const toggleTracking = (orderId: string) => {
    setExpandedTracking((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      if (item.product) {
        dispatch(addToCart({ product: item.product, quantity: item.quantity }));
      }
    });
    dispatch(toggleCart()); // Open cart drawer
  };

  const handleDownloadInvoice = (order: Order) => {
    const invoiceContent = `
==================================================
                 SHOPSPHERE INVOICE
==================================================
Order Reference: ${order._id}
Date: ${new Date(order.createdAt).toLocaleString()}
Status: ${order.orderStatus.toUpperCase()}
Payment Status: ${order.paymentInfo.status.toUpperCase()}

SHIPPING ADDRESS:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
${order.shippingAddress.country}

ITEMS PURCHASED:
${order.items.map((item) => `- ${item.product?.title || 'Unknown Item'} (Qty: ${item.quantity}) @ $${item.priceAtPurchase.toFixed(2)} ea`).join('\n')}

SUMMARY:
Subtotal: $${order.financials.subtotal.toFixed(2)}
Shipping: $${order.financials.shippingFee.toFixed(2)}
Tax: $${order.financials.tax.toFixed(2)}
Grand Total Paid: $${order.financials.total.toFixed(2)}

Thank you for choosing ShopSphere.
==================================================
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_ShopSphere_${order._id.substring(18)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  // Get index state for timeline nodes
  const getTrackingStepIndex = (status: string) => {
    const levels: Record<string, number> = {
      pending: 1,      // Placed
      processing: 3,   // Confirmed & Packed
      shipped: 4,      // Shipped
      delivered: 6,    // Out For Delivery & Delivered
    };
    return levels[status] || 1;
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h3 className="font-bold text-base text-destructive">Failed to load order history</h3>
        <p className="text-xs text-muted-foreground mt-1">Please reload page to check server connection.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 text-xs antialiased font-semibold">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Order Logs</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Track shipping progress milestones, trigger catalog reorders, and download transaction invoices.
        </p>
      </div>

      {orders?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/40 space-y-5 text-xs glassmorphism">
          <div className="mx-auto rounded-full bg-secondary p-5 w-fit text-muted-foreground shadow-xs">
            <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">No purchases recorded</h3>
            <p className="text-muted-foreground font-medium">Your platform account has no transaction logs yet.</p>
          </div>
          <Link
            to="/"
            className="inline-block rounded-xl bg-foreground text-background px-6 py-3 font-bold hover:opacity-90 transition-all shadow-md"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders?.map((order) => {
            const isTrackingOpen = expandedTracking[order._id] || false;
            const currentStepIdx = getTrackingStepIndex(order.orderStatus);

            const timelineSteps = [
              { label: 'Placed', icon: FileText, stepVal: 1 },
              { label: 'Confirmed', icon: ShieldCheck, stepVal: 2 },
              { label: 'Packed', icon: Package, stepVal: 3 },
              { label: 'Shipped', icon: Truck, stepVal: 4 },
              { label: 'Carrier Handoff', icon: MapPin, stepVal: 5 },
              { label: 'Delivered', icon: CheckCircle2, stepVal: 6 },
            ];

            return (
              <div key={order._id} className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-xs glassmorphism">
                {/* Meta details Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-secondary/20 p-5 border-b border-border/40">
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[9px] uppercase font-black text-muted-foreground tracking-wider">
                    <div>
                      <span>Date Placed</span>
                      <span className="font-extrabold text-foreground block mt-0.5 font-mono">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>Reference ID</span>
                      <span className="font-mono text-foreground block mt-0.5">{order._id.substring(18)}</span>
                    </div>
                    <div>
                      <span>Total Due</span>
                      <span className="font-black text-foreground block mt-0.5 font-mono">${order.financials.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-xl border px-3 py-1 text-[8px] font-black uppercase tracking-wider shadow-2xs", getStatusBadgeClass(order.orderStatus))}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Items & details */}
                <div className="p-5 space-y-4">
                  <div className="divide-y divide-border/30">
                    {order.items.map((item) => (
                      <div key={item._id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0 items-center">
                        <img
                          src={item.product?.images[0]?.url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=100&q=80'}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-border/40 shrink-0 bg-background"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="font-extrabold text-foreground truncate uppercase text-[10px]">{item.product?.title || 'Catalog Product'}</h4>
                          <p className="text-muted-foreground font-medium text-[9px]">Quantity Selected: {item.quantity}</p>
                        </div>
                        <span className="font-extrabold text-foreground shrink-0 font-mono">
                          ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap justify-between items-center gap-3 border-t border-border/30 pt-4 text-xs font-bold">
                    <button
                      onClick={() => toggleTracking(order.orderStatus === 'cancelled' ? '' : order._id)}
                      disabled={order.orderStatus === 'cancelled'}
                      className="flex items-center gap-1.5 text-foreground hover:bg-secondary/40 px-3 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[9px] tracking-widest border border-border/60"
                    >
                      <span>Track Shipment</span>
                      {isTrackingOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        className="flex items-center gap-1 hover:bg-secondary/40 border border-border/60 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        title="Download Text Invoice"
                      >
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Invoice</span>
                      </button>
                      <button
                        onClick={() => handleReorder(order)}
                        className="flex items-center gap-1 bg-foreground text-background px-3.5 py-2 rounded-xl hover:opacity-90 transition-all shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. ORDER TRACKING TIMELINE EXPANDER */}
                  <AnimatePresence>
                    {isTrackingOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border/30 pt-5 mt-4"
                      >
                        <div className="relative py-4 flex flex-col sm:flex-row justify-between gap-6 max-w-2xl mx-auto items-center">
                          {/* Animated progress connecting bar */}
                          <div className="absolute left-[13px] sm:left-4 sm:right-4 top-4 bottom-4 sm:bottom-auto sm:top-1/2 h-full sm:h-[1px] w-0.5 sm:w-full bg-border/40 -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2 z-0" />
                          <div 
                            className="absolute left-[13px] sm:left-4 sm:right-4 top-4 bottom-4 sm:bottom-auto sm:top-1/2 h-full sm:h-[1px] w-0.5 sm:w-full bg-foreground -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2 z-0 origin-top sm:origin-left transition-all duration-500"
                            style={{ 
                              height: window.innerWidth < 640 ? `${((currentStepIdx - 1) / 5) * 100}%` : '1px',
                              width: window.innerWidth >= 640 ? `${((currentStepIdx - 1) / 5) * 100}%` : '2px'
                            }}
                          />

                          {timelineSteps.map((stepNode) => {
                            const isNodeActive = stepNode.stepVal <= currentStepIdx;
                            const IconNode = stepNode.icon;
                            return (
                              <div key={stepNode.label} className="relative z-10 flex sm:flex-col items-center gap-3.5 sm:gap-2 text-[8px] font-black uppercase tracking-widest w-full sm:w-auto">
                                <div 
                                  className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-300",
                                    isNodeActive 
                                      ? 'bg-foreground border-foreground text-background shadow-xs'
                                      : 'bg-card border-border/60 text-muted-foreground'
                                  )}
                                >
                                  <IconNode className="h-3.5 w-3.5 stroke-[1.75]" />
                                </div>
                                <span className={isNodeActive ? 'text-foreground' : 'text-zinc-500'}>
                                  {stepNode.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
