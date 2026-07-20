import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/store';
import { toggleTheme } from '../store/themeSlice';
import { clearCredentials } from '../store/authSlice';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  MessageSquare, 
  ArrowLeft,
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Command,
  HelpCircle,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.theme);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Command palette modal state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  // Sidebar list
  const menuItems = [
    { label: 'Overview Metrics', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Product Catalog', icon: Package, path: '/admin/products' },
    { label: 'Order Processing', icon: ShoppingBag, path: '/admin/orders' },
    { label: 'Customer Care Desk', icon: MessageSquare, path: '/admin/support' },
  ];

  // Command palette options
  const commands = [
    { text: 'Go to Overview Metrics', action: () => navigate('/admin/dashboard') },
    { text: 'Go to Product Catalog', action: () => navigate('/admin/products') },
    { text: 'Go to Order Processing', action: () => navigate('/admin/orders') },
    { text: 'Go to Customer Support Chats', action: () => navigate('/admin/support') },
    { text: 'Toggle Dark Mode theme', action: () => dispatch(toggleTheme()) },
    { text: 'Return to Customer Frontpage', action: () => navigate('/') },
    { text: 'Sign Out Admin console', action: () => handleLogout() }
  ];

  const filteredCommands = commands.filter((c) => 
    c.text.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  // Monitor keyboard shortcut Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    dispatch(clearCredentials());
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground text-xs font-medium antialiased">
      
      {/* 1. ADMIN SIDEBAR (Obsidian Slate Theme) */}
      <aside className="fixed bottom-0 top-0 left-0 z-20 hidden w-64 border-r border-border/40 bg-card md:block shadow-sm transition-colors duration-300">
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
          <Link to="/" className="flex items-center gap-2 font-black text-sm tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="text-gradient uppercase font-black text-xs tracking-wider">Sphere Console</span>
          </Link>
        </div>

        <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-bold",
                    isActive
                      ? "bg-foreground text-background shadow-md shadow-black/10 dark:shadow-white/5"
                      : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all cursor-pointer font-bold border border-transparent hover:border-border/30"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Return to Store</span>
          </motion.button>
        </div>
      </aside>

      {/* 2. MAIN HEADER & ROUTING VIEW CONTAINER */}
      <div className="flex flex-1 flex-col md:pl-64">
        
        {/* Top Header navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/65 backdrop-blur-md px-6 md:px-8 sticky top-0 z-30 shadow-xs transition-colors duration-300">
          {/* Breadcrumb section */}
          <div className="flex items-center gap-2.5 text-[10px] font-bold">
            <span className="uppercase text-muted-foreground/80 tracking-wider">Console</span>
            <span className="text-muted-foreground/45 font-medium">/</span>
            <span className="text-foreground capitalize bg-secondary/35 border border-border/30 px-2 py-0.5 rounded-lg font-extrabold text-[9px] tracking-wide">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ')}
            </span>
          </div>

          {/* Quick command search triggers */}
          <motion.button 
            whileHover={{ scale: 1.01 }}
            onClick={() => setIsPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2.5 border border-border/60 bg-secondary/15 px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all cursor-pointer w-48 font-bold text-left"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold">Search logs & routes...</span>
            <span className="ml-auto font-mono text-[8px] bg-card border border-border/80 px-1.5 py-0.5 rounded-md leading-none shadow-xs flex items-center gap-0.5 select-none">
              <Command className="h-2 w-2" /> K
            </span>
          </motion.button>

          {/* Action elements */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Theme selector */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleTheme())}
              className="rounded-xl p-2 hover:bg-secondary/65 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </motion.button>

            {/* Notifications Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative rounded-xl p-2 hover:bg-secondary/65 transition-colors cursor-pointer text-muted-foreground hover:text-foreground animate-pulse"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 rounded-full hover:bg-secondary/60 p-1 transition-colors cursor-pointer font-bold"
              >
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black uppercase shadow-xs">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="absolute right-0 mt-3 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-20 glassmorphism premium-glow"
                    >
                      <div className="px-3 py-2 border-b border-border/40 text-[9px] uppercase font-bold text-muted-foreground/80 tracking-wider">
                        <span>{user?.name}</span>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-3 py-2 text-destructive rounded-xl hover:bg-destructive/10 transition-colors font-bold text-left cursor-pointer"
                        >
                          Sign Out Console
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. GLOBAL COMMAND PALETTE MODAL (Linear Style) */}
      <AnimatePresence>
        {isPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-xs animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[360px] glassmorphism premium-glow"
            >
              {/* Search input */}
              <div className="p-4 border-b border-border/40 flex items-center gap-3">
                <Search className="h-4.5 w-4.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Type an administrative command or route shortcut..."
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs focus:outline-none placeholder:text-muted-foreground/60 font-bold"
                  autoFocus
                />
                <button 
                  onClick={() => setIsPaletteOpen(false)}
                  className="rounded-xl hover:bg-secondary/60 p-1.5 text-muted-foreground hover:text-foreground cursor-pointer border border-transparent hover:border-border/35"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Command options list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/80 font-medium">
                    No matching console workflows found.
                  </div>
                ) : (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.text}
                      onClick={() => {
                        setIsPaletteOpen(false);
                        cmd.action();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-secondary text-foreground transition-all font-bold flex justify-between items-center cursor-pointer border border-transparent hover:border-border/30 shadow-xs"
                    >
                      <span className="text-xs">{cmd.text}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
