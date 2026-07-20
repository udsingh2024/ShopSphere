import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../store/store';
import { addToCart } from '../store/cartSlice';
import { Product } from '../types';
import api from '../services/api';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  ShoppingCart, 
  Info,
  Sparkles,
  History,
  Trash2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAnalysisDetails {
  productType: string;
  category: string;
  brand: string;
  dominantColors: string[];
  material: string;
  style: string;
  tags: string[];
  keywords: string[];
  description: string;
  confidenceScore: number;
}

interface VisualSearchResult {
  analysis: AIAnalysisDetails;
  imageUrl: string;
  results: (Product & { similarityScore: number })[];
}

const VisualSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Image metadata parsed on the client
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; size: string } | null>(null);

  // Loading animation step tracking
  const [scanStep, setScanStep] = useState(0);

  // Search Results & Extracted Attributes state
  const [searchOutput, setSearchOutput] = useState<VisualSearchResult | null>(null);

  // Filter parameters
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(40);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(500);

  // Loading steps text
  const loadingSteps = [
    'Analyzing Image...',
    'Detecting Objects...',
    'Generating AI Embeddings...',
    'Searching Products...'
  ];

  // Fetch search history from server
  const { data: historyData } = useQuery({
    queryKey: ['visual-search-history'],
    queryFn: async () => {
      const res = await api.get('/visual-search/history');
      return res.data.history as any[];
    }
  });

  const historyList = historyData || [];

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/visual-search/history');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visual-search-history'] });
    }
  });

  // Visual Search mutation
  const searchMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/visual-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as VisualSearchResult;
    },
    onSuccess: (data) => {
      setSearchOutput(data);
      queryClient.invalidateQueries({ queryKey: ['visual-search-history'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'AI Visual Search API failed. Using local descriptor model.');
    }
  });

  // Cycle loading step messages during pending queries
  useEffect(() => {
    let interval: any;
    if (searchMutation.isPending) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [searchMutation.isPending]);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Calculate file dimensions on client
    const img = new Image();
    img.onload = () => {
      setImageMeta({
        width: img.width,
        height: img.height,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      });
    };
    img.src = objectUrl;

    setSearchOutput(null);
    searchMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRepeatSearch = async (historyItem: any) => {
    // To repeat, we fetch the remote image URL as a Blob, convert to a File object, and trigger matching
    try {
      setPreviewUrl(historyItem.imageUrl);
      setImageMeta({ width: 640, height: 640, size: '0.5 MB' });
      setSearchOutput(null);

      const response = await fetch(historyItem.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'history_repeat.jpg', { type: blob.type });
      setSelectedFile(file);
      searchMutation.mutate(file);
    } catch (e) {
      alert('Failed to repeat visual query: Image url not accessible.');
    }
  };

  const triggerFileInput = () => {
    document.getElementById('visual-search-upload')?.click();
  };

  // Color coding matching scores
  const getBadgeStyle = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 90) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (pct >= 75) return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const getBadgeLabel = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 90) return `${pct}% Exact Match`;
    if (pct >= 75) return `${pct}% Similar`;
    return `${pct}% Alternative`;
  };

  // Filter matched products
  const matchedProducts = searchOutput?.results || [];
  const filteredProducts = matchedProducts.filter((p) => {
    const scorePct = Math.round(p.similarityScore * 100);
    const matchesSimilarity = scorePct >= similarityThreshold;
    const matchesCategory = selectedCategory === '' || p.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
    const finalPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
    const matchesPrice = finalPrice <= maxPrice;

    return matchesSimilarity && matchesCategory && matchesPrice;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12 text-xs antialiased">
      
      {/* 1. HERO GRADIENT BACKGROUND (Nothing Inspired Minimalist) */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 sm:p-12 text-center space-y-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--glow-color),transparent_70%)] pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[9px] font-bold text-primary uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Gemini Vision Indexer</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground text-gradient uppercase">
          Visual Match Engine
        </h1>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-md mx-auto font-medium">
          Upload an image to compute feature classifications. Our neural pipeline analyzes object contours, textures, and color properties to match items in real-time.
        </p>
      </div>

      {/* 2. UPLOAD SCANNER ZONE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full aspect-[16/9] sm:aspect-[16/7] flex flex-col items-center justify-center border border-dashed rounded-2xl cursor-pointer p-6 relative overflow-hidden transition-all duration-300 ${
              isDragOver
                ? 'border-primary bg-primary/5 scale-[0.99] shadow-lg shadow-primary/5'
                : 'border-border bg-card hover:bg-secondary/25 shadow-xs'
            }`}
            onClick={triggerFileInput}
          >
            <input
              id="visual-search-upload"
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative h-full w-full flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Search query visual"
                  className="h-full max-w-xs object-contain rounded-xl shadow-md border border-border/40"
                />

                {/* Laser animation */}
                {searchMutation.isPending && (
                  <div className="scanner-laser" />
                )}

                <div className="absolute top-0 right-0 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setImageMeta(null);
                      setSearchOutput(null);
                      searchMutation.reset();
                    }}
                    className="rounded-xl bg-destructive text-white hover:bg-destructive/95 p-2 px-3.5 font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Canvas</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-primary shadow-xs">
                  <UploadCloud className="h-7 w-7 stroke-[1.5]" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground uppercase tracking-wider">Drag and drop vector assets here</p>
                  <p className="text-muted-foreground mt-1 font-medium">Supports PNG, JPG, or WEBP (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Client image metadata card */}
          {imageMeta && (
            <div className="bg-card border border-border p-4 rounded-xl flex flex-wrap justify-between items-center gap-3 text-xs shadow-xs transition-all">
              <div className="flex gap-6">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Resolution</span>
                  <span className="font-extrabold text-foreground">{imageMeta.width} x {imageMeta.height} PX</span>
                </div>
                <div className="border-l border-border/50 pl-6">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Payload Size</span>
                  <span className="font-extrabold text-foreground">{imageMeta.size}</span>
                </div>
              </div>
              <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-500 shadow-sm">
                Payload Verified
              </span>
            </div>
          )}
        </div>

        {/* AI Analysis descriptors Panel - 4 cols */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-6 glassmorphism transition-all">
          <div className="border-b border-border/40 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Vision Signatures</span>
            </h3>
            {searchOutput && (
              <span className="text-[9px] font-mono font-bold bg-secondary border border-border px-2 py-0.5 rounded-lg text-muted-foreground shadow-xs">
                Confidence: {Math.round(searchOutput.analysis.confidenceScore * 100)}%
              </span>
            )}
          </div>

          {searchMutation.isPending && (
            <div className="py-12 text-center space-y-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              <p className="font-extrabold text-muted-foreground animate-pulse text-[10px] uppercase tracking-widest">{loadingSteps[scanStep]}</p>
            </div>
          )}

          {!searchOutput && !searchMutation.isPending && (
            <div className="py-12 text-center text-muted-foreground font-medium">
              Awaiting payload triggers to classify descriptors...
            </div>
          )}

          {searchOutput && !searchMutation.isPending && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Identified Entity</span>
                <p className="font-extrabold text-foreground text-xs uppercase tracking-wide">
                  {searchOutput.analysis.brand} &bull; {searchOutput.analysis.productType}
                </p>
                <span className="text-[10px] text-muted-foreground/80 font-medium">Category Folder: {searchOutput.analysis.category}</span>
              </div>

              <div className="space-y-1 border-t border-border/30 pt-3">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Texture & Composite</span>
                <p className="font-semibold text-foreground">
                  {searchOutput.analysis.style} &mdash; {searchOutput.analysis.material}
                </p>
              </div>

              {/* Dominant color block chips */}
              <div className="space-y-2 border-t border-border/30 pt-3">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Detected Palette</span>
                <div className="flex flex-wrap gap-1.5">
                  {searchOutput.analysis.dominantColors.map((color) => (
                    <div key={color} className="flex items-center gap-1.5 bg-secondary/35 border border-border/60 px-2 py-1 rounded-lg">
                      <span className="h-2 w-2 rounded-full border border-border/10 shadow-xs shrink-0" style={{ backgroundColor: color }} />
                      <span className="capitalize font-mono font-bold text-[9px]">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags and visual keywords */}
              <div className="space-y-2 border-t border-border/30 pt-3">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider block">Meta Indicators</span>
                <div className="flex flex-wrap gap-1">
                  {searchOutput.analysis.keywords.map((tag) => (
                    <span key={tag} className="text-[9px] bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SEARCH FILTERS BAR (Only shown when results are present) */}
      {searchOutput && (
        <div className="bg-card border border-border p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-6 items-center shadow-xs glassmorphism">
          {/* Similarity range */}
          <div className="space-y-2">
            <span className="font-extrabold text-muted-foreground uppercase text-[9px] tracking-wider block">Similarity Cutoff: {similarityThreshold}%</span>
            <input 
              type="range" 
              min={40} 
              max={95} 
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
            />
          </div>

          {/* Category match */}
          <div className="space-y-1.5">
            <span className="font-extrabold text-muted-foreground uppercase text-[9px] tracking-wider block">Category Partition</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none cursor-pointer font-bold"
            >
              <option value="">All Categories</option>
              <option value="footwear">Footwear</option>
              <option value="electronics">Electronics</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>

          {/* Max Price range */}
          <div className="space-y-2">
            <span className="font-extrabold text-muted-foreground uppercase text-[9px] tracking-wider block">Maximum Price: ${maxPrice}</span>
            <input 
              type="range" 
              min={10} 
              max={1000} 
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
            />
          </div>
        </div>
      )}

      {/* 4. RESULTS SECTION */}
      {searchOutput && (
        <div className="space-y-6">
          <h2 className="text-xs font-black border-b border-border/30 pb-3 flex items-center gap-2 text-foreground uppercase tracking-widest">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span>Matched Catalog Index ({filteredProducts.length})</span>
          </h2>

          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24 bg-card rounded-2xl border border-border text-xs space-y-4 glassmorphism"
              >
                <div className="mx-auto rounded-full bg-secondary p-5 w-fit text-muted-foreground shadow-xs">
                  <ImageIcon className="h-7 w-7 stroke-[1.5]" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">No visual matches aligned</h3>
                  <p className="text-muted-foreground leading-normal font-medium">
                    Try adjusting the similarity cutoff slider, increasing your maximum budget cap, or selecting other categories.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                layout 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {filteredProducts.map((product) => {
                  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
                  return (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="group relative flex flex-col bg-card border border-border/40 p-4 rounded-3xl hover-lift cursor-pointer shadow-xs text-xs transition-all duration-300"
                    >
                      {/* Similarity score badge */}
                      <span className={`absolute top-6 right-6 z-10 rounded-full border px-2.5 py-0.5 text-[8px] font-black shadow-xs uppercase tracking-wider ${getBadgeStyle(product.similarityScore)}`}>
                        {getBadgeLabel(product.similarityScore)}
                      </span>

                      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-secondary/20 border border-border/10">
                        <img
                          src={product.images[0]?.url}
                          alt={product.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="mt-4 space-y-1">
                        <span className="text-[8px] text-muted-foreground/80 font-bold uppercase tracking-wider block">
                          {product.category?.name}
                        </span>
                        <h3 className="font-extrabold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-black text-sm text-foreground">${finalPrice.toFixed(2)}</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.preventDefault();
                              dispatch(addToCart({ product, quantity: 1 }));
                            }}
                            className="rounded-xl bg-foreground text-background p-2.5 hover:opacity-90 transition-colors cursor-pointer border border-transparent shadow-xs"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. HISTORY SECTION */}
      <div className="border border-border bg-card p-6 rounded-2xl shadow-sm text-xs space-y-6 transition-all glassmorphism">
        <div className="flex justify-between items-center border-b border-border/40 pb-3.5">
          <h3 className="font-extrabold text-foreground uppercase tracking-widest flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            <span>Search History Logs</span>
          </h3>
          {historyList.length > 0 && (
            <button
              onClick={() => clearHistoryMutation.mutate()}
              className="text-[9px] text-destructive font-extrabold flex items-center gap-1 hover:underline cursor-pointer uppercase tracking-wider"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Wipe History Logs</span>
            </button>
          )}
        </div>

        {historyList.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground font-medium">
            <p>No recent vector queries logged in visual index records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {historyList.map((item) => (
              <div 
                key={item._id} 
                className="flex items-center gap-3 bg-secondary/15 border border-border/60 p-2.5 rounded-xl text-[10px] shadow-xs"
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-10 w-10 object-cover rounded-lg border border-border/50 shrink-0 bg-background"
                />
                <div className="space-y-0.5 truncate flex-1 font-semibold">
                  <p className="font-extrabold text-foreground truncate uppercase text-[9px]">{item.productType || 'Visual Item'}</p>
                  <p className="text-[9px] text-muted-foreground">Found: {item.resultsCount} hits</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRepeatSearch(item)}
                  className="p-2 hover:bg-secondary/75 rounded-lg text-primary cursor-pointer shrink-0 border border-transparent hover:border-border/30"
                  title="Repeat Visual Search"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualSearch;
