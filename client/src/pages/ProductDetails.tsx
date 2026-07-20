import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from '../store/store';
import { addToCart } from '../store/cartSlice';
import { Product } from '../types';
import api from '../services/api';
import { 
  Star, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Plus, 
  Minus, 
  Sparkles,
  Info,
  ChevronRight,
  Heart
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { motion } from 'framer-motion';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Custom Variant selections
  const [selectedColor, setSelectedColor] = useState('Midnight');
  const [selectedSize, setSelectedSize] = useState('Medium');
  
  // Zoom overlay coords state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });

  // Fetch Product details
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.product as Product;
    },
    enabled: !!id,
  });

  // Fetch related products (same category)
  const { data: relatedData } = useQuery({
    queryKey: ['related-products', product?.category?._id],
    queryFn: async () => {
      if (!product?.category?._id) return [];
      const res = await api.get('/products', {
        params: {
          category: product.category._id,
          limit: 4,
        },
      });
      return res.data.products as Product[];
    },
    enabled: !!product?.category?._id,
  });

  // Track product view history in localStorage
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem('recently_viewed');
      let arr: Product[] = stored ? JSON.parse(stored) : [];
      // Filter out duplicate
      arr = arr.filter((p) => p._id !== product._id);
      arr.unshift(product);
      localStorage.setItem('recently_viewed', JSON.stringify(arr.slice(0, 10)));
    } catch (e) {}
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ product, quantity }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${product?.images[activeImageIndex]?.url})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-6">
        <div className="h-6 w-1/4 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-20 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center space-y-4">
        <h3 className="font-extrabold text-xl text-destructive">Failed to fetch product</h3>
        <p className="text-xs text-muted-foreground">The requested product ID was not found in our catalogs.</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground">
          Return to Home
        </Link>
      </div>
    );
  }

  const price = product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0;
  const inStock = product.inventory > 0;
  const relatedProducts = relatedData?.filter((p) => p._id !== product._id) || [];

  return (
    <div className="space-y-12 pb-24 antialiased text-xs font-semibold">
      {/* Dynamic Breadcrumbs */}
      <Breadcrumbs />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Gallery - 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Main view container with Lens Zoom */}
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square overflow-hidden rounded-3xl bg-secondary/10 border border-border/50 cursor-zoom-in group shadow-xs"
            >
              <img
                src={product.images[activeImageIndex]?.url}
                alt={product.title}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.01]"
              />
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-200 border border-border/40 rounded-3xl"
                style={zoomStyle}
              />
            </div>

            {/* Thumbnail Selection */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
                {product.images.map((img, idx) => (
                  <button
                    key={img.publicId}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-square w-16 overflow-hidden rounded-2xl border bg-card cursor-pointer shrink-0 transition-all ${
                      activeImageIndex === idx ? 'border-primary scale-[0.96] ring-2 ring-primary/20' : 'border-border/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information - 7 cols */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8 h-full">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>{product.category?.name} Catalog Group</span>
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground text-gradient font-sans uppercase">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.ratings.average)
                          ? 'fill-current'
                          : 'text-muted-foreground/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-foreground font-extrabold">
                  {product.ratings.average.toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-foreground/80 font-medium">({product.ratings.count} reviews recorded)</span>
              </div>

              {/* Price block */}
              <div className="flex items-center gap-4 py-2">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl font-black text-foreground">
                      ${product.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-base text-muted-foreground line-through font-semibold">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-1 text-[8px] font-black text-destructive uppercase tracking-wider">
                      Save ${(product.price - product.discountPrice).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-foreground">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed max-w-2xl font-medium">
                {product.description}
              </p>
            </div>

            {/* Configurable Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-y border-border/40">
              {/* Color options */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground block">Select Tone</span>
                <div className="flex gap-2">
                  {['Midnight', 'Stardust', 'Crimson'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                        selectedColor === color
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size options */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground block">Select Size</span>
                <div className="flex gap-2">
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs ${
                        selectedSize === size
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-card text-muted-foreground border-border hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Stock Level Indicator */}
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
                <span className="text-xs font-extrabold text-foreground">
                  {inStock ? `In stock indices secure (${product.inventory} packages on shelf)` : 'Clearance Out of stock'}
                </span>
              </div>

              {inStock && (
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Quantity Buttons */}
                  <div className="flex items-center border border-border/60 rounded-xl bg-background/50 overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-secondary transition-colors border-r border-border/40 cursor-pointer disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <span className="px-6 text-xs font-bold text-foreground select-none">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                      className="p-3 hover:bg-secondary transition-colors border-l border-border/40 cursor-pointer"
                      disabled={quantity >= product.inventory}
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-3.5 px-6 text-xs font-bold hover:opacity-90 transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Secure checkout placement</span>
                  </motion.button>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-border/40 text-[9px] text-muted-foreground font-semibold">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-foreground/80 shrink-0" />
                  <span>Next-Day Carrier Ship</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-foreground/80 shrink-0" />
                  <span>30-Day Clearance Return</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-foreground/80 shrink-0" />
                  <span>AES-256 TLS Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        <div className="space-y-4 pt-8 border-t border-border/40">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Specifications Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 font-mono text-[9px] border border-border/40 rounded-2xl p-6 bg-secondary/5 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Original Developer</span>
              <span className="text-foreground font-extrabold uppercase">ShopSphere Exclusive</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Composite Materials</span>
              <span className="text-foreground font-extrabold uppercase">Carbon Fiber composite</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-foreground font-extrabold uppercase">{product.category.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/30">
              <span className="text-muted-foreground">Available Variants</span>
              <span className="text-foreground font-extrabold uppercase">Crimson, Midnight, Stardust</span>
            </div>
          </div>
        </div>

        {/* Recommended Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-border/40">
            <h2 className="text-xs font-black tracking-widest text-foreground uppercase">
              <span>Related Visual Matches</span>
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const relPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
                return (
                  <Link
                    key={p._id}
                    to={`/product/${p._id}`}
                    className="group block bg-card border border-border/40 p-4 rounded-3xl hover-lift text-xs shadow-xs"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-2xl bg-secondary/20">
                      <img
                        src={p.images[0]?.url}
                        alt={p.title}
                        className="h-full w-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-extrabold text-foreground line-clamp-1 mt-3 group-hover:text-primary transition-colors text-xs">
                      {p.title}
                    </h3>
                    <p className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{p.category.name}</p>
                    <span className="block font-black text-xs mt-1 text-foreground">${relPrice.toFixed(2)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STICKY BUY SECTION AT WINDOW BOTTOM */}
      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-xl border-t border-border/40 py-3 px-6 z-30 shadow-lg flex justify-between items-center sm:hidden glassmorphism">
        <div className="flex gap-3 items-center text-xs">
          <img src={product.images[0]?.url} alt="" className="h-10 w-10 object-cover rounded-xl border border-border/40 shadow-xs bg-background shrink-0" />
          <div className="font-semibold">
            <h4 className="font-extrabold truncate max-w-[140px] text-foreground text-xs uppercase">{product.title}</h4>
            <span className="font-black text-foreground">${price.toFixed(2)}</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={!inStock}
          className="bg-foreground text-background text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
        >
          Add to Cart
        </motion.button>
      </div>
    </div>
  );
};

export default ProductDetails;
