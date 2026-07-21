import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../store/store';
import { addToCart } from '../store/cartSlice';
import { Product, Category } from '../types';
import api from '../services/api';
import { 
  Star, 
  ShoppingCart, 
  Search, 
  ArrowUpDown, 
  Mic, 
  Sparkles, 
  Image as ImageIcon, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Bookmark,
  Heart,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceSearchModal from '../components/VoiceSearchModal';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('');

  const handlePrefetchProduct = (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: async () => {
        const res = await api.get(`/products/${productId}`);
        return res.data.product as Product;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
  
  // Voice Search Modal State
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  
  // Recently viewed products loaded from localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  
  // Flash deal countdown state
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  useEffect(() => {
    // Load recently viewed
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored).slice(0, 4));
      }
    } catch (e) {}

    // Flash deal timer countdown logic
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 34, seconds: 12 }; // reset loop
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as Category[];
    },
  });

  // Fetch Products
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['products', selectedCategory, searchQuery, sortOption],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          sort: sortOption || undefined,
          limit: 50,
        },
      });
      return res.data;
    },
  });

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ product, quantity: 1 }));
  };

  const handleVoiceSearchComplete = (transcript: string) => {
    setSearchQuery(transcript);
  };

  return (
    <div className="space-y-16 pb-24 overflow-hidden antialiased">
      {/* 1. HERO BANNER SECTION (Vercel-inspired dark ambient glow) */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-[#070709] text-white px-4 py-24">
        {/* Glow blobs & pixel grid overlays */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[160px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-45" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.span 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-bold text-violet-400 uppercase tracking-widest"
            >
              <Sparkles className="h-3 w-3 animate-spin delay-1000" />
              <span>Sphere Intelligence</span>
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 font-sans"
            >
              Sphere.<br />Pure Design.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-semibold text-xs sm:text-sm"
            >
              Discover high-end products filtered by visual computer vision, natural voice, or tag matching. Form meets advanced utility.
            </motion.p>

            {/* Glassmorphism search input */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="p-1.5 max-w-lg mx-auto lg:mx-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center shadow-2xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Ask ShopSphere AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-0 placeholder:text-zinc-500 font-bold"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsVoiceSearchOpen(true)}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Voice Search"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <Link
                  to="/visual-search"
                  className="p-2.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="AI Similarity Search"
                >
                  <ImageIcon className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white text-black text-[10px] font-bold px-4 py-2.5 rounded-xl hover:bg-zinc-100 transition-colors shadow-lg cursor-pointer shrink-0"
                >
                  Browse Catalog
                </button>
              </div>
            </motion.div>

            {/* Animated statistics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-md mx-auto lg:mx-0 font-mono text-[9px] text-zinc-500"
            >
              <div>
                <span className="text-lg font-bold text-white block">50k+</span>
                <span>Active Users</span>
              </div>
              <div className="border-l border-white/10 pl-6">
                <span className="text-lg font-bold text-white block">99.9%</span>
                <span>Dispatched</span>
              </div>
              <div className="border-l border-white/10 pl-6">
                <span className="text-lg font-bold text-white block">&lt; 150ms</span>
                <span>Vision Match</span>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:flex justify-center items-center">
            {/* Tesla Inspired luxury model floating card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="relative z-10 w-72 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 backdrop-blur-md shadow-2xl flex flex-col gap-4 text-xs"
            >
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                alt="Product Veloce Red"
                className="w-full aspect-square object-cover rounded-2xl border border-white/5 shadow-lg bg-zinc-900/50"
              />
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">Top Collection</span>
                <h4 className="font-extrabold text-sm text-white">Veloce Premium Carbon</h4>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-white/95">$149.00</span>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">In Stock</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES CHIPS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-wider">Browse Departments</h2>
          <p className="text-xs text-muted-foreground font-medium">Select a category folder to inspect our visual catalogs.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory('')}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              selectedCategory === ''
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary/40'
            }`}
          >
            All Collections
          </button>
          {categoriesData?.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                selectedCategory === cat._id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. FLASH DEALS WITH TIMER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-destructive/10 bg-destructive/5 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 premium-glow">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[9px] font-bold px-3 py-0.5 uppercase tracking-widest">
              Limited Availability
            </span>
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-wide">Clearance Markdown</h2>
            <p className="text-xs text-muted-foreground max-w-md font-medium">
              Grab luxury items at clearance prices. Dispatched with priority 24h express carrier routes.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Wipeout in</span>
            <div className="flex gap-2 text-xs font-mono font-bold">
              <div className="bg-card border border-border/60 p-2.5 rounded-xl min-w-[50px] text-center shadow-xs">
                <span className="block text-sm font-black text-destructive">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-[8px] text-muted-foreground/80 uppercase tracking-wider">hrs</span>
              </div>
              <div className="bg-card border border-border/60 p-2.5 rounded-xl min-w-[50px] text-center shadow-xs">
                <span className="block text-sm font-black text-destructive">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[8px] text-muted-foreground/80 uppercase tracking-wider">min</span>
              </div>
              <div className="bg-card border border-border/60 p-2.5 rounded-xl min-w-[50px] text-center shadow-xs">
                <span className="block text-sm font-black text-destructive">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-[8px] text-muted-foreground/80 uppercase tracking-wider">sec</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT GRID & FILTERS */}
      <section id="catalog-grid" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border/60">
          {/* Search text filter input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter catalog list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 transition-all font-semibold"
            />
          </div>

          {/* Sort trigger selection */}
          <div className="relative w-full sm:w-auto min-w-[220px]">
            <ArrowUpDown className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/50 pl-10 pr-8 py-2.5 text-xs focus-visible:outline-none cursor-pointer font-bold appearance-none"
            >
              <option value="">Sort by: Best Match</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Average Rating</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-3 skeleton-shimmer p-4 rounded-3xl border border-border/40 min-h-[320px]">
                <div className="aspect-square w-full bg-secondary/30 rounded-2xl animate-pulse" />
                <div className="h-4 w-3/4 bg-secondary/30 rounded-lg mt-2 animate-pulse" />
                <div className="h-3 w-1/2 bg-secondary/30 rounded-lg animate-pulse" />
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/20">
                  <div className="h-5 w-1/4 bg-secondary/30 rounded-lg animate-pulse" />
                  <div className="h-8 w-1/3 bg-secondary/30 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border/40 space-y-3">
            <h3 className="font-extrabold text-sm text-destructive uppercase tracking-wider">Catalog pipeline offline</h3>
            <p className="text-xs text-muted-foreground font-medium">Verify your server connection and local API hosting configurations.</p>
          </div>
        ) : productsData?.products?.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-border/40 space-y-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider">No matching articles found</h3>
            <p className="text-xs text-muted-foreground font-medium">Try checking alternative phrases or clear category descriptors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {productsData?.products?.map((product: Product) => {
              const mainImg = product.images[0]?.url || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&q=80';
              const price = product.discountPrice > 0 ? product.discountPrice : product.price;
              const hasDiscount = product.discountPrice > 0;

              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  onMouseEnter={() => handlePrefetchProduct(product._id)}
                  className="group relative flex flex-col bg-card border border-border/40 p-4 rounded-3xl hover-lift cursor-pointer shadow-xs transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/20 border border-border/10">
                    <img
                      src={mainImg}
                      alt={product.title}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.025]"
                    />
                    {hasDiscount && (
                      <span className="absolute left-3 top-3 rounded-xl bg-destructive border border-destructive/20 px-2.5 py-0.5 text-[8px] font-black text-destructive-foreground uppercase tracking-wider">
                        Sale
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1 mt-4 text-xs">
                    <span className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider block">
                      {product.category?.name}
                    </span>
                    <h3 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
                      {product.title}
                    </h3>

                    <div className="flex items-center gap-1 mt-0.5 text-yellow-500 font-bold">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs text-foreground font-semibold">
                        {product.ratings.average.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-muted-foreground/75 font-medium">({product.ratings.count})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
                    <div className="flex flex-col text-xs">
                      {hasDiscount ? (
                        <>
                          <span className="text-[9px] text-muted-foreground/70 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-sm font-black text-foreground">
                            ${product.discountPrice.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.inventory <= 0}
                      className={`rounded-xl p-2.5 transition-colors cursor-pointer border ${
                        product.inventory > 0
                          ? 'bg-foreground border-foreground text-background hover:opacity-90 shadow-xs'
                          : 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                      }`}
                      aria-label="Add to Cart"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </motion.button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. RECENTLY VIEWED CAROUSEL */}
      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-wider">Recently Inspected</h2>
            <p className="text-xs text-muted-foreground font-medium">Quick history lookup for objects visited during active tabs.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {recentlyViewed.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group border border-border/40 bg-card p-3 rounded-2xl hover:scale-[1.01] transition-transform text-xs"
              >
                <img
                  src={product.images[0]?.url}
                  alt={product.title}
                  className="aspect-square w-full object-cover rounded-xl bg-secondary/20"
                />
                <h4 className="font-extrabold text-foreground line-clamp-1 mt-2.5 group-hover:text-primary transition-colors text-xs">
                  {product.title}
                </h4>
                <p className="font-extrabold text-muted-foreground/80 mt-0.5">
                  ${(product.discountPrice > 0 ? product.discountPrice : product.price).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. BRAND BANNER (Linear/Nothing Inspired) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-card border border-border/40 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors shadow-xs">
          <div className="text-center md:text-left space-y-1">
            <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Partners & Abstractions</h3>
            <p className="text-xs text-muted-foreground max-w-md font-medium">
              We coordinate logistics streams directly with luxury fabrication partners and designers worldwide.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60 hover:opacity-85 transition-opacity duration-300 font-black tracking-widest text-xs select-none">
            <span>APPLE</span>
            <span>LINEAR</span>
            <span>NOTHING</span>
            <span>VERCEL</span>
            <span>TESLA</span>
          </div>
        </div>
      </section>

      {/* VOICE SEARCH MODAL PORTAL */}
      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onSearch={handleVoiceSearchComplete}
      />
    </div>
  );
};

export default Home;
