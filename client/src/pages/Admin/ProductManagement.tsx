import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Product, Category } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  PlusCircle, 
  FileSpreadsheet, 
  Download, 
  Tag, 
  FolderPlus, 
  Award, 
  Ticket,
  Star,
  Check,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductFormInputs {
  title: string;
  description: string;
  price: number;
  discountPrice: number;
  inventory: number;
  category: string;
  tags: string;
}

interface CouponFormInputs {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minAmount: number;
  usageLimit: number;
  expiryDate: string;
}

const ProductManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'brands' | 'coupons' | 'reviews'>('products');
  
  // Product modals states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  
  // Custom categories/brands forms states
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const { register: registerProduct, handleSubmit: handleProductSubmit, reset: resetProductForm, setValue: setProductValue } = useForm<ProductFormInputs>();
  const { register: registerCoupon, handleSubmit: handleCouponSubmit, reset: resetCouponForm } = useForm<CouponFormInputs>();

  // Fetch Products
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-list'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data;
    },
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories as Category[];
    },
  });

  const products: Product[] = productsData?.products || [];
  const categories: Category[] = categoriesData || [];

  // MOCK Coupons state
  const [coupons, setCoupons] = useState<any[]>([
    { code: 'Sphere10', type: 'percentage', value: 10, minAmount: 50, limit: 100, active: true },
    { code: 'WelcomeFlat', type: 'flat', value: 15, minAmount: 100, limit: 50, active: true }
  ]);

  // MOCK Reviews state
  const [reviews, setReviews] = useState<any[]>([
    { id: 'rev1', productTitle: 'Veloce Running Shoes', user: 'Alex Mercer', rating: 5, comment: 'Exceptional carbon matrix support! Fits perfectly.', status: 'approved' },
    { id: 'rev2', productTitle: 'Smartwatch v2', user: 'Sarah Connor', rating: 2, comment: 'Battery drains in under 8 hours. Poor performance.', status: 'pending' }
  ]);

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
    },
  });

  // Add/Edit product mutation
  const saveProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
      } else {
        await api.post('/products', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setSelectedFiles(null);
      resetProductForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to save catalog product');
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/categories', { name, slug: name.toLowerCase().replace(/ /g, '-') });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
      setNewCatName('');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-list'] });
    }
  });

  const openAddProductModal = () => {
    setEditingProduct(null);
    setSelectedFiles(null);
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setSelectedFiles(null);
    setIsProductModalOpen(true);
    setProductValue('title', product.title);
    setProductValue('description', product.description);
    setProductValue('price', product.price);
    setProductValue('discountPrice', product.discountPrice);
    setProductValue('inventory', product.inventory);
    setProductValue('category', product.category._id);
    setProductValue('tags', product.tags.join(', '));
  };

  const onProductSubmit = (data: ProductFormInputs) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', String(data.price));
    formData.append('discountPrice', String(data.discountPrice || 0));
    formData.append('inventory', String(data.inventory));
    formData.append('category', data.category);

    const tagsArr = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagsArr));

    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('images', selectedFiles[i]);
      }
    }

    saveProductMutation.mutate(formData);
  };

  // CSV export utility
  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'Title', 'Price', 'DiscountPrice', 'Inventory', 'Category'].join(',');
    const rows = products.map((p) => 
      `"${p._id}","${p.title}",${p.price},${p.discountPrice},${p.inventory},"${p.category.name}"`
    );
    const content = [headers, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Catalog_ShopSphere_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // CSV import simulation
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(`CSV file "${file.name}" detected. Simulating catalog import. Seeding 5 matching items to database...`);
  };

  // Bulk select toggles
  const toggleSelectProduct = (id: string) => {
    setBulkSelected((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Confirm bulk deleting ${bulkSelected.length} products?`)) {
      bulkSelected.forEach((id) => deleteMutation.mutate(id));
      setBulkSelected([]);
    }
  };

  return (
    <div className="space-y-10 text-xs antialiased font-semibold">
      {/* Title header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground uppercase">Catalog & Departments</h1>
          <p className="text-muted-foreground text-xs font-medium">Manage product listings, directories, discount coupons, and review approvals.</p>
        </div>

        {/* Tab switcher navigation */}
        <div className="flex gap-1 bg-card/45 p-1 rounded-2xl border border-border/40 overflow-x-auto w-full md:w-auto scrollbar-none">
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2.5 font-bold rounded-xl cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap text-[9px] ${activeTab === 'products' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
            Products
          </button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2.5 font-bold rounded-xl cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap text-[9px] ${activeTab === 'categories' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
            Categories
          </button>
          <button onClick={() => setActiveTab('coupons')} className={`px-4 py-2.5 font-bold rounded-xl cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap text-[9px] ${activeTab === 'coupons' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
            Coupons
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2.5 font-bold rounded-xl cursor-pointer transition-all uppercase tracking-wider whitespace-nowrap text-[9px] ${activeTab === 'reviews' ? 'bg-foreground text-background shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>
            Reviews
          </button>
        </div>
      </div>

      {/* TABS PAGES */}
      
      {/* 1. PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={openAddProductModal}
                className="flex items-center gap-1.5 rounded-xl bg-foreground text-background px-4 py-2.5 font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer text-[10px] uppercase tracking-wider"
              >
                <Plus className="h-4 w-4 stroke-[2]" />
                <span>Add Product</span>
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 font-bold text-foreground hover:bg-secondary/40 transition-all shadow-2xs cursor-pointer text-[10px] uppercase tracking-wider"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                <span>Export CSV</span>
              </button>
              <label className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 font-bold text-foreground hover:bg-secondary/40 transition-all shadow-2xs cursor-pointer text-[10px] uppercase tracking-wider">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span>Import CSV</span>
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>
            </div>

            {bulkSelected.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-xl bg-destructive text-white px-4.5 py-2.5 font-bold hover:bg-destructive/95 transition-all shadow-xs cursor-pointer text-[10px] uppercase tracking-wider"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected ({bulkSelected.length})</span>
              </button>
            )}
          </div>

          {/* Product Listing Table */}
          <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                    <th className="p-4 w-12 text-center select-none">
                      <input 
                        type="checkbox" 
                        onChange={(e) => setBulkSelected(e.target.checked ? products.map(p => p._id) : [])}
                        checked={bulkSelected.length === products.length && products.length > 0}
                        className="h-3.5 w-3.5"
                      />
                    </th>
                    <th className="p-4">Item Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {products.map((p) => {
                    const isChecked = bulkSelected.includes(p._id);
                    return (
                      <tr key={p._id} className="hover:bg-secondary/10 transition-colors">
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleSelectProduct(p._id)}
                            className="h-3.5 w-3.5"
                          />
                        </td>
                        <td className="p-4 flex items-center gap-3">
                          <img src={p.images[0]?.url} alt="" className="h-9 w-9 rounded-xl object-cover border border-border/40 shrink-0 bg-background" />
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-foreground line-clamp-1 uppercase text-[10px]">{p.title}</p>
                            <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[120px]">{p._id.substring(18)}</p>
                          </div>
                        </td>
                        <td className="p-4 capitalize font-bold text-foreground">{p.category?.name}</td>
                        <td className="p-4 font-extrabold font-mono text-foreground">
                          {p.discountPrice > 0 ? (
                            <span className="text-foreground">
                              ${p.discountPrice.toFixed(2)}{' '}
                              <span className="text-muted-foreground line-through font-normal text-[9px] ml-1">${p.price.toFixed(2)}</span>
                            </span>
                          ) : (
                            `$${p.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="p-4 font-extrabold font-mono">
                          <span className={p.inventory < 10 ? 'text-rose-500 font-bold' : 'text-foreground'}>
                            {p.inventory} units
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button onClick={() => openEditProductModal(p)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteMutation.mutate(p._id)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-destructive transition-colors cursor-pointer inline-flex">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Category Form - 4 cols */}
          <div className="lg:col-span-4 bg-card border border-border/40 p-5 rounded-3xl shadow-2xs space-y-5 glassmorphism">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Create Directory</h3>
              <p className="text-muted-foreground text-[10px] font-medium">Add product departments and catalogs indexes.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Living Room Decor"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                />
              </div>
              <button 
                onClick={() => newCatName.trim() && createCategoryMutation.mutate(newCatName)}
                className="w-full flex items-center justify-center gap-1.5 bg-foreground text-background font-bold py-3 rounded-xl cursor-pointer hover:opacity-90 transition-all shadow-xs text-xs uppercase tracking-wider"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Save Department</span>
              </button>
            </div>
          </div>

          {/* Categories List - 8 cols */}
          <div className="lg:col-span-8 bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
            <div className="p-4 border-b border-border/40 bg-secondary/15">
              <h3 className="font-black text-xs uppercase tracking-wider">Active Directories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Slug Index</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-4 font-extrabold text-foreground uppercase text-[10px]">{cat.name}</td>
                      <td className="p-4 font-mono text-muted-foreground font-semibold">{cat.slug}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => deleteCategoryMutation.mutate(cat._id)}
                          className="p-2 hover:bg-secondary text-destructive rounded-xl transition-colors cursor-pointer inline-flex"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <div className="space-y-1">
              <h3 className="font-black text-sm text-foreground uppercase tracking-wide">Promotion Coupons</h3>
              <p className="text-muted-foreground text-xs font-medium">Verify or delete configured promotion coupon rewards.</p>
            </div>
            <button 
              onClick={() => setIsCouponModalOpen(true)}
              className="flex items-center gap-1.5 bg-foreground text-background font-bold px-4 py-2.5 rounded-xl cursor-pointer text-[10px] uppercase tracking-wider shadow-xs"
            >
              <Ticket className="h-4 w-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount Type</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Min. Subtotal</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-4 font-black font-mono text-foreground text-sm uppercase">{c.code}</td>
                      <td className="p-4 capitalize font-bold text-foreground">{c.type}</td>
                      <td className="p-4 font-extrabold font-mono text-foreground">{c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                      <td className="p-4 text-muted-foreground font-mono font-bold">${c.minAmount}</td>
                      <td className="p-4">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-black text-[8px] uppercase tracking-wider text-emerald-500">
                          Active
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setCoupons(prev => prev.filter(item => item.code !== c.code))}
                          className="p-2 hover:bg-secondary text-destructive rounded-xl cursor-pointer inline-flex"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-2xs glassmorphism">
          <div className="p-4 border-b border-border/40 bg-secondary/15">
            <h3 className="font-black text-xs uppercase tracking-wider">Product Feedback Reviews</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/15 font-black text-muted-foreground uppercase text-[8px] tracking-widest">
                  <th className="p-4">Product</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Comment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 animate-fadeIn">
                {reviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-4 font-extrabold text-foreground uppercase text-[10px]">{rev.productTitle}</td>
                    <td className="p-4 text-muted-foreground font-bold">{rev.user}</td>
                    <td className="p-4">
                      <div className="text-amber-500 font-extrabold flex items-center gap-1 font-mono">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </td>
                    <td className="p-4 italic text-zinc-500 max-w-xs truncate font-medium">{rev.comment}</td>
                    <td className="p-4 text-right space-x-1">
                      {rev.status === 'pending' && (
                        <button 
                          onClick={() => setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'approved' } : r))}
                          className="p-1.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all cursor-pointer inline-flex"
                          title="Approve Review"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setReviews(prev => prev.filter(r => r.id !== rev.id))}
                        className="p-1.5 bg-secondary text-destructive rounded-xl hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer inline-flex animate-fadeIn"
                        title="Delete Review"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADD/EDIT PRODUCT MODAL OVERLAY */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-card rounded-3xl border border-border/50 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex h-14 items-center justify-between border-b border-border/40 px-6 bg-secondary/15">
              <h2 className="font-black text-sm text-foreground uppercase tracking-wider">
                {editingProduct ? 'Modify Product' : 'Publish Product'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="rounded-full p-1.5 hover:bg-secondary cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit(onProductSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Product Title</label>
                <input
                  type="text"
                  required
                  {...registerProduct('title')}
                  placeholder="e.g. Smartwatch V3 Pro"
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Category</label>
                <select required {...registerProduct('category')} className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none cursor-pointer">
                  <option value="">Select a Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Price ($)</label>
                  <input type="number" step="0.01" required {...registerProduct('price')} placeholder="149.00" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Discount Price ($)</label>
                  <input type="number" step="0.01" {...registerProduct('discountPrice')} placeholder="129.00" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Stock Inventory</label>
                  <input type="number" required {...registerProduct('inventory')} placeholder="50" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Tags (comma separated)</label>
                  <input type="text" {...registerProduct('tags')} placeholder="smartwatch, gadget, wear" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Description</label>
                <textarea required rows={3} {...registerProduct('description')} placeholder="Detail hardware specifications..." className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none" />
              </div>

              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Images {editingProduct && '(Optional replace)'}</label>
                <input type="file" multiple required={!editingProduct} onChange={(e) => setSelectedFiles(e.target.files)} accept="image/*" className="w-full cursor-pointer text-xs" />
              </div>

              <button
                type="submit"
                disabled={saveProductMutation.isPending}
                className="w-full rounded-xl bg-foreground text-background py-3 font-bold hover:opacity-90 transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
              >
                {saveProductMutation.isPending ? 'Publishing details...' : 'Publish product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE COUPON MODAL OVERLAY */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border/50 overflow-hidden shadow-2xl flex flex-col">
            <div className="flex h-14 items-center justify-between border-b border-border/40 px-6 bg-secondary/15">
              <h2 className="font-black text-sm text-foreground uppercase tracking-wider">Create Promotion Coupon</h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="rounded-full p-1.5 hover:bg-secondary cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form 
              onSubmit={handleCouponSubmit((data) => {
                setCoupons(prev => [...prev, { code: data.code, type: data.discountType, value: data.discountValue, minAmount: data.minAmount, limit: data.usageLimit, active: true }]);
                setIsCouponModalOpen(false);
                resetCouponForm();
              })}
              className="p-6 space-y-4 text-xs font-semibold"
            >
              <div className="space-y-1">
                <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Coupon Code</label>
                <input type="text" required {...registerCoupon('code')} placeholder="e.g. SummerDeal20" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Discount Type</label>
                  <select {...registerCoupon('discountType')} className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none cursor-pointer">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Discount Value</label>
                  <input type="number" required {...registerCoupon('discountValue')} placeholder="10" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Min. Subtotal ($)</label>
                  <input type="number" {...registerCoupon('minAmount')} placeholder="50" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-muted-foreground uppercase text-[8px] tracking-wider block">Usage Limit</label>
                  <input type="number" {...registerCoupon('usageLimit')} placeholder="100" className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs focus-visible:outline-none font-mono" />
                </div>
              </div>
              <button type="submit" className="w-full rounded-xl bg-foreground text-background py-3 font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer text-xs uppercase tracking-wider">
                Save Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
