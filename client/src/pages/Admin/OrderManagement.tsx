import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Order } from '../../types';
import { 
  Clock, 
  Eye, 
  AlertCircle, 
  Search, 
  Filter, 
  Printer, 
  Truck, 
  CheckCircle,
  X,
  CreditCard,
  User,
  Package
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const OrderManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  
  // Selected order details drawer state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Tracking number assignment state
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Fetch all platform orders
  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['admin-orders-list'],
    queryFn: async () => {
      const res = await api.get('/orders/admin');
      return res.data;
    },
  });

  const orders: Order[] = ordersData?.orders || [];

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    const userObj = typeof o.user === 'object' ? o.user : null;
    const nameMatch = userObj ? userObj.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const idMatch = o._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = searchQuery === '' || nameMatch || idMatch;

    const matchesStatus = statusFilter === '' || o.orderStatus === statusFilter;
    const matchesPayment = paymentFilter === '' || o.paymentInfo.status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Update order status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, tracking }: { id: string; status: string; tracking?: string }) => {
      await api.put(`/orders/${id}/status`, { orderStatus: status, trackingNumber: tracking });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-list'] });
      // Sync active drawer details
      if (selectedOrder) {
        const updated = orders.find(o => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleStatusChange = (orderId: string, nextStatus: string) => {
    statusMutation.mutate({ id: orderId, status: nextStatus });
  };

  const handleAssignTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !trackingNumberInput.trim()) return;
    statusMutation.mutate({ 
      id: selectedOrder._id, 
      status: selectedOrder.orderStatus, 
      tracking: trackingNumberInput 
    });
    setTrackingNumberInput('');
  };

  const handlePrintInvoice = (order: Order) => {
    window.print();
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <h3 className="font-bold text-base text-destructive">Failed to fetch order list</h3>
        <p className="text-xs text-muted-foreground mt-1">Please confirm local server connectivity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs antialiased font-semibold">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Order Fulfillment</h1>
        <p className="text-muted-foreground text-xs font-medium">Review transaction billing statements and transit tracking timelines.</p>
      </div>

      {/* Search & Filters block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card/45 p-4 rounded-3xl border border-border/40 glassmorphism">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-xs focus-visible:outline-none"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-xs focus-visible:outline-none cursor-pointer font-semibold"
        >
          <option value="">Filter Status: All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-xs focus-visible:outline-none cursor-pointer font-semibold"
        >
          <option value="">Filter Payment: All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                <th className="p-4">Reference ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Paid Amount</th>
                <th className="p-4">Method & Billing</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4">Change Status</th>
                <th className="p-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-secondary/10 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground text-[9px]">{order._id.substring(18)}</td>
                  <td className="p-4">
                    {typeof order.user === 'object' ? (
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-foreground uppercase text-[10px]">{order.user.name}</p>
                        <p className="text-[9px] text-muted-foreground font-medium">{order.user.email}</p>
                      </div>
                    ) : (
                      'Guest User'
                    )}
                  </td>
                  <td className="p-4 font-black font-mono text-foreground">${order.financials.total.toFixed(2)}</td>
                  <td className="p-4 uppercase text-[9px] font-black tracking-wider">
                    <span className="text-foreground">{order.paymentInfo.method}</span> &mdash; <span className={order.paymentInfo.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}>{order.paymentInfo.status}</span>
                  </td>
                  <td className="p-4">
                    <span className={cn("rounded-xl border px-3 py-1 font-black uppercase text-[8px] tracking-wider shadow-2xs", getStatusBadgeClass(order.orderStatus))}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="rounded-xl border border-border/60 bg-background/50 px-3 py-1.5 text-xs focus-visible:outline-none cursor-pointer font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS DRAWER MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-card border-l border-border/40 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-border/40 pb-4 mb-6">
                <div className="space-y-0.5">
                  <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Fulfillment Details</h3>
                  <span className="font-mono text-[9px] text-muted-foreground block">{selectedOrder._id}</span>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-1.5 hover:bg-secondary transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-6 flex-1 text-xs">
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-foreground/80" />
                    <span>Cart Products</span>
                  </h4>
                  <div className="divide-y divide-border/30 border border-border/40 p-4 rounded-2xl bg-secondary/5">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0 font-semibold">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-foreground uppercase text-[10px]">{item.product?.title || 'Catalog Product'}</p>
                          <p className="text-[9px] text-muted-foreground font-medium">Quantity: {item.quantity}</p>
                        </div>
                        <span className="font-extrabold text-foreground font-mono">${(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Form Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border/40 p-3.5 rounded-2xl space-y-1 bg-secondary/5">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Shipping Address</span>
                    <p className="font-bold text-foreground">
                      {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                    </p>
                  </div>
                  <div className="border border-border/40 p-3.5 rounded-2xl space-y-1 bg-secondary/5">
                    <span className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Billing Ledger</span>
                    <p className="font-bold text-foreground capitalize">
                      Method: {selectedOrder.paymentInfo.method} ({selectedOrder.paymentInfo.status})
                    </p>
                  </div>
                </div>

                {/* Assign Courier Form */}
                <form onSubmit={handleAssignTracking} className="border border-border/40 p-4.5 rounded-2xl bg-secondary/15 space-y-3">
                  <h4 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-foreground/80" />
                    <span>Assign Transit Tracking Courier</span>
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. UPS-123456"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-xs focus-visible:outline-none"
                    />
                    <button type="submit" className="rounded-xl bg-foreground text-background px-4 py-2.5 font-bold hover:opacity-90 transition-all shadow-xs text-xs uppercase tracking-wider">
                      Assign
                    </button>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                      Courier Code: <span className="font-mono text-foreground font-bold">{selectedOrder.trackingNumber}</span>
                    </p>
                  )}
                </form>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-border/40 pt-4 mt-6 flex justify-between items-center gap-3">
                <button 
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="flex items-center gap-1.5 border border-border/60 bg-card px-4.5 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-wider shadow-2xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                    className="border border-destructive/30 hover:bg-destructive/10 text-destructive px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
