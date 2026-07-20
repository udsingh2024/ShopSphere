import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Order, Product } from '../../types';
import { useSocket } from '../../contexts/SocketContext';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertCircle, 
  DollarSign, 
  Activity, 
  Percent, 
  RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

// Mock Recharts chart datasets matching Stripe/Shopify look
const salesData = [
  { name: 'Jan', revenue: 4000, orders: 240 },
  { name: 'Feb', revenue: 3000, orders: 198 },
  { name: 'Mar', revenue: 5000, orders: 310 },
  { name: 'Apr', revenue: 2780, orders: 180 },
  { name: 'May', revenue: 6890, orders: 420 },
  { name: 'Jun', revenue: 8900, orders: 580 },
  { name: 'Jul', revenue: 9400, orders: 620 }
];

const categoryPieData = [
  { name: 'Electronics', value: 45 },
  { name: 'Footwear', value: 25 },
  { name: 'Accessories', value: 20 },
  { name: 'Home Care', value: 10 }
];

const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e'];

const AdminDashboard: React.FC = () => {
  const socket = useSocket();

  // Dynamic state populated by real-time socket events
  const [realtimeRevenue, setRealtimeRevenue] = useState<number | null>(null);
  const [realtimeOrdersCount, setRealtimeOrdersCount] = useState<number | null>(null);
  
  // Fetch orders
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await api.get('/orders/admin');
      return res.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  // Fetch support conversations
  const { data: supportData } = useQuery({
    queryKey: ['admin-support'],
    queryFn: async () => {
      const res = await api.get('/support/conversations');
      return res.data;
    },
  });

  const ordersList: Order[] = ordersData?.orders || [];
  const productsList: Product[] = productsData?.products || [];
  const activeChats = supportData?.conversations?.length || 0;

  // Process data locally
  const totalRevenue = ordersList
    .filter(order => order.paymentInfo.status === 'paid' || order.orderStatus === 'delivered')
    .reduce((sum, order) => sum + order.financials.total, 0);

  const pendingCount = ordersList.filter(o => o.orderStatus === 'pending').length;
  const lowStockProducts = productsList.filter(p => p.inventory < 10);

  // Sync real-time state with loaded databases
  useEffect(() => {
    if (ordersList.length > 0) {
      if (realtimeOrdersCount === null) setRealtimeOrdersCount(ordersList.length);
      if (realtimeRevenue === null) setRealtimeRevenue(totalRevenue);
    }
  }, [ordersList, totalRevenue]);

  // Handle real-time socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
      console.log('Real-time order transaction event:', data);
      setRealtimeOrdersCount((prev) => (prev !== null ? prev + 1 : 1));
      setRealtimeRevenue((prev) => (prev !== null ? prev + (data.totalPrice || 120) : 120));
    };

    socket.on('new_order_placed', handleNewOrder);
    return () => {
      socket.off('new_order_placed', handleNewOrder);
    };
  }, [socket]);

  // KPI metadata
  const statCards = [
    {
      title: "Today's Revenue",
      value: `$${(realtimeRevenue || totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Calculated from active payments',
      icon: DollarSign,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: "Active Orders",
      value: realtimeOrdersCount || ordersList.length,
      description: `${pendingCount} orders pending shipment`,
      icon: ShoppingCart,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockProducts.length,
      description: 'Items below 10 packages',
      icon: AlertCircle,
      color: lowStockProducts.length > 0 
        ? 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse'
        : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Conversion Rate',
      value: '3.42%',
      description: '+0.54% from last week',
      icon: Percent,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn text-xs antialiased font-semibold">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Console Dashboard</h1>
          <p className="text-muted-foreground text-xs font-medium">
            Monitor real-time revenue indexes, catalog inventory status, and transactional histories.
          </p>
        </div>
        <div className="flex items-center gap-2 font-black text-[9px] text-muted-foreground uppercase bg-card border border-border/40 px-3.5 py-2 rounded-xl shadow-2xs select-none">
          <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Real-Time Sync Connected</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-card border border-border/40 rounded-2xl p-5 flex items-center justify-between shadow-2xs hover-lift transition-all duration-300">
              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{card.title}</span>
                <p className="text-lg font-black text-foreground font-mono">{card.value}</p>
                <p className="text-[9px] text-muted-foreground font-semibold">{card.description}</p>
              </div>
              <div className={`rounded-xl border p-2.5 ${card.color} shadow-xs`}>
                <Icon className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Area Chart - 8 cols */}
        <div className="lg:col-span-8 bg-card border border-border/40 rounded-3xl p-6 shadow-2xs space-y-5 glassmorphism">
          <div className="flex justify-between items-center border-b border-border/30 pb-3">
            <h3 className="font-black text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-foreground/80" />
              <span>Sales & Order Overview</span>
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/50%)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} className="font-mono font-bold" />
                <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} axisLine={false} className="font-mono font-bold" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border)/50%)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution Pie - 4 cols */}
        <div className="lg:col-span-4 bg-card border border-border/40 rounded-3xl p-6 shadow-2xs flex flex-col justify-between glassmorphism gap-6">
          <div className="border-b border-border/30 pb-3">
            <h3 className="font-black text-xs text-foreground uppercase tracking-wider">Category Performance</h3>
          </div>
          <div className="h-44 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="focus:outline-none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border)/50%)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {categoryPieData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-foreground font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders log */}
      <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
        <div className="p-5 border-b border-border/40 flex justify-between items-center bg-secondary/15">
          <h2 className="font-black text-xs uppercase tracking-wider">Recent Transactions</h2>
          <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Latest 5 Orders</span>
        </div>
        <div className="overflow-x-auto">
          {ordersList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-medium">
              No orders recorded in databases.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Purchased By</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">Tax & Fees</th>
                  <th className="p-4">Paid Total</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {ordersList.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-secondary/15 transition-colors font-semibold">
                    <td className="p-4 font-mono text-[9px] text-foreground font-bold">{order._id.substring(18)}</td>
                    <td className="p-4 font-bold text-foreground">
                      {typeof order.user === 'object' ? order.user?.name : 'Guest User'}
                    </td>
                    <td className="p-4 font-mono text-foreground">${order.financials.subtotal.toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground font-mono">${(order.financials.shippingFee + order.financials.tax).toFixed(2)}</td>
                    <td className="p-4 font-black text-foreground font-mono">${order.financials.total.toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground font-mono">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
