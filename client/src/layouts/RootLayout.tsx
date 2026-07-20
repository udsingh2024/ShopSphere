import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/store';
import { toggleCart, removeFromCart, updateQuantity } from '../store/cartSlice';
import { toggleTheme } from '../store/themeSlice';
import { clearCredentials } from '../store/authSlice';
import { useSocket } from '../contexts/SocketContext';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Menu, 
  Search, 
  Compass, 
  MessageSquare,
  ChevronDown,
  Bell,
  Mic,
  Camera,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';

// Globally loaded floating widgets
import FloatingAIAssistant from '../components/FloatingAIAssistant';
import ScrollToTop from '../components/ScrollToTop';
import VoiceSearchModal from '../components/VoiceSearchModal';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  timestamp: string;
}

const RootLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const socket = useSocket();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { items: cartItems, isCartOpen } = useAppSelector((state) => state.cart);
  const { theme } = useAppSelector((state) => state.theme);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Search bar input focus expander
  const [searchFocused, setSearchFocused] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  
  // Voice search modal trigger
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Real-time notifications state array
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', title: 'Welcome to ShopSphere', body: 'Start browsing our premium vector catalogs!', read: false, timestamp: '10m ago' },
    { id: 'n2', title: 'Security Auditing Active', body: 'Session audits trace your logged devices.', read: true, timestamp: '1h ago' }
  ]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  );

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to Socket.IO status changes and message alerts
  useEffect(() => {
    if (!socket) return;

    const handleOrderNotification = (data: any) => {
      const newAlert: AppNotification = {
        id: `socket_${Date.now()}`,
        title: 'Order Status Updated',
        body: `Order Reference #${data.orderId.substring(18)} transitioned to ${data.status.toUpperCase()}`,
        read: false,
        timestamp: 'Just now'
      };
      setNotifications((prev) => [newAlert, ...prev]);
    };

    socket.on('order_status_updated', handleOrderNotification);
    return () => {
      socket.off('order_status_updated', handleOrderNotification);
    };
  }, [socket]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    dispatch(clearCredentials());
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(navSearchQuery)}`);
    }
  };

  const handleVoiceSearchComplete = (transcript: string) => {
    setNavSearchQuery(transcript);
    navigate(`/?search=${encodeURIComponent(transcript)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300 text-xs antialiased">
      {/* 1. STICKY NAVBAR (Vercel inspired Glassmorphism) */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo brand - Premium Minimalist */}
          <Link to="/" className="flex items-center gap-2.5 font-black text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background shadow-md">
              <ShoppingBag className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <span className="text-gradient font-black text-base tracking-tight uppercase">ShopSphere</span>
          </Link>

          {/* Desktop Search Bar (Vercel/Linear style focus) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-3 relative">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-80' : 'w-56'}`}>
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search premium catalog..."
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full rounded-xl border border-border/60 bg-secondary/15 pl-10 pr-9 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all font-semibold placeholder:text-muted-foreground/60 focus:bg-background"
              />
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground cursor-pointer transition-colors p-0.5 rounded-md hover:bg-secondary/40"
                title="Voice Search"
              >
                <Mic className="h-3 w-3" />
              </button>
            </div>
            
            <Link
              to="/visual-search"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 bg-secondary/10 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
              title="AI Visual Matching Engine"
            >
              <Camera className="h-3.5 w-3.5" />
            </Link>
          </form>

          {/* Action triggers */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Switch */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleTheme())}
              className="rounded-xl p-2 hover:bg-secondary/65 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </motion.button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative rounded-xl p-2 hover:bg-secondary/65 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
                )}
              </motion.button>

              {/* Notification drop popover */}
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl z-20 space-y-3 glassmorphism premium-glow"
                    >
                      <div className="flex justify-between items-center border-b border-border pb-2.5">
                        <span className="font-extrabold text-[10px] uppercase text-muted-foreground tracking-wider">Alert Center</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllNotificationsAsRead} className="text-[10px] text-primary font-bold hover:text-primary/80 cursor-pointer">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {notifications.map((n) => (
                          <div key={n.id} className={`p-3 rounded-xl border text-[11px] leading-relaxed relative transition-all ${n.read ? 'border-border/30 bg-secondary/5' : 'border-primary/20 bg-primary/5'}`}>
                            {!n.read && <span className="absolute top-3.5 right-3.5 h-1.5 w-1.5 bg-primary rounded-full" />}
                            <p className="font-bold text-foreground pr-3">{n.title}</p>
                            <p className="text-muted-foreground text-[10px] mt-0.5">{n.body}</p>
                            <span className="text-[9px] text-muted-foreground/60 block mt-1.5 font-medium">{n.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Shopping Cart count */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleCart())}
              className="relative rounded-xl p-2 hover:bg-secondary/65 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Open Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground leading-none shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </motion.button>

            {/* User Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-full hover:bg-secondary/60 p-1 transition-colors cursor-pointer"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="h-7 w-7 rounded-full object-cover border border-border/80" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground uppercase shadow-xs">
                      {user?.name.charAt(0)}
                    </div>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="absolute right-0 mt-3 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-20 text-xs glassmorphism premium-glow"
                      >
                        <div className="px-3 py-2 border-b border-border/40 text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                          <span>{user?.name}</span>
                        </div>
                        <div className="p-1 space-y-0.5">
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex w-full items-center px-3 py-2 rounded-xl hover:bg-secondary transition-colors font-bold text-foreground"
                          >
                            My Profile
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex w-full items-center px-3 py-2 rounded-xl hover:bg-secondary transition-colors font-bold text-foreground"
                          >
                            Order History
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setIsProfileDropdownOpen(false)}
                              className="flex w-full items-center px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-bold"
                            >
                              Admin Console
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-3 py-2 text-destructive rounded-xl hover:bg-destructive/10 transition-colors font-bold text-left cursor-pointer"
                          >
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden md:flex items-center gap-1.5 rounded-xl bg-foreground px-4.5 py-2 text-xs font-bold text-background hover:opacity-90 transition-all shadow-sm"
              >
                <UserIcon className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 hover:bg-secondary/65 transition-colors md:hidden text-muted-foreground cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border/40 bg-background/95 backdrop-blur-lg px-4 py-4 md:hidden flex flex-col gap-3 font-bold text-xs"
            >
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1">
                Catalog Home
              </Link>
              <Link to="/visual-search" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1">
                Visual Search (AI)
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1">
                    My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1">
                    Purchased Orders
                  </Link>
                  <Link to="/chat" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-primary transition-colors py-1">
                    Live Chat Support
                  </Link>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-background font-bold shadow-sm"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MAIN SCROLL CONTAINER */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 3. LUXURY FOOTER (Linear inspired) */}
      <footer className="border-t border-border bg-card py-16 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-12 text-xs">
          <div className="space-y-4">
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground text-background">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
              <span className="tracking-wide font-black uppercase text-xs">ShopSphere Enterprise</span>
            </h4>
            <p className="text-muted-foreground leading-relaxed max-w-xs font-medium">
              Premium modern AI-powered e-commerce SaaS portal. Engineered with advanced visual indexing vector pipelines and dynamic real-time integrations.
            </p>
          </div>

          <div className="space-y-4">
            <span className="font-extrabold text-xs text-foreground block uppercase tracking-wider">System Directory</span>
            <div className="space-y-2 flex flex-col font-bold text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Browse Products</Link>
              <Link to="/visual-search" className="hover:text-foreground transition-colors">Visual Index Engine</Link>
              <Link to="/profile" className="hover:text-foreground transition-colors">Security Auditing</Link>
            </div>
          </div>

          <div className="space-y-4">
            <span className="font-extrabold text-xs text-foreground block uppercase tracking-wider">Support Desk</span>
            <div className="space-y-2 flex flex-col font-bold text-muted-foreground">
              <Link to="/chat" className="hover:text-foreground transition-colors">24/7 Agent Live Chat</Link>
              <span className="hover:text-foreground transition-colors cursor-pointer">Clearance Guidelines</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Security Certifications</span>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-border/30 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground text-[10px] font-medium">
          <p>&copy; 2026 ShopSphere, Inc. All rights reserved. Secured with TLS-1.3 sessions.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* 4. CART DRAWER OVERLAY (Sleek side sliding sheet) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(toggleCart())}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl border-l border-border glassmorphism"
            >
              {/* Cart Drawer Header */}
              <div className="flex h-16 items-center justify-between border-b border-border/55 px-6">
                <h2 className="text-xs font-black flex items-center gap-2.5 text-foreground uppercase tracking-widest">
                  <ShoppingBag className="h-4.5 w-4.5 text-primary" />
                  <span>Cart Items ({cartItemCount})</span>
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => dispatch(toggleCart())}
                  className="rounded-xl p-1.5 hover:bg-secondary/60 transition-colors cursor-pointer text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Scrollable Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
                    <div className="rounded-2xl bg-secondary/10 border border-border/40 p-5 text-muted-foreground shadow-xs">
                      <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Your cart is empty</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed max-w-[240px] mx-auto font-medium">Browse our premium departments to add items to your cart.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => dispatch(toggleCart())}
                      className="rounded-xl bg-foreground text-background px-6 py-2.5 text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                    >
                      Start Shopping
                    </motion.button>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const price = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
                    return (
                      <motion.div 
                        layout 
                        key={item.product._id} 
                        className="flex gap-4 border-b border-border/35 pb-4 last:border-0 last:pb-0 text-xs items-center"
                      >
                        <img
                          src={item.product.images[0]?.url}
                          alt={item.product.title}
                          className="h-16 w-16 rounded-xl object-cover border border-border/60 bg-secondary/10 shrink-0 shadow-xs"
                        />
                        <div className="flex flex-1 flex-col justify-between min-w-0 h-16 py-0.5">
                          <div>
                            <h4 className="font-extrabold text-foreground truncate pr-4 text-xs">{item.product.title}</h4>
                            <p className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider mt-0.5">{item.product.category.name}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1.5">
                            {/* Quantity buttons - Sleek outlines */}
                            <div className="flex items-center border border-border/60 rounded-lg bg-background/50 overflow-hidden">
                              <button
                                onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity - 1 }))}
                                className="p-1 hover:bg-secondary cursor-pointer border-r border-border/40 disabled:opacity-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <span className="px-3.5 text-xs font-bold text-foreground select-none">{item.quantity}</span>
                              <button
                                onClick={() => dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity + 1 }))}
                                className="p-1 hover:bg-secondary cursor-pointer border-l border-border/40"
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                            <span className="font-extrabold text-foreground text-xs">${(price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => dispatch(removeFromCart(item.product._id))}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2 cursor-pointer self-center rounded-lg hover:bg-secondary/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footing Checkout drawer panel */}
              {cartItems.length > 0 && (
                <div className="border-t border-border/55 bg-secondary/5 p-6 space-y-4">
                  <div className="flex justify-between font-bold text-sm text-foreground">
                    <span className="text-muted-foreground font-semibold">Subtotal</span>
                    <span className="text-sm font-black">${cartTotal.toFixed(2)}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      dispatch(toggleCart());
                      navigate('/checkout');
                    }}
                    className="w-full rounded-xl bg-foreground text-background py-3.5 text-center font-bold hover:opacity-90 transition-all shadow-lg cursor-pointer text-xs"
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* 5. GLOBALLY MOUNTED CUSTOM FLOATING ELEMENTS */}
      <FloatingAIAssistant />
      <ScrollToTop />
      <VoiceSearchModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onSearch={handleVoiceSearchComplete}
      />
    </div>
  );
};

export default RootLayout;
